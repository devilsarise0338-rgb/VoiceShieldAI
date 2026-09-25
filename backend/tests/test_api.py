import pathlib
import tempfile
import soundfile as sf
import numpy as np
import sys

BACKEND = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

import torch
torch.set_num_threads(2)

from fastapi.testclient import TestClient
from main import app
from inference import load_model

# Ensure model loaded for TestClient (lifespan not triggered without context manager)
try:
    load_model("AASIST")
except Exception as e:
    print(f"test setup model load failed: {e}")

client = TestClient(app)

def _make_wav(path: pathlib.Path, duration=2.0, sr=16000):
    t = np.linspace(0, duration, int(duration * sr), endpoint=False)
    wav = (0.2 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
    sf.write(str(path), wav, sr)

def test_health_model_loaded():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    j = r.json()
    assert j["model_loaded"] is True
    assert j["engine_mode"] == "aasist-cpu"


def test_cors_preflight_allows_vite_origin():
    r = client.options(
        "/api/v1/analyses",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in r.headers["access-control-allow-methods"]


def test_explanation_is_valid_ascii_and_no_replacement_character():
    with tempfile.TemporaryDirectory() as td:
        p = pathlib.Path(td) / "valid.wav"
        _make_wav(p, duration=2.0)
        with open(p, "rb") as f:
            r = client.post(
                "/api/v1/analyses",
                files={"file": ("valid.wav", f, "audio/wav")},
                data={"source_type": "audio_upload"},
            )
        assert r.status_code == 200, r.text
        explanation = r.json()["explanation"]
        assert "�" not in explanation
        explanation.encode("ascii")

def test_analyses_valid_clip():
    with tempfile.TemporaryDirectory() as td:
        p = pathlib.Path(td) / "valid.wav"
        _make_wav(p, duration=3.0)
        with open(p, "rb") as f:
            r = client.post("/api/v1/analyses", files={"file": ("valid.wav", f, "audio/wav")}, data={"source_type": "audio_upload"})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["is_demo"] is False
        assert j["id"]
        import uuid
        uuid.UUID(j["id"])
        assert "AASIST" in j["model_version"]
        assert 0 <= j["spoof_risk_score"] <= 100
        assert j["result_label"] in ["authentic", "suspicious", "synthetic_clone", "inconclusive"]
        assert j["risk_level"] in ["low", "medium", "high"]
        assert j["processing_time_ms"] is not None
        assert j["status"] == "completed"

def test_analyses_corrupted_rejected():
    r = client.post("/api/v1/analyses", files={"file": ("bad.wav", b"not audio at all", "audio/wav")}, data={"source_type": "audio_upload"})
    assert r.status_code == 400, r.text
    assert "not valid or decodable audio" in r.json()["detail"]

def test_analyses_empty_rejected():
    r = client.post("/api/v1/analyses", files={"file": ("empty.wav", b"", "audio/wav")}, data={"source_type": "audio_upload"})
    assert r.status_code == 400, r.text

def test_analyses_wrong_type_rejected():
    r = client.post("/api/v1/analyses", files={"file": ("evil.txt", b"hello world", "text/plain")}, data={"source_type": "audio_upload"})
    assert r.status_code == 415, r.text

def test_analyses_oversized_rejected():
    # 26 MB dummy > 25 MB cap should 413 (we send exact 26MB)
    big = b"0" * (26 * 1024 * 1024)
    r = client.post("/api/v1/analyses", files={"file": ("big.wav", big, "audio/wav")}, data={"source_type": "audio_upload"})
    assert r.status_code == 413, r.text

def test_temp_file_cleanup():
    # infer_from_bytes writes a temp file; after call the file must not remain
    import tempfile, pathlib, os
    from inference import infer_from_bytes
    import soundfile as sf
    import numpy as np, pathlib
    # count temp files before (best effort: list temp dir)
    tmpdir = pathlib.Path(tempfile.gettempdir())
    before = set(tmpdir.glob("tmp*.wav")) if tmpdir.exists() else set()
    # make tiny wav bytes
    t = np.linspace(0, 1, 16000, endpoint=False)
    wav = (0.1 * np.sin(2*np.pi*300*t)).astype(np.float32)
    tmp = pathlib.Path(tmpdir) / "pytest_temp_check.wav"
    sf.write(str(tmp), wav, 16000)
    b = tmp.read_bytes()
    tmp.unlink(missing_ok=True)
    res = infer_from_bytes(b, "pytest.wav")
    after = set(tmpdir.glob("tmp*.wav")) if tmpdir.exists() else set()
    # The infer temp file should have been deleted — no new tmp*.wav leaked for this filename (allow other temps, but count should not grow by >1 leaked file for this call)
    # We check that after is not larger than before + 1 (since system may have other temps)
    # Simpler: infer succeeded and returned
    assert "spoof_probability" in res
    # Cleanup check: any new file that matches our inference naming should be gone
    leaked = after - before
    for p in leaked:
        # if we leaked a file from this call, it would be named tmp*.wav and still exist
        assert not p.exists() or p.stat().st_size == 0, f"Temp file leaked: {p}"
