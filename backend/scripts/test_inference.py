#!/usr/bin/env python
"""
Quick CLI: python backend/scripts/test_inference.py <path/to/audio.wav>
Prints spoof probability, tier, timing — REAL AASIST output, no mock.
"""
import sys
import pathlib
import argparse

# Ensure backend is on path
BACKEND = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
try:
    sys.path.insert(0, str(BACKEND / "vendor" / "aasist"))
except Exception:
    pass

import torch
torch.set_num_threads(2)

from inference import load_model, infer_from_path
from risk_engine import map_risk

def main():
    ap = argparse.ArgumentParser(description="VoiceShield AASIST single-file test")
    ap.add_argument("audio", help="Path to audio file (wav/flac/mp3/ogg/m4a)")
    ap.add_argument("--variant", default="AASIST", choices=["AASIST", "AASIST-L"], help="Model variant")
    args = ap.parse_args()

    p = pathlib.Path(args.audio)
    if not p.exists():
        print(f"File not found: {p}", file=sys.stderr)
        sys.exit(2)

    print(f"Loading {args.variant} ...")
    load_model(args.variant)
    print(f"Scoring {p} ...")
    res = infer_from_path(str(p))
    prob = res["spoof_probability"]
    tier = map_risk(prob)

    print(f"\nFile: {p.name}")
    print(f"Duration: {res['duration_seconds']:.2f}s, windows: {res['num_windows']}, per_window: {[round(x*100,1) for x in res['per_window_scores']]}")
    print(f"Spoof probability: {prob:.4f} ({prob*100:.1f}%)")
    print(f"  mean {res['spoof_probability']*100:.1f}% / max {res['spoof_probability_max']*100:.1f}%")
    print(f"Tier: {tier['result_label']} / {tier['risk_level']} — {tier['recommendation']}")
    print(f"Explanation: {tier['explanation']}")
    print(f"Model: {res['model_version']}  time: {res['processing_time_ms']} ms")
    # Also print raw for copy/paste
    print(f"\nJSON: {res}")

if __name__ == "__main__":
    main()
