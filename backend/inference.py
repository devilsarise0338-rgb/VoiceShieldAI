"""
VoiceShield AI — AASIST Inference Module (CPU-only, i3 2-core safe)
- Vendor: backend/vendor/aasist (cloned 2026-09-24, LICENSE kept)
- Checkpoint: backend/vendor/aasist/models/weights/AASIST.pth (ASVspoof 2019 LA, EER 0.83%)
  & AASIST-L.pth (EER 0.99%, 85k params) — same nb_samp=64600
- Adapted from torch>=1.6 / torchcontrib era to current CPU torch 2.14+torchaudio 2.11:
  * Dropped torchcontrib (SWA) — inference-only, not needed.
  * load_state_dict(map_location="cpu") + model.to("cpu").eval()
  * torch.set_num_threads(2) at import (GOAL requires 2 threads, never CUDA).
  * soundfile + torchaudio for decode (ffmpeg note below).

STEP-1 VERIFICATION — class indices & preprocessing (do NOT assume):
  data_utils.py: genSpoof_list -> d_meta[key]=1 if label=="bonafide" else 0
    => train label 1=bonafide, 0=spoof
  main.py train_epoch: weight=[0.1,0.9], CrossEntropyLoss(batch_out, batch_y)
    where batch_y is d_meta value -> index 1 = bonafide, index 0 = spoof
  main.py produce_evaluation_file: batch_score = (batch_out[:,1]).data.cpu().numpy().ravel()
    => score written for EER is logit of index 1 (bonafide). evaluation.py
       comment "higher detection scores indicate stronger support for bona fide hypothesis"
       confirms index 1 higher => more bona fide.
  => Correct: bonafide = index 1, spoof = index 0.
     Spoof probability = softmax(logits, dim=1)[:,0]  (or 1 - softmax[:,1]).
     Do NOT swap.

  Preprocess as repo:
  - data_utils.pad(): x_len >= max_len => x[:max_len] (truncation)
                x_len < max_len => np.tile(x, (n+1))[:max_len] (repeat-pad)
  - Dataset_ASVspoof2019_devNeval uses pad() with cut=64600 (~4.0375s @16kHz)
  - Training uses pad_random() (random crop) — NOT used at eval/inference.
  - No amplitude normalization beyond soundfile's float32 [-1,1].
  - eval expects mono, 16kHz, float32 Tensor of exactly 64600 samples.
"""

import gc
import json
import time
import tempfile
import pathlib
from typing import List, Dict, Optional, Tuple

import numpy as np
import torch
import torch.nn.functional as F

# GOAL constraint: i3 2c/4t, CPU-only, never CUDA, 2 threads
try:
    torch.set_num_threads(2)
except Exception:
    pass
try:
    torch.set_num_interop_threads(2)
except Exception:
    pass
try:
    torch.use_deterministic_algorithms(False)
except Exception:
    pass

import soundfile as sf  # noqa: E402

# vendor import — keep isolated
import sys
VENDOR = pathlib.Path(__file__).parent / "vendor" / "aasist"
if str(VENDOR) not in sys.path:
    sys.path.insert(0, str(VENDOR))

_SAMPLERATE = 16000
_SAMPLE_RATE = 16000  # alias for shared use
_NB_SAMP = 64600  # from AASIST.conf / AASIST-L.conf (4 sec @16kHz)
_MAX_AUDIO_SECONDS = 30  # cap total audio processed (GOAL: protect i3)
_MAX_SAMPLES = 30 * 16000  # 480k
_MAX_WINDOWS = 15  # hard cap on number of windows scored
_OVERLAP_RATIO = 0.5  # 50% overlap for long clips

_MODEL: Optional[torch.nn.Module] = None
_MODEL_NAME: str = "not_loaded"
_MODEL_CFG: Optional[dict] = None

def _pad(x: np.ndarray, max_len: int = _NB_SAMP) -> np.ndarray:
    """Deterministic pad/repeat exactly as data_utils.pad() at eval."""
    x_len = x.shape[0]
    if x_len >= max_len:
        return x[:max_len]
    num_repeats = int(max_len / x_len) + 1
    padded = np.tile(x, (1, num_repeats))[:, :max_len][0] if x.ndim == 1 else np.tile(x, (num_repeats))[:max_len]
    # handle 1-D directly for speed
    if x.ndim == 1:
        # np.tile 1-D: simpler
        repeats = int(np.ceil(max_len / x_len))
        tiled = np.tile(x, repeats)[:max_len]
        return tiled
    return padded

