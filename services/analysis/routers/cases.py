from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import time

router = APIRouter()


class CaseCreate(BaseModel):
    anonymous: bool
    email: Optional[str] = None
    platform_source: str  # WhatsApp | Instagram | Telegram | Facebook | X/Twitter | Unknown website | Other
    impersonation: str    # Yes | No | Not sure
    harm_category: str    # Harassment | Reputation damage | Fraud or scam | Misinformation | Other
    notes: Optional[str] = None


class CaseResponse(BaseModel):
    case_id: str
    created_at: float
    anonymous: bool
    platform_source: str
    impersonation: str
    harm_category: str
    notes: Optional[str]


# In-memory store — replace with PostgreSQL in production
_cases: dict[str, dict] = {}


@router.post("/", response_model=CaseResponse, status_code=201)
def create_case(payload: CaseCreate):
    if not payload.anonymous and not payload.email:
        raise HTTPException(status_code=422, detail="Email required when not anonymous.")

    case_id = str(uuid.uuid4())
    record = {
        "case_id": case_id,
        "created_at": time.time(),
        "anonymous": payload.anonymous,
        # Do not store email in response; only persist server-side if needed
        "platform_source": payload.platform_source,
        "impersonation": payload.impersonation,
        "harm_category": payload.harm_category,
        "notes": payload.notes,
    }
    _cases[case_id] = record
    return record


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str):
    record = _cases.get(case_id)
    if not record:
        raise HTTPException(status_code=404, detail="Case not found.")
    return record
