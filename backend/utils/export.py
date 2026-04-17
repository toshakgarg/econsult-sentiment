from datetime import datetime
from io import BytesIO
from typing import Any, Dict, Iterable

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font


def _safe_get_sentiment_count(batch: Dict[str, Any], key: str) -> int:
    sentiment_counts = batch.get("sentiment_counts", {})
    return int(sentiment_counts.get(key, 0))


def generate_excel_report(batch: Dict[str, Any]) -> bytes:
    workbook = Workbook()
    summary_sheet = workbook.active
    summary_sheet.title = "Batch Summary"

    summary_sheet["A1"] = "eCon-Sentiment Analysis Report"
    summary_sheet["A1"].font = Font(size=16, bold=True)
    summary_sheet.merge_cells("A1:B1")

    summary_sheet["A3"] = "Batch ID"
    summary_sheet["B3"] = str(batch.get("batch_id", ""))
    summary_sheet["A4"] = "Generated At"
    created_at = batch.get("created_at")
    if isinstance(created_at, datetime):
        summary_sheet["B4"] = created_at.isoformat()
    else:
        summary_sheet["B4"] = str(created_at or "")

    summary_sheet["A5"] = "Total Comments"
    summary_sheet["B5"] = int(batch.get("total_comments", 0))
    summary_sheet["A6"] = "Positive"
    summary_sheet["B6"] = _safe_get_sentiment_count(batch, "positive")
    summary_sheet["A7"] = "Negative"
    summary_sheet["B7"] = _safe_get_sentiment_count(batch, "negative")
    summary_sheet["A8"] = "Neutral"
    summary_sheet["B8"] = _safe_get_sentiment_count(batch, "neutral")

    details_sheet = workbook.create_sheet(title="Comment Analysis")
    headers = [
        "Comment ID",
        "Stakeholder Type",
        "Provision No",
        "Date",
        "Original Comment",
        "Cleaned Comment",
        "Language",
        "Sentiment",
        "Positive Score",
        "Neutral Score",
        "Negative Score",
        "Summary",
    ]
    details_sheet.append(headers)

    for cell in details_sheet[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")

    results: Iterable[Dict[str, Any]] = batch.get("results", [])
    for result in results:
        confidence = result.get("sentiment_confidence", {})
        details_sheet.append(
            [
                result.get("comment_id", ""),
                result.get("stakeholder_type", ""),
                result.get("provision_no", ""),
                result.get("date", ""),
                result.get("original_comment", ""),
                result.get("cleaned_comment", ""),
                result.get("language", ""),
                result.get("sentiment", ""),
                float(confidence.get("positive", 0.0)),
                float(confidence.get("neutral", 0.0)),
                float(confidence.get("negative", 0.0)),
                result.get("summary", ""),
            ]
        )

    for column in ("A", "B", "C", "D", "G", "H"):
        details_sheet.column_dimensions[column].width = 18
    details_sheet.column_dimensions["E"].width = 60
    details_sheet.column_dimensions["F"].width = 60
    details_sheet.column_dimensions["L"].width = 70

    output = BytesIO()
    workbook.save(output)
    return output.getvalue()
