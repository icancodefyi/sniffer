from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Optional

from engine.models import AnalysisResult
from engine.pipeline import run_pipeline

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# In-memory result store — swap for a DB in production
_results: dict[str, dict] = {}


@router.post("/{case_id}/run", response_model=AnalysisResult)
async def run_analysis(
    case_id: str,
    suspicious_image: UploadFile = File(...),
    reference_image: Optional[UploadFile] = File(None),
):
    if suspicious_image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: {suspicious_image.content_type}. "
                "Allowed: image/jpeg, image/png, image/webp."
            ),
        )

    suspicious_bytes = await suspicious_image.read()
    if len(suspicious_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    reference_bytes: bytes | None = None
    if reference_image is not None:
        reference_bytes = await reference_image.read()

    result = run_pipeline(
        case_id=case_id,
        suspicious_bytes=suspicious_bytes,
        suspicious_mime=suspicious_image.content_type or "image/jpeg",
        reference_bytes=reference_bytes,
    )

    _results[case_id] = result.model_dump()
    return result


@router.get("/{case_id}/result", response_model=AnalysisResult)
def get_analysis_result(case_id: str):
    result = _results.get(case_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not found.")
    return result
