from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, ConfigDict, Field


class Comment(BaseModel):
    comment_id: str
    stakeholder_type: str
    provision_no: str
    comment_text: str
    date: str


class AnalysisResult(BaseModel):
    comment_id: str
    stakeholder_type: str
    provision_no: str
    date: str
    original_comment: str
    cleaned_comment: str
    language: str
    sentiment: Literal["positive", "negative", "neutral"]
    sentiment_confidence: Dict[str, float] = Field(default_factory=dict)
    summary: str


class WordCloudResponse(BaseModel):
    image_base64: str


class BatchResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    batch_id: str
    created_at: datetime
    total_comments: int
    sentiment_counts: Dict[str, int]
    word_cloud: WordCloudResponse
    results: List[AnalysisResult]
