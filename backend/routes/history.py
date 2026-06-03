from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from services.mongodb_service import get_analysis_batch_by_batch_id, get_analysis_batches
from utils.export import generate_excel_report, generate_pdf_report


router = APIRouter()


@router.get("/")
def get_history(limit: int = Query(default=25, ge=1, le=100)):
    return {"items": get_analysis_batches(limit=limit)}


@router.get("/{batch_id}")
def get_history_batch(batch_id: str):
    batch = get_analysis_batch_by_batch_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch not found: {batch_id}")
    return batch


@router.get("/{batch_id}/export/excel")
def export_batch_excel(batch_id: str):
    batch = get_analysis_batch_by_batch_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch not found: {batch_id}")

    report_bytes = generate_excel_report(batch)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"sentrix_report_{batch_id}_{timestamp}.xlsx"
    return StreamingResponse(
        BytesIO(report_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{batch_id}/export/pdf")
def export_batch_pdf(batch_id: str):
    batch = get_analysis_batch_by_batch_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch not found: {batch_id}")

    report_bytes = generate_pdf_report(batch)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"sentrix_report_{batch_id}_{timestamp}.pdf"
    return StreamingResponse(
        BytesIO(report_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
