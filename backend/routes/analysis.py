from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator

from models.schemas import AnalysisResult, BatchResult, Comment, WordCloudResponse
from services.azure_language import analyze_sentiment
from services.auth import get_current_user_id
from services.huggingface_service import generate_summary
from services.mongodb_service import get_uploaded_comments, save_analysis_batch
from services.wordcloud_service import generate_word_cloud_base64
from utils.preprocess import clean_text, detect_language


router = APIRouter()


class AnalysisRequest(BaseModel):
    upload_id: Optional[str] = None
    comments: List[Comment] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_input_source(self):
        if not self.upload_id and not self.comments:
            raise ValueError("Provide either upload_id or comments.")
        return self


@router.post("/", response_model=BatchResult)
def run_analysis(
    request: AnalysisRequest, owner_id: str = Depends(get_current_user_id)
):
    source_comments: List[Dict[str, str]]
    if request.upload_id:
        source_comments = get_uploaded_comments(request.upload_id, owner_id) or []
        if not source_comments:
            raise HTTPException(
                status_code=404,
                detail=f"No uploaded comments found for upload_id: {request.upload_id}",
            )
    else:
        source_comments = [comment.model_dump() for comment in request.comments]

    analyzed_results: List[AnalysisResult] = []
    cleaned_for_word_cloud: List[str] = []
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}

    for raw_comment in source_comments:
        original_comment = str(raw_comment.get("comment_text", "")).strip()
        cleaned_comment = clean_text(original_comment)
        language = detect_language(cleaned_comment)

        if cleaned_comment:
            try:
                sentiment_response = analyze_sentiment(
                    cleaned_comment, language if language != "unknown" else "en"
                )
                summary = generate_summary(cleaned_comment)
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"AI processing failed for comment_id '{raw_comment.get('comment_id', '')}': {exc}"
                    ),
                ) from exc
            cleaned_for_word_cloud.append(cleaned_comment)
        else:
            sentiment_response = {
                "sentiment": "neutral",
                "confidence": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            }
            summary = "No analyzable comment text was provided."

        sentiment = str(sentiment_response["sentiment"]).lower()
        if sentiment not in sentiment_counts:
            sentiment = "neutral"
        sentiment_counts[sentiment] += 1

        analyzed_results.append(
            AnalysisResult(
                comment_id=str(raw_comment.get("comment_id", "")),
                stakeholder_type=str(raw_comment.get("stakeholder_type", "")),
                provision_no=str(raw_comment.get("provision_no", "")),
                date=str(raw_comment.get("date", "")),
                original_comment=original_comment,
                cleaned_comment=cleaned_comment,
                language=language,
                sentiment=sentiment,
                sentiment_confidence=sentiment_response["confidence"],
                summary=summary,
            )
        )

    if not cleaned_for_word_cloud:
        raise HTTPException(
            status_code=400,
            detail="All comments are empty after preprocessing. Cannot generate a word cloud.",
        )
    try:
        word_cloud_base64 = generate_word_cloud_base64(cleaned_for_word_cloud)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    batch_payload = {
        "batch_id": str(uuid4()),
        "created_at": datetime.now(timezone.utc),
        "total_comments": len(analyzed_results),
        "sentiment_counts": sentiment_counts,
        "word_cloud": {"image_base64": word_cloud_base64},
        "results": [result.model_dump() for result in analyzed_results],
    }
    save_analysis_batch(batch_payload, owner_id)

    return BatchResult(
        batch_id=batch_payload["batch_id"],
        created_at=batch_payload["created_at"],
        total_comments=batch_payload["total_comments"],
        sentiment_counts=batch_payload["sentiment_counts"],
        word_cloud=WordCloudResponse(image_base64=word_cloud_base64),
        results=analyzed_results,
    )
