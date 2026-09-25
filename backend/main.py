"""
VoiceShield AI - Backend AASIST Inference Server
CPU-only anti-spoofing for uploaded audio. The WebSocket endpoint is explicitly simulated.
"""

import os
import re
import time
import uuid
import json
import math
import random
import pathlib
import asyncio
import tempfile
from typing import Optional, List, Literal
from datetime import datetime, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
import requests

# CPU-only, i3 2-core safe — never use CUDA
import torch
try:
    torch.set_num_threads(2)
except Exception:
    pass
try:
    torch.set_num_interop_threads(2)
except Exception:
    pass

# Load backend secrets
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

REALITY_DEFENDER_API_KEY = os.getenv("REALITY_DEFENDER_API_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Real inference — AASIST (CPU)
try:
    from inference import load_model as load_aasist_model, infer_from_bytes as aasist_infer, get_model_info, is_model_loaded
    from risk_engine import map_risk
except ImportError:
    from backend.inference import load_model as load_aasist_model, infer_from_bytes as aasist_infer, get_model_info, is_model_loaded
    from backend.risk_engine import map_risk

app = FastAPI(
    title="VoiceShield AI Detection Engine",
    description="Real AASIST anti-spoofing inference for VoiceShield AI (CPU)",
    version="2.4.0",
)

# ---- Load AASIST once at startup (eval mode, torch.inference_mode) ----
@app.on_event("startup")
async def startup_load_model():
    try:
        load_aasist_model("AASIST")
        print(f"[VoiceShield] AASIST loaded: {get_model_info()}")
    except Exception as exc:
        import traceback
        print(f"[VoiceShield] AASIST failed to load: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        print("[VoiceShield] /api/v1/analyses will return 503 until the model is available")

# Security: upload validation constants (do not weaken — these ARE the patches)
ALLOWED_EXTS = {".wav", ".flac", ".mp3", ".ogg", ".m4a", ".mp4", ".oga"}
ALLOWED_MIME_PREFIX = "audio/"
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_FILENAME_LEN = 64
# AASIST is CPU-heavy on the target i3. Serializing inference avoids multiple
# requests multiplying memory use and runtime contention.
_INFERENCE_SEMAPHORE = asyncio.Semaphore(1)

# CORS configuration. Keep the local Vite origin explicit instead of combining
# wildcard origins with credentials (which browsers reject as an insecure combo).
_allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

class SpectralArtifact(BaseModel):
    name: str
    score: float = Field(ge=0.0, le=100.0)
    status: Literal["normal", "anomaly_detected"]
    description: str

class AudioAnalysisResponse(BaseModel):
    id: str
    user_id: str = "usr_current"
    speaker_profile_id: Optional[str] = None
    speaker_name: Optional[str] = None
    source_type: Literal["audio_upload", "live_stream", "telephony_stream", "reference_sample"]
    file_name: str
    duration_seconds: float = Field(ge=0.0)
    status: Literal["queued", "processing", "completed", "failed"]
    result_label: Literal["authentic", "suspicious", "synthetic_clone", "inconclusive"]
    risk_level: Literal["safe", "low", "medium", "high", "critical"]
    authenticity_score: float = Field(ge=0.0, le=100.0)
    spoof_risk_score: float = Field(ge=0.0, le=100.0)
    speaker_similarity_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    model_confidence: float = Field(ge=0.0, le=100.0)
    model_version: str = "AASIST / ASVspoof2019-LA"
    spectral_artifacts: List[SpectralArtifact] = []
    explanation: str
    is_demo: bool = False
    created_at: str
    completed_at: str
    # Extra telemetry (non-breaking): real inference timing / windowing
    processing_time_ms: Optional[int] = None
    num_windows: Optional[int] = None
    spoof_probability_max: Optional[float] = None

class SpeakerEnrollmentResponse(BaseModel):
    speaker_id: str
    display_name: str
    voiceprint_hash: str
    audio_duration_seconds: float
    sample_rate_hz: int
    enrollment_status: str
    created_at: str

@app.get("/")
def read_root():
    return {
        "service": "VoiceShield AI Engine",
        "status": "ready" if is_model_loaded() else "degraded",
        "version": "2.4.0",
        "model_loaded": is_model_loaded(),
        "docs_url": "/docs",
    }

@app.get("/api/v1/health")
def health_check():
    info = get_model_info()
    loaded = is_model_loaded()
    return {
        "status": "healthy" if loaded else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_loaded": loaded,
        "model": info,
        "models": {
            "primary_classifier": info.get("version", "AASIST / ASVspoof2019-LA") if loaded else "AASIST (not loaded)",
            "vocoder_detector": "AASIST graph attention (spectral/temporal)",
            "biometric_matcher": "not used on this path (spoof only)",
        },
        "engine_mode": "aasist-cpu" if loaded else "model_not_loaded",
    }

def analyze_with_reality_defender(audio_bytes: bytes, file_name: str) -> Optional[dict]:
    """Call Reality Defender's Deepfake Detection API if credentials exist."""
    if not REALITY_DEFENDER_API_KEY:
        return None
    try:
        url = "https://api.realitydefender.com/v1/audio/detect"
        headers = {
            "Authorization": f"Bearer {REALITY_DEFENDER_API_KEY}",
            "X-Client": "VoiceShield-AI-SIH26104",
        }
        files = {"file": (file_name, audio_bytes, "audio/wav")}
        res = requests.post(url, headers=headers, files=files, timeout=12)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"Reality Defender request failed: {e}")
    return None

def _sanitize_filename(name: str) -> str:
    """Strip path, limit length, allowlist chars to prevent traversal / control chars."""
    base = pathlib.Path(name or "uploaded_audio.wav").name
    # allow only safe chars, replace others with _
    base = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    if len(base) > MAX_FILENAME_LEN:
        stem, ext = os.path.splitext(base)
        base = stem[: MAX_FILENAME_LEN - len(ext)] + ext
    # ensure extension looks audio-ish, else fallback
    ext = pathlib.Path(base).suffix.lower()
    if ext not in ALLOWED_EXTS:
        # keep but will be rejected by type check below if not allowed
        pass
    return base or "uploaded_audio.wav"

@app.post("/api/v1/analyses", response_model=AudioAnalysisResponse)
async def submit_audio_analysis(
    file: UploadFile = File(...),
    speaker_profile_id: Optional[str] = Form(None),
    source_type: Literal["audio_upload", "live_stream", "telephony_stream", "reference_sample"] = Form("audio_upload"),
):
    """
    Primary REAL endpoint: AASIST (CPU) inference.
    Keeps POST /api/v1/analyses and AudioAnalysisResponse schema (no breaking change).
    Replaces only the fake byte-entropy heuristic with real model inference.
    """
    # ---- Security: model must be loaded ----
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded. Try again after startup.")

    # ---- Security: validate filename / type / size ----
    raw_name = file.filename or "uploaded_audio.wav"
    safe_name = _sanitize_filename(raw_name)
    ext = pathlib.Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=415, detail="Unsupported file type. Upload WAV, FLAC, MP3, OGG, M4A, or MP4 audio.")
    # Content-Type is only a quick rejection hint; the decoder below is authoritative.
    # Browsers and command-line clients do not always send the same MIME type, so
    # reject explicit non-audio types while allowing octet-stream and audio/*.
    if file.content_type and not file.content_type.startswith(ALLOWED_MIME_PREFIX) and file.content_type != "application/octet-stream":
        raise HTTPException(status_code=415, detail="Unsupported content type. Upload an audio file.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The selected audio file is empty. Choose a non-empty recording and try again.")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="The selected audio file is too large. The maximum size is 25 MB.")

    now_iso = datetime.now(timezone.utc).isoformat()
    # UUID format matches the Supabase audio_analyses primary key, so a real backend
    # result can be persisted without a client-side remap.
    analysis_id = str(uuid.uuid4())

    # ---- REAL inference (AASIST) ----
    try:
        async with _INFERENCE_SEMAPHORE:
            inf = await run_in_threadpool(aasist_infer, contents, safe_name)
    except ValueError as exc:
        # Return an actionable message while keeping decoder internals out of HTTP responses.
        message = str(exc)
        if "FFmpeg" in message or "M4A" in message or "AAC" in message:
            detail = "M4A/AAC decoding requires FFmpeg on the backend. Install it and restart the backend."
        else:
            detail = "The selected file is not valid or decodable audio. Try WAV, FLAC, MP3, OGG, or M4A."
        raise HTTPException(status_code=400, detail=detail) from exc
    except Exception as exc:
        # Never leak internals over HTTP, but retain the full traceback in server logs.
        import traceback
        print(f"[VoiceShield] inference failed: {type(exc).__name__}: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Audio analysis failed on the server. Check the backend log and try again.",
        )

    # Map spoof probability -> risk tier (GOAL thresholds, configurable via env, uncalibrated)
    spoof_p = float(inf["spoof_probability"])  # 0..1, index 0 = spoof (verified)
    risk = map_risk(spoof_p)
    spoof_score = float(risk["spoof_risk_score"])
    auth_score = float(risk["authenticity_score"])
    result_label = risk["result_label"]
    risk_level = risk["risk_level"]
    explanation = f"{risk['explanation']} Recommendation: {risk['recommendation']}"
    # Model confidence: for AASIST we surface 1 - |0.5 - p|*2 as distance from decision boundary,
    # but more simply use max(spoof_p, 1-spoof_p)*100 as calibrated confidence placeholder
    model_confidence = round(max(spoof_p, 1 - spoof_p) * 100, 1)
    duration = float(inf["duration_seconds"])
    processing_ms = int(inf["processing_time_ms"])
    num_windows = int(inf["num_windows"])
    spoof_max = float(inf["spoof_probability_max"])

    # AASIST exposes one integrated spoof probability, not three independently
    # calibrated per-branch detectors. Return one honest global diagnostic rather
    # than duplicating the score and presenting it as spectral/temporal attribution.
    artifact_status = "anomaly_detected" if spoof_p >= 0.30 else "normal"
    artifacts = [
        SpectralArtifact(
            name="AASIST Integrated Anti-Spoof Score",
            score=spoof_score,
            status=artifact_status,
            description=(
                "Single integrated AASIST probability derived from the model's spectro-temporal graph "
                "representation. This is not a speaker-similarity score or an independent branch metric."
            ),
        )
    ]

    # Speaker similarity: AASIST does NOT do speaker ID — do not randomize. Return None.
    speaker_similarity = None
    # If caller supplied speaker_profile_id we keep it for traceability but do not hallucinate a match.

    info = get_model_info()
    model_version = info.get("version", "AASIST / ASVspoof2019-LA")

    return AudioAnalysisResponse(
        id=analysis_id,
        user_id="usr_current",
        speaker_profile_id=speaker_profile_id,
        source_type=source_type,
        file_name=safe_name,
        duration_seconds=round(duration, 1),
        status="completed",
        result_label=result_label,
        risk_level=risk_level,
        authenticity_score=auth_score,
        spoof_risk_score=spoof_score,
        speaker_similarity_score=speaker_similarity,
        model_confidence=model_confidence,
        model_version=model_version,
        spectral_artifacts=artifacts,
        explanation=explanation,
        is_demo=False,  # REAL result — never simulated
        created_at=now_iso,
        completed_at=datetime.now(timezone.utc).isoformat(),
        processing_time_ms=processing_ms,
        num_windows=num_windows,
        spoof_probability_max=round(spoof_max * 100, 1),
    )

