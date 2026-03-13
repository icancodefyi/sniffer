import threading
import time
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from typing import Optional

from engine.discovery import run_discovery_scan
from engine.models import AnalysisResult, DiscoveryResult
from engine.pipeline import run_pipeline

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# In-memory result store — swap for a DB in production
_results: dict[str, dict] = {}
_discoveries: dict[str, dict] = {}
_discovery_lock = threading.Lock()


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


@router.post("/{case_id}/discover", response_model=DiscoveryResult, status_code=202)
async def start_discovery(
    case_id: str,
    suspicious_image: UploadFile = File(...),
    origin_domain: Optional[str] = Form(None),
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

    now = time.time()
    queued = DiscoveryResult(
        case_id=case_id,
        status="running",
        started_at=now,
        direct_matches=[],
        related_domains=[],
    )

    with _discovery_lock:
        _discoveries[case_id] = queued.model_dump()

    def progress_cb(update: dict) -> None:
        with _discovery_lock:
            current = _discoveries.get(case_id)
            if current is None:
                return
            current.update(update)

    def worker() -> None:
        try:
            result = run_discovery_scan(
                case_id=case_id,
                suspicious_bytes=suspicious_bytes,
                origin_domain=origin_domain,
                progress_cb=progress_cb,
            )
            with _discovery_lock:
                payload = result.model_dump()
                payload["started_at"] = _discoveries.get(case_id, {}).get("started_at", now)
                payload["finished_at"] = time.time()
                _discoveries[case_id] = payload
        except Exception as exc:
            with _discovery_lock:
                _discoveries[case_id] = DiscoveryResult(
                    case_id=case_id,
                    status="failed",
                    started_at=now,
                    finished_at=time.time(),
                    direct_matches=[],
                    related_domains=[],
                    error=str(exc),
                ).model_dump()

    threading.Thread(target=worker, daemon=True).start()
    return queued


@router.get("/{case_id}/discover", response_model=DiscoveryResult)
def get_discovery(case_id: str):
    result = _discoveries.get(case_id)
    if not result:
        raise HTTPException(status_code=404, detail="Discovery result not found.")
    return result
