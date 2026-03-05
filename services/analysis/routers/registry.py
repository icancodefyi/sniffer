from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import hashlib
import time
import uuid

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# In-memory store — replace with PostgreSQL in production
_registry: dict[str, dict] = {}


class RegistryEntry(BaseModel):
    reference_id: str
    file_hash: str
    image_fingerprint: str
    created_at: float


@router.post("/", response_model=RegistryEntry, status_code=201)
async def register_image(original_image: UploadFile = File(...)):
    if original_image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Allowed: jpg, jpeg, png, webp.",
        )

    file_bytes = await original_image.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # Prevent duplicate registrations of the same image
    for entry in _registry.values():
        if entry["file_hash"] == file_hash:
            return entry

    # Perceptual fingerprint placeholder — replace with imagehash.phash() in production
    fingerprint = hashlib.md5(file_bytes).hexdigest()

    reference_id = str(uuid.uuid4())
    entry = {
        "reference_id": reference_id,
        "file_hash": file_hash,
        "image_fingerprint": fingerprint,
        "created_at": time.time(),
    }
    _registry[reference_id] = entry
    return entry


@router.get("/check/{file_hash}")
def check_hash(file_hash: str):
    """Check if an image hash matches any registered original."""
    for entry in _registry.values():
        if entry["file_hash"] == file_hash:
            return {"match": True, "entry": entry}
    return {"match": False}
