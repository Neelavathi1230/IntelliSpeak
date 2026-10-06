from fastapi import APIRouter, Depends

from app.api.deps import current_user
from app.models import User
from app.schemas import TextIn, ok
from app.services.nlp.analyzer import analyze_text

router = APIRouter(prefix="/api/analyze", tags=["analysis"])


@router.post("/text")
def analyze(body: TextIn, _: User = Depends(current_user)):
    return ok(analyze_text(body.text), "Analysis completed successfully")
