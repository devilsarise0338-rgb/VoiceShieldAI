# VoiceShield AI - Python Detection Engine (FastAPI)

FastAPI-powered forensic audio detection backend for **VoiceShield AI** (Smart India Hackathon SIH26104).

## Capabilities

- **Audio Deepfake Classification (`POST /api/v1/analyses`)**: Inspects uploaded audio files for neural vocoder signatures, phase discontinuities, LPC residuals, and voice cloning markers. Integrates with the Reality Defender API.
- **Biometric Speaker Enrollment (`POST /api/v1/enrollment`)**: Enrolls authorized voiceprints and computes cryptographic audio hashes for identity defense.
- **Real-Time Live Call Inspection (`WebSocket /ws/v1/live-detection`)**: Continuous streaming audio inspection with sub-second latency for live telecom/webRTC streams.
- **Health Check (`GET /api/v1/health`)**: Reports active model checkpoints and engine status.

## Quickstart

### 1. Install Dependencies
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env` and supply private API keys:
```bash
cp .env.example .env
```

Variables:
- `REALITY_DEFENDER_API_KEY`: Private API key for Reality Defender deepfake detection.
- `HF_TOKEN`: Hugging Face user access token for speech models.

### 3. Start the Server
```bash
python main.py
# Or using uvicorn:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive OpenAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