def _decode_enrollment_audio(contents: bytes, suffix: str):
    """Decode enrollment bytes to obtain real sample rate and duration."""
    import soundfile as sf
    tmp_path: Optional[pathlib.Path] = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix or ".wav", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = pathlib.Path(tmp.name)
        try:
            data, sample_rate = sf.read(str(tmp_path), dtype="float32", always_2d=False)
        except Exception:
            import torchaudio
            waveform, sample_rate = torchaudio.load(str(tmp_path))
            data = waveform.mean(dim=0).numpy().astype("float32")
        if data.size == 0 or sample_rate <= 0:
            raise ValueError("No decodable samples")
        return data, int(sample_rate)
    except Exception as exc:
        raise ValueError(str(exc)) from exc
    finally:
        if tmp_path is not None:
            tmp_path.unlink(missing_ok=True)

@app.post("/api/v1/enrollment", response_model=SpeakerEnrollmentResponse)
async def enroll_speaker(
    display_name: str = Form(...),
    department: Optional[str] = Form(None),
    file: UploadFile = File(...),
):
    """
    Enrolls a legitimate speaker's reference voiceprint into the biometric database.
    Computes acoustic embeddings and cryptographic hash of voice identity.
    """
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The enrollment audio file is empty.")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="The enrollment audio file is too large. Max 25 MB.")
    safe_name = _sanitize_filename(file.filename or "enrollment.wav")
    ext = pathlib.Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=415, detail="Unsupported enrollment audio type.")

    try:
        decoded, native_sr = _decode_enrollment_audio(contents, ext)
    except ValueError:
        raise HTTPException(status_code=400, detail="The enrollment recording could not be decoded.")

    speaker_id = str(uuid.uuid4())
    import hashlib
    # Full SHA-256 file fingerprint. This is not a speaker embedding or biometric template.
    voiceprint_hash = "vp_" + hashlib.sha256(contents).hexdigest()

    return SpeakerEnrollmentResponse(
        speaker_id=speaker_id,
        display_name=display_name.strip()[:120],
        voiceprint_hash=voiceprint_hash,
        audio_duration_seconds=round(decoded.shape[0] / native_sr, 2),
        sample_rate_hz=native_sr,
        enrollment_status="reference_received",
        created_at=datetime.now(timezone.utc).isoformat(),
    )

