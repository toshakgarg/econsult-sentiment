from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
import os
from concurrent.futures import TimeoutError
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field, model_validator

from models.schemas import AnalysisResult, BatchResult, Comment, WordCloudResponse
from services.azure_language import analyze_sentiment, analyze_sentiment_batch
from services.auth import get_current_user_id
from services.huggingface_service import generate_summary
from services.mongodb_service import (
    get_analysis_batch_by_batch_id,
    get_analysis_batch_by_idempotency_key,
    get_uploaded_comments,
    save_analysis_batch,
)
from services.wordcloud_service import generate_word_cloud_base64
from utils.preprocess import clean_text, detect_language


router = APIRouter()


@router.get("/progress/{batch_id}")
def get_analysis_progress(
    batch_id: str, owner_id: str = Depends(get_current_user_id)
):
    from services.mongodb_service import get_analysis_batch_by_batch_id

    batch = get_analysis_batch_by_batch_id(batch_id, owner_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Analysis batch not found.")
    total = int(batch.get("total_comments", 0))
    completed = int(batch.get("completed_comments", total))
    failed = int(batch.get("failed_comments", 0))
    status = batch.get("status", "completed")
    if status == "running":
        status = "abandoned" if not batch.get("heartbeat") else "running"
    return {
        "batch_id": batch_id,
        "status": status,
        "total": total,
        "completed": completed,
        "failed": failed,
        "percent": 100 if total == 0 else round(((completed + failed) / total) * 100),
    }


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
    request: AnalysisRequest,
    owner_id: str = Depends(get_current_user_id),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
):
    idempotency_key = (idempotency_key or "").strip() or None
    if idempotency_key:
        existing_batch = get_analysis_batch_by_idempotency_key(
            idempotency_key, owner_id
        )
        if existing_batch:
            return BatchResult.model_validate(existing_batch)

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
    analyzable_documents = []
    document_ids: List[str] = []
    max_summary_workers = int(os.getenv("SUMMARY_MAX_CONCURRENT", "4"))
    summary_futures: Dict[int, object] = {}
    cleaned_by_index: Dict[int, str] = {}
    for index, raw_comment in enumerate(source_comments):
        cleaned_comment = clean_text(str(raw_comment.get("comment_text", "")).strip())
        if cleaned_comment:
            cleaned_by_index[index] = cleaned_comment

    if cleaned_by_index:
        with ThreadPoolExecutor(max_workers=max_summary_workers) as executor:
            for index, cleaned_comment in cleaned_by_index.items():
                summary_futures[index] = executor.submit(generate_summary, cleaned_comment)

    for index, raw_comment in enumerate(source_comments):
        original_comment = str(raw_comment.get("comment_text", "")).strip()
        cleaned_comment = clean_text(original_comment)
        language = detect_language(cleaned_comment)

        if cleaned_comment:
            document_id = f"doc-{index}"
            document_ids.append(document_id)
            analyzable_documents.append(
                (document_id, cleaned_comment, language if language != "unknown" else "en")
            )
            cleaned_for_word_cloud.append(cleaned_comment)
        else:
            analyzable_documents.append((
                f"doc-{index}",
                "",
                "en",
            ))
            document_ids.append(f"doc-{index}")

    try:
        sentiment_results = analyze_sentiment_batch(
            [item for item in analyzable_documents if item[1]]
        )
    except RuntimeError:
        sentiment_results = {}

    for index, raw_comment in enumerate(source_comments):
        original_comment = str(raw_comment.get("comment_text", "")).strip()
        cleaned_comment = clean_text(original_comment)
        language = detect_language(cleaned_comment)
        document_id = f"doc-{index}"
        processing_status = "success"
        processing_error = ""
        sentiment_response = sentiment_results.get(document_id)
        if not cleaned_comment:
            summary = "No analyzable comment text was provided."
            sentiment_response = {
                "sentiment": "neutral",
                "confidence": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            }
        else:
            if sentiment_response is None:
                try:
                    sentiment_response = analyze_sentiment(
                        cleaned_comment,
                        language if language != "unknown" else "en",
                    )
                except RuntimeError:
                    sentiment_response = {
                        "sentiment": "neutral",
                        "confidence": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
                    }
                    processing_status = "failed"
                    processing_error = "Sentiment provider failed for this comment."
            elif sentiment_response.get("processing_error"):
                processing_status = "failed"
                processing_error = "Sentiment provider failed for this comment."
            try:
                summary = summary_futures[index].result(timeout=70)
            except (RuntimeError, TimeoutError):
                summary = "Summary unavailable."
                processing_status = "partial" if processing_status != "failed" else "failed"
                processing_error = "Summary provider failed for this comment."

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
                processing_status=processing_status,
                processing_error=processing_error,
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
        "idempotency_key": idempotency_key,
        "status": "completed",
        "completed_comments": sum(
            1 for result in analyzed_results if result.processing_status == "success"
        ),
        "failed_comments": sum(
            1 for result in analyzed_results if result.processing_status != "success"
        ),
    }
    saved_batch_id = save_analysis_batch(batch_payload, owner_id)
    if saved_batch_id != batch_payload["batch_id"]:
        existing_batch = get_analysis_batch_by_batch_id(saved_batch_id, owner_id)
        if not existing_batch:
            raise HTTPException(
                status_code=503,
                detail="The previously saved analysis batch is unavailable.",
            )
        return BatchResult.model_validate(existing_batch)

    return BatchResult(
        batch_id=batch_payload["batch_id"],
        created_at=batch_payload["created_at"],
        total_comments=batch_payload["total_comments"],
        sentiment_counts=batch_payload["sentiment_counts"],
        word_cloud=WordCloudResponse(image_base64=word_cloud_base64),
        results=analyzed_results,
    )