def _ensure_mono_16k(waveform: np.ndarray, sr: int) -> np.ndarray:
    """Convert to mono float32, resample to 16kHz if needed."""
    # waveform from soundfile: shape (samples,) or (samples, channels)
    if waveform.ndim == 2:
        # soundfile returns (samples, channels) when always_2d=False default is mono already
        # but if stereo, average
        waveform = waveform.mean(axis=1)
    waveform = waveform.astype(np.float32, copy=False)
    if sr != _SAMPLE_RATE:
        # Use torchaudio resampler (CPU) for quality; fallback to numpy if unavailable
        try:
            import torchaudio
            # need shape (channels, samples)
            wav_t = torch.from_numpy(waveform).unsqueeze(0)  # (1, N)
            resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=_SAMPLE_RATE)
            wav_t = resampler(wav_t)
            waveform = wav_t.squeeze(0).numpy()
        except Exception:
            # very cheap linear interpolation fallback (rare path)
            import math
            duration = waveform.shape[0] / sr
            target_len = int(duration * _SAMPLE_RATE)
            # numpy interp
            old_idx = np.linspace(0, 1, num=waveform.shape[0])
            new_idx = np.linspace(0, 1, num=target_len)
            waveform = np.interp(new_idx, old_idx, waveform).astype(np.float32)
    # clip to [-1,1] (soundfile already normalized)
    # no further normalization; keep as-is (repo does not normalize)
    return waveform

def load_model(variant: str = "AASIST") -> torch.nn.Module:
    """
    Load AASIST (or AASIST-L) once. Call at server startup.
    variant: "AASIST" or "AASIST-L"
    """
    global _MODEL, _MODEL_NAME, _MODEL_CFG
    if _MODEL is not None and _MODEL_NAME == variant:
        return _MODEL

    if variant == "AASIST-L":
        conf_path = VENDOR / "config" / "AASIST-L.conf"
        ckpt_path = VENDOR / "models" / "weights" / "AASIST-L.pth"
        model_version = "AASIST-L / ASVspoof2019-LA"
    else:
        conf_path = VENDOR / "config" / "AASIST.conf"
        ckpt_path = VENDOR / "models" / "weights" / "AASIST.pth"
        model_version = "AASIST / ASVspoof2019-LA"

    with open(conf_path, "r") as f:
        cfg = json.load(f)

    model_cfg = cfg["model_config"]
    # Force CPU device regardless of config
    from importlib import import_module
    mod = import_module(f"models.{model_cfg['architecture']}")
    Model = getattr(mod, "Model")
    model = Model(model_cfg)
    # map_location cpu is critical on this machine (GOAL)
    state = torch.load(str(ckpt_path), map_location="cpu")
    model.load_state_dict(state)
    model.to("cpu")
    model.eval()
    _MODEL = model
    _MODEL_NAME = variant
    _MODEL_CFG = cfg
    return model

def is_model_loaded() -> bool:
    return _MODEL is not None

def get_model_info() -> Dict:
    if _MODEL is None or _MODEL_CFG is None:
        return {"loaded": False, "name": _MODEL_NAME, "nb_samp": _NB_SAMP, "sample_rate": _SAMPLE_RATE}
    return {
        "loaded": True,
        "name": "AASIST" if _MODEL_NAME == "AASIST" else "AASIST-L",
        "version": "AASIST / ASVspoof2019-LA" if _MODEL_NAME == "AASIST" else "AASIST-L / ASVspoof2019-LA",
        "nb_samp": _MODEL_CFG["model_config"]["nb_samp"],
        "sample_rate": _SAMPLE_RATE,
        "params": sum(p.numel() for p in _MODEL.parameters()),
    }

