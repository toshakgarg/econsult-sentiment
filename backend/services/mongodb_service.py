import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient


_client: Optional[MongoClient] = None


def _get_connection_string() -> str:
    connection_string = os.getenv("MONGODB_URI", "").strip()
    if not connection_string:
        raise RuntimeError(
            "MongoDB connection string is missing. Set MONGODB_URI in backend/.env."
        )
    return connection_string


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(_get_connection_string(), serverSelectionTimeoutMS=5000)
    return _client


def get_database():
    db_name = os.getenv("MONGODB_DB_NAME", "econsult_sentiment").strip()
    return get_client()[db_name]


def _serialize_doc(document: Dict[str, Any]) -> Dict[str, Any]:
    doc = dict(document)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def save_uploaded_comments(
    source_file_name: str, comments: List[Dict[str, Any]], owner_id: str
) -> str:
    uploads_collection = get_database()["uploaded_comments"]
    upload_document = {
        "source_file_name": source_file_name,
        "owner_id": owner_id,
        "created_at": datetime.now(timezone.utc),
        "comments": comments,
    }
    insert_result = uploads_collection.insert_one(upload_document)
    return str(insert_result.inserted_id)


def get_uploaded_comments(upload_id: str, owner_id: str) -> Optional[List[Dict[str, Any]]]:
    uploads_collection = get_database()["uploaded_comments"]
    try:
        document = uploads_collection.find_one(
            {"_id": ObjectId(upload_id), "owner_id": owner_id}
        )
    except InvalidId as exc:
        raise RuntimeError(f"Invalid upload id format: {upload_id}") from exc
    if not document:
        return None
    return document.get("comments", [])


def save_analysis_batch(batch_data: Dict[str, Any], owner_id: str) -> str:
    analysis_collection = get_database()["analysis_batches"]
    batch_data["owner_id"] = owner_id
    analysis_collection.insert_one(batch_data)
    return batch_data["batch_id"]


def get_analysis_batches(owner_id: str, limit: int = 25) -> List[Dict[str, Any]]:
    analysis_collection = get_database()["analysis_batches"]
    cursor = (
        analysis_collection.find({"owner_id": owner_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [_serialize_doc(doc) for doc in cursor]


def get_analysis_batch_by_batch_id(
    batch_id: str, owner_id: str
) -> Optional[Dict[str, Any]]:
    analysis_collection = get_database()["analysis_batches"]
    document = analysis_collection.find_one(
        {"batch_id": batch_id, "owner_id": owner_id}
    )
    if not document:
        return None
    return _serialize_doc(document)
