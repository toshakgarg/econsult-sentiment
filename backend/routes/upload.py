from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from services.mongodb_service import save_uploaded_comments


router = APIRouter()

REQUIRED_COLUMNS = [
    "comment_id",
    "stakeholder_type",
    "provision_no",
    "comment_text",
    "date",
]
ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx"}


def _normalize_record(record: Dict[str, Any]) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    for column in REQUIRED_COLUMNS:
        value = record.get(column)
        if pd.isna(value):
            normalized[column] = ""
        else:
            normalized[column] = str(value).strip()
    return normalized


@router.post("/")
async def upload_comments(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload a CSV, XLS or XLSX file.",
        )

    raw_content = await file.read()
    if not raw_content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        if extension == ".csv":
            dataframe = pd.read_csv(BytesIO(raw_content))
        else:
            dataframe = pd.read_excel(BytesIO(raw_content))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse uploaded file: {exc}",
        ) from exc

    missing_columns = [column for column in REQUIRED_COLUMNS if column not in dataframe]
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing_columns)}",
        )

    selected_df = dataframe[REQUIRED_COLUMNS].copy()
    normalized_rows: List[Dict[str, str]] = [
        _normalize_record(record) for record in selected_df.to_dict(orient="records")
    ]

    upload_id = save_uploaded_comments(file.filename, normalized_rows)
    return {
        "upload_id": upload_id,
        "total_comments": len(normalized_rows),
        "required_columns": REQUIRED_COLUMNS,
        "preview": normalized_rows[:5],
    }
