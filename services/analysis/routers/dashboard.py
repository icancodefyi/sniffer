from fastapi import APIRouter

router = APIRouter()

# Placeholder metrics — replace with real DB aggregation queries
_MOCK_STATS = {
    "total_cases": 142,
    "manipulation_rate": 0.38,
    "tamper_type_distribution": {
        "face_swap": 31,
        "splicing": 22,
        "inpainting": 18,
        "generative_ai": 27,
        "unknown": 44,
    },
    "severity_distribution": {
        "high": 41,
        "medium": 58,
        "low": 43,
    },
    "c2pa_credential_presence": {
        "verified": 12,
        "invalid": 9,
        "not_present": 121,
    },
}


@router.get("/")
def get_dashboard():
    return _MOCK_STATS