def _decode_audio(file_bytes: bytes, filename: str = "audio.wav") -> Tuple[np.ndarray, int]:
    """
    Decode bytes to (waveform mono float32 @ native sr, sr).
    Handles wav, flac, ogg via soundfile; mp3/m4a via torchaudio (ffmpeg).
    Writes bytes to a temp file that is deleted immediately after (even on failure).
    For mp3/m4a: torchaudio requires ffmpeg on Windows. Tell user how to install if missing.
    """
    suffix = pathlib.Path(filename).suffix.lower()
    # normalize containers we explicitly support
    allowed_suffixes = {".wav", ".flac", ".mp3", ".ogg", ".m4a", ".mp4", ".oga", ".wma", ".aac"}
    # but try anyway; error message will guide if unsupported
    tmp_path: Optional[pathlib.Path] = None
    try:
        # Use NamedTemporaryFile with delete=False so soundfile/torchaudio can open by path on Windows
        with tempfile.NamedTemporaryFile(suffix=suffix or ".wav", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = pathlib.Path(tmp.name)
        # First try soundfile (covers wav/flac/ogg)
        try:
            data, sr = sf.read(str(tmp_path), dtype="float32", always_2d=False)
            # sf.read returns (samples,) for mono, (samples, ch) for multi
            return data, sr
        except Exception as e_sf:
            # Fallback to torchaudio for mp3/m4a/others that need ffmpeg
            try:
                import torchaudio
                waveform, sr = torchaudio.load(str(tmp_path))  # (ch, samples)
                # torchaudio loads as float32 in [-1,1]
                if waveform.ndim == 2 and waveform.shape[0] > 1:
                    waveform = waveform.mean(dim=0)
                else:
                    waveform = waveform.squeeze(0)
                return waveform.numpy().astype(np.float32), sr
            except Exception as e_ta:
                # Surface ffmpeg hint for mp3/m4a
                msg = str(e_ta)
                hint = ""
                if suffix in {".mp3", ".m4a", ".mp4", ".aac", ".wma"}:
                    hint = (
                        " This container needs FFmpeg on Windows. Install via: "
                        "winget install Gyan.FFmpeg  (or) choco install ffmpeg  (or) scoop install ffmpeg ; "
                        "then restart the backend. Verify with: ffmpeg -version"
                    )
                raise ValueError(
                    f"Could not decode audio '{filename}' (soundfile error: {e_sf}; torchaudio error: {msg}).{hint}"
                )
    finally:
        if tmp_path is not None:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass

def _window_waveform(waveform: np.ndarray) -> List[np.ndarray]:
    """
    Split longer clips (> nb_samp) into windows with 50% overlap,
    capped at MAX_WINDOWS / MAX_SAMPLES. Returns list of windows each of length nb_samp.
    For short clips, returns single padded window.
    """
    # Cap total samples first (protect i3)
    if waveform.shape[0] > _MAX_SAMPLES:
        waveform = waveform[:_MAX_SAMPLES]

    if waveform.shape[0] <= _NB_SAMP:
        return [_pad(waveform, _NB_SAMP)]

    hop = int(_NB_SAMP * (1 - _OVERLAP_RATIO))
    windows: List[np.ndarray] = []
    start = 0
    while start + _NB_SAMP <= waveform.shape[0] and len(windows) < _MAX_WINDOWS:
        windows.append(waveform[start : start + _NB_SAMP])
        start += hop
    # Ensure last window covers tail (if we stopped early, take trailing window)
    if len(windows) < _MAX_WINDOWS and start < waveform.shape[0]:
        # last window is trailing _NB_SAMP samples
        windows.append(_pad(waveform[-_NB_SAMP:], _NB_SAMP)) if waveform.shape[0] >= _NB_SAMP else None
        # deduplicate if we already have tail
        if len(windows) >= 2 and np.array_equal(windows[-1], windows[-2]):
            windows.pop()
    # If still no windows (edge), fallback
    if not windows:
        windows = [_pad(waveform[:_NB_SAMP], _NB_SAMP)]
    return windows[:_MAX_WINDOWS]

@torch.inference_mode()
def _score_windows(windows: List[np.ndarray]) -> List[float]:
    """
    Score each window. Returns per-window spoof probabilities (0..1).
    Class 0=spoof, 1=bonafide => spoof_prob = softmax(logits,1)[:,0]
    """
    if _MODEL is None:
        raise RuntimeError("AASIST model not loaded. Call load_model() at startup.")
    spoof_probs: List[float] = []
    for w in windows:
        x = torch.from_numpy(w).unsqueeze(0).to("cpu")  # (1, 64600)
        # model returns (last_hidden, logits) where logits shape (1,2)
        _, logits = _MODEL(x)
        probs = F.softmax(logits, dim=1)  # (1,2)
        spoof_p = float(probs[0, 0].item())  # index 0 = spoof (verified in STEP1)
        spoof_probs.append(spoof_p)
    return spoof_probs

def infer_from_bytes(file_bytes: bytes, filename: str = "audio.wav") -> Dict:
    """
    Main entry for FastAPI: decode bytes, preprocess, window, score, aggregate.
    Returns dict with spoof_probability, per-window scores, processing_time_ms, etc.
    No secrets logged. Temp file is deleted even on failure (see _decode_audio).
    """
    t0 = time.perf_counter()
    # Decode
    raw_wav, sr = _decode_audio(file_bytes, filename)
    # Preprocess to mono 16k
    wav = _ensure_mono_16k(raw_wav, sr)
    # Cap & window
    windows = _window_waveform(wav)
    # Score
    per_window = _score_windows(windows)
    # Aggregate
    mean_p = float(np.mean(per_window)) if per_window else 0.0
    max_p = float(np.max(per_window)) if per_window else 0.0
    # For backward compat, spoof_probability = mean (stable), also expose max for "most suspicious window"
    spoof_probability = mean_p
    duration_seconds = float(wav.shape[0] / _SAMPLE_RATE)
    num_windows = len(windows)
    processing_time_ms = int((time.perf_counter() - t0) * 1000)

    # Clean up any large tensors explicitly (help i3 GC)
    gc.collect()

    return {
        "spoof_probability": spoof_probability,  # 0..1, index 0 = spoof (verified)
        "spoof_probability_max": max_p,
        "per_window_scores": per_window,
        "num_windows": num_windows,
        "duration_seconds": duration_seconds,
        "sample_rate": _SAMPLE_RATE,
        "nb_samp": _NB_SAMP,
        "processing_time_ms": processing_time_ms,
        "model_name": _MODEL_NAME if _MODEL is not None else "not_loaded",
        "model_version": get_model_info().get("version", ""),
    }

# Optional helper for file path (scripts/test_inference.py)
def infer_from_path(path: str) -> Dict:
    p = pathlib.Path(path)
    data = p.read_bytes()
    return infer_from_bytes(data, p.name)