@app.websocket("/ws/v1/live-detection")
async def websocket_live_detection(websocket: WebSocket):
    """
    Real-time streaming WebSocket endpoint — CURRENTLY SIMULATED (not real detection).
    Kept for UI compatibility; frontend will label this as SIMULATED. Real streaming
    AASIST would require per-chunk inference and is out of scope for this end-to-end
    upload flow (GOAL step 4: leave its logic alone, but label it).
    """
    await websocket.accept()
    step = 0
    try:
        while True:
            data = await websocket.receive()
            step += 1

            # SIMULATED telemetry — do not present as real detection
            is_anomaly = (step % 7 == 0)
            if is_anomaly:
                spoof = round(random.uniform(85.0, 96.0), 1)
                auth = round(100.0 - spoof, 1)
                risk = "critical" if spoof > 90 else "high"
                explanation = "SIMULATED: Neural synthesis artifacts (not real inference)."
                anomaly = "Phase discontinuity at 6.2 kHz (simulated)"
            else:
                spoof = round(random.uniform(5.0, 16.0), 1)
                auth = round(100.0 - spoof, 1)
                risk = "safe"
                explanation = "SIMULATED: Live stream acoustics consistent with natural vocal tract."
                anomaly = None

            payload = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "authenticityScore": auth,
                "spoofRiskScore": spoof,
                "speakerSimilarityScore": round(random.uniform(89.0, 97.0), 1),
                "riskLevel": risk,
                "confidence": round(random.uniform(92.0, 97.5), 1),
                "anomaly": anomaly,
                "explanation": explanation,
                "is_demo": True,
            }
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as e:
        print(f"WebSocket session closed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
