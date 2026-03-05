from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import hashlib
import time
import uuid

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# In-memory result store — replace with DB in production
_results: dict[str, dict] = {}


class AnalysisResult(BaseModel):
    case_id: str
    file_hash: str
    file_size: int
    mime_type: str
    timestamp: float
    authenticity_score: int
    risk_level: str
    manipulation_probability: float
    c2pa_status: str       # verified | invalid | not_present
    metadata_integrity: str  # ok | anomalies_detected | missing
    explanation: str
    signals: dict


def _risk_label(score: int) -> str:
    if score <= 30:
        return "High manipulation risk"
    if score <= 60:
        return "Medium risk"
    return "Low risk"


def _mock_analyze(file_bytes: bytes, mime_type: str, has_reference: bool) -> dict:
    """
    Placeholder analysis pipeline.
    Replace each section with real ML/CV logic:
      - C2PA: use c2pa-python or parse XMP
      - Metadata: use piexif / exifread
      - Perceptual hash + SSIM: use imagehash + scikit-image
      - Deepfake classifier: load ONNX / PyTorch model
      - Frequency analysis: cv2.dct / np.fft
    """
    # Derive a deterministic-ish score from file hash for demo purposes
    digest = int(hashlib.sha256(file_bytes).hexdigest(), 16)
    score = digest % 101  # 0–100

    c2pa_status = "not_present"
    metadata_integrity = "ok"
    manipulation_prob = round((100 - score) / 100, 2)

    explanation_parts = []
    if score <= 30:
        explanation_parts.append("High-confidence manipulation signals detected.")
    if metadata_integrity == "anomalies_detected":
        explanation_parts.append("Metadata contains editing software traces.")
    if c2pa_status == "not_present":
        explanation_parts.append("No Content Credentials (C2PA) present.")
    if not explanation_parts:
        explanation_parts.append("No significant manipulation indicators detected.")

    return {
        "authenticity_score": score,
        "risk_level": _risk_label(score),
        "manipulation_probability": manipulation_prob,
        "c2pa_status": c2pa_status,
        "metadata_integrity": metadata_integrity,
        "explanation": " ".join(explanation_parts),
        "signals": {
            "c2pa": c2pa_status,
            "metadata_integrity": metadata_integrity,
            "deepfake_classifier_score": manipulation_prob,
            "frequency_anomalies": False,
            "reference_based": has_reference,
        },
    }


@router.post("/{case_id}/run", response_model=AnalysisResult)
async def run_analysis(
    case_id: str,
    suspicious_image: UploadFile = File(...),
    reference_image: Optional[UploadFile] = File(None),
):
    # Validate MIME type
    if suspicious_image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {suspicious_image.content_type}. Allowed: jpg, jpeg, png, webp.",
        )

    file_bytes = await suspicious_image.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    has_reference = reference_image is not None
    result = _mock_analyze(file_bytes, suspicious_image.content_type, has_reference)

    result_obj = AnalysisResult(
        case_id=case_id,
        file_hash=hashlib.sha256(file_bytes).hexdigest(),
        file_size=len(file_bytes),
        mime_type=suspicious_image.content_type,
        timestamp=time.time(),
        **result,
    )
    _results[case_id] = result_obj.model_dump()
    return result_obj


@router.get("/{case_id}/result", response_model=AnalysisResult)
def get_analysis_result(case_id: str):
    result = _results.get(case_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not found.")
    return result
