"""
Weighted multi-signal authenticity score.
Each algorithm contributes a penalty deducted from 100. The final score
drives both the numeric display (secondary) and the forensic_certainty verdict
(primary display, used as the institutional-grade conclusion).
"""

# ── Weights (reference-based) ────────────────────────────────────────────────
SUM_CHECK = 0.30 + 0.15 + 0.15 + 0.15 + 0.10 + 0.10 + 0.05  # = 1.00
_W_SSIM = 0.30
_W_HASH = 0.15
_W_COLOR = 0.15
_W_ELA = 0.13   # reduced by 0.02 to make room for AI signal
_W_DCT = 0.09   # reduced by 0.01
_W_NOISE = 0.10
_W_KEYPOINT = 0.05
_W_AI = 0.08    # AI generation detection (referenceless; always active)

# ── Forensic certainty thresholds ────────────────────────────────────────────
# Labels represent certainty that the image was manipulated.
# When there is no evidence of manipulation the label is "Verified Authentic".
_CERTAINTY_MAP: list[tuple[int, str]] = [
    (85, "Verified Authentic"),          # score >= 85
    (70, "Likely Authentic"),            # score [70, 85)
    (40, "Inconclusive"),               # score [40, 70)
    (25, "Probable Manipulation"),       # score [25, 40)
    (10, "Highly Probable Manipulation"),# score [10, 25)
    (0,  "Near Certain Manipulation"),   # score < 10
]


def compute_score(
    ssim_score: float,
    hash_votes_flagged: bool,
    kl_divergence_mean: float,
    ela_mean_residual: float,
    double_compression: bool,
    noise_inconsistent: bool,
    match_rate: float,
    metadata_integrity: str,
    c2pa_status: str,
    c2pa_ai_generated: bool,
    ai_flagged: bool,
    ai_probability: float,
    has_reference: bool,
) -> tuple[int, str, str, float]:
    """
    Returns (authenticity_score, risk_level, forensic_certainty, manipulation_probability).
    Score 100 = authentic  /  Score 0 = fully manipulated.
    """
    score = 100.0

    if has_reference:
        # SSIM penalty: ssim=1.0 → 0 pts;  ssim=0.0 → -30 pts
        score -= (1.0 - ssim_score) * (_W_SSIM * 100)

        # Hash votes penalty
        if hash_votes_flagged:
            score -= _W_HASH * 100

        # Color histogram KL penalty: kl ≥ 0.3 → full penalty
        kl_penalty = min(kl_divergence_mean / 0.3, 1.0) * (_W_COLOR * 100)
        score -= kl_penalty

        # Noise inconsistency penalty
        if noise_inconsistent:
            score -= _W_NOISE * 100

        # Keypoint match rate penalty
        if match_rate < 0.30:
            keypoint_penalty = (1.0 - match_rate / 0.30) * (_W_KEYPOINT * 100)
            score -= keypoint_penalty

    # ELA penalty: ela_mean ≥ 8 → full penalty (rescaled to 13 pts)
    ela_penalty = min(ela_mean_residual / 8.0, 1.0) * (_W_ELA * 100)
    score -= ela_penalty

    # DCT double-compression penalty
    if double_compression:
        score -= _W_DCT * 100

    # AI-generation penalty (referenceless — always applied)
    # If C2PA manifest definitively declares AI-generated content, treat as
    # 100% AI probability for scoring — the manifest is stronger evidence
    # than our spectral heuristics alone.
    effective_ai_prob = ai_probability
    if c2pa_ai_generated and c2pa_status in ("verified", "trust_warning"):
        effective_ai_prob = max(ai_probability, 1.0)  # treat as certain
    ai_penalty = effective_ai_prob * (_W_AI * 100)
    score -= ai_penalty

    # C2PA penalties
    if c2pa_status == "invalid":
        score -= 5.0  # cryptographic failure — tampered after signing
    if c2pa_ai_generated and c2pa_status in ("verified", "trust_warning"):
        score -= 15.0  # manifest explicitly declares AI-generated content

    # Metadata penalty (up to −5 pts)
    if metadata_integrity == "anomalies_detected":
        score -= 5.0

    # Without reference, cap penalty at a conservative level so we
    # never claim "manipulation" based purely on ELA/DCT alone.
    if not has_reference:
        score = max(score, 45.0)

    score = round(max(0.0, min(100.0, score)))

    # Risk label (backward-compat)
    if score >= 70:
        risk_level = "Low risk"
    elif score >= 40:
        risk_level = "Medium risk"
    else:
        risk_level = "High manipulation risk"

    # Forensic certainty
    forensic_certainty = "Inconclusive"
    for threshold, label in _CERTAINTY_MAP:
        if score >= threshold:
            forensic_certainty = label
            break

    # Override floor: a C2PA-verified AI declaration is definitive evidence —
    # never report as "Likely Authentic" or "Verified Authentic" if the
    # signer explicitly declared AI-generated content.
    if c2pa_ai_generated and c2pa_status in ("verified", "trust_warning"):
        if forensic_certainty in ("Verified Authentic", "Likely Authentic", "Inconclusive"):
            forensic_certainty = "Probable Manipulation"

    manipulation_probability = round((100 - score) / 100, 3)

    return score, risk_level, forensic_certainty, manipulation_probability
