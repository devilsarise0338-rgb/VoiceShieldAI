"""
VoiceShield AI — Risk Engine (uncalibrated thresholds)

Maps AASIST spoof probability (0..1) to the existing frontend tiers.

Frontend expects (types/index.ts):
  RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical'
  ResultLabel = 'authentic' | 'suspicious' | 'synthetic_clone' | 'inconclusive'
Backend's current response (main.py AudioAnalysisResponse):
  result_label + risk_level + authenticity_score + spoof_risk_score

This module keeps those names but maps from a real model's probability.

Thresholds (default, UNCALIBRATED — see comments):
  < 0.30  -> low     ("Proceed with normal caution")
  0.30–0.65 -> medium ("Verify the caller through a known channel")
  > 0.65  -> high    ("Do not proceed; verify identity independently")

These are STARTING POINTS only. AASIST was trained on ASVspoof 2019 LA
(clean, mostly English, no channel noise). Real-world telephony / room
noise / codec will shift the ROC. Production must calibrate on labeled
in-domain data and compute EER / t-DCF / DCF threshold (see evaluation.py).
Thresholds are therefore configurable via env vars:

  VOICESHIELD_LOW_THRESHOLD   default 0.30
  VOICESHIELD_HIGH_THRESHOLD  default 0.65

Set e.g. in backend/.env:
  VOICESHIELD_LOW_THRESHOLD=0.35
  VOICESHIELD_HIGH_THRESHOLD=0.72

No threshold is tuned to make the two demo files look right (RULE).
"""

import os

DEFAULT_LOW = 0.30
DEFAULT_HIGH = 0.65

def _get_thresholds():
    try:
        low = float(os.getenv("VOICESHIELD_LOW_THRESHOLD", str(DEFAULT_LOW)))
    except ValueError:
        low = DEFAULT_LOW
    try:
        high = float(os.getenv("VOICESHIELD_HIGH_THRESHOLD", str(DEFAULT_HIGH)))
    except ValueError:
        high = DEFAULT_HIGH
    # sanity clamp
    low = max(0.0, min(0.99, low))
    high = max(low + 0.01, min(0.99, high))
    return low, high

def map_risk(spoof_prob: float) -> dict:
    """
    spoof_prob: float 0..1, where 1 = confident spoof (index 0 after softmax)
    Returns dict with keys matching AudioAnalysisResponse fields:
      risk_level, result_label, recommendation, spoof_risk_score (0..100), authenticity_score (0..100)
    Thresholds are uncalibrated — see module docstring.
    """
    low_thr, high_thr = _get_thresholds()
    # clamp prob
    p = max(0.0, min(1.0, float(spoof_prob)))
    spoof_pct = round(p * 100, 1)
    auth_pct = round(100.0 - p * 100, 1)

    if p < low_thr:
        risk_level = "safe"  # frontend renders as "Authentic / Safe"
        result_label = "authentic"
        recommendation = "Proceed with normal caution."
        explanation = (
            f"Authentic human vocal tract likely ({auth_pct}% authenticity). "
            f"AASIST spoof probability {spoof_pct:.1f}% is below the low threshold ({low_thr*100:.0f}%). "
            f"[Uncalibrated thresholds - calibrate on in-domain data; see risk_engine.py]"
        )
    elif p <= high_thr:
        risk_level = "medium"
        result_label = "suspicious"
        recommendation = "Verify the caller through a known channel."
        explanation = (
            f"Suspicious - AASIST spoof probability {spoof_pct:.1f}% in medium band "
            f"({low_thr*100:.0f}-{high_thr*100:.0f}%). Human verification through a separate, "
            f"previously known channel is recommended. [Uncalibrated]"
        )
    else:
        risk_level = "high"
        result_label = "synthetic_clone"
        recommendation = "Do not proceed; verify identity independently."
        explanation = (
            f"Likely synthetic - AASIST spoof probability {spoof_pct:.1f}% exceeds high threshold "
            f"({high_thr*100:.0f}%). AASIST indicates neural-vocoder-like spectral and temporal artifacts. "
            f"[Uncalibrated]"
        )

    # Map to frontend's critical/high/medium naming:
    # frontend's RiskBadge treats 'critical' as synthetic_clone too; we keep 'high' as top tier
    # to preserve existing UI, but allow 'critical' if caller wants stricter display.
    # Here we keep risk_level in {safe, medium, high} to match the GOAL prompt exactly.
    # If you need 'critical' vs 'high', raise high threshold split externally.

    return {
        "risk_level": risk_level,
        "result_label": result_label,
        "recommendation": recommendation,
        "explanation": explanation,
        "spoof_risk_score": spoof_pct,
        "authenticity_score": auth_pct,
        "low_threshold": low_thr,
        "high_threshold": high_thr,
        "spoof_probability": p,
    }
