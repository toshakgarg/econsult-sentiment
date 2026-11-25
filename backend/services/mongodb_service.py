import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError


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


def ensure_indexes() -> None:
    db = get_database()
    db["uploaded_comments"].create_index([("owner_id", 1), ("created_at", -1)], name="owner_upload_created")
    db["analysis_batches"].create_index([("owner_id", 1), ("created_at", -1)], name="owner_batch_created")
    db["analysis_batches"].create_index([("batch_id", 1), ("owner_id", 1)], name="batch_owner", unique=False)
    db["analysis_batches"].create_index(
        [("owner_id", 1), ("idempotency_key", 1)],
        name="owner_idempotency_unique",
        unique=True,
        partialFilterExpression={"idempotency_key": {"$type": "string"}},
    )
    db["identity_mappings"].create_index(
        "firebase_uid",
        name="firebase_uid_unique",
        unique=True,
        partialFilterExpression={"firebase_uid": {"$type": "string"}},
    )


def get_legacy_owner_mapping(firebase_uid: str) -> Optional[str]:
    document = get_database()["identity_mappings"].find_one(
        {"firebase_uid": firebase_uid}, {"legacy_owner_id": 1}
    )
    if not document:
        return None
    legacy_owner_id = document.get("legacy_owner_id")
    if not isinstance(legacy_owner_id, str) or not legacy_owner_id:
        raise RuntimeError("Firebase identity mapping has no valid legacy owner id.")
    return legacy_owner_id


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
    idempotency_key = batch_data.get("idempotency_key")
    if idempotency_key:
        existing = analysis_collection.find_one(
            {"owner_id": owner_id, "idempotency_key": idempotency_key},
            {"batch_id": 1},
        )
        if existing:
            return str(existing["batch_id"])

    try:
        analysis_collection.insert_one(batch_data)
    except DuplicateKeyError:
        if idempotency_key:
            existing = analysis_collection.find_one(
                {"owner_id": owner_id, "idempotency_key": idempotency_key},
                {"batch_id": 1},
            )
            if existing:
                return str(existing["batch_id"])
        raise
    return batch_data["batch_id"]


def get_analysis_batches(owner_id: str, limit: int = 25) -> List[Dict[str, Any]]:
    analysis_collection = get_database()["analysis_batches"]
    projection = {
        "_id": 1,
        "batch_id": 1,
        "created_at": 1,
        "total_comments": 1,
        "sentiment_counts": 1,
        "status": 1,
        "completed_comments": 1,
        "failed_comments": 1,
    }
    cursor = (
        analysis_collection.find({"owner_id": owner_id}, projection)
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


def get_analysis_batch_by_idempotency_key(
    idempotency_key: str, owner_id: str
) -> Optional[Dict[str, Any]]:
    document = get_database()["analysis_batches"].find_one(
        {"owner_id": owner_id, "idempotency_key": idempotency_key}
    )
    if not document:
        return None
    return _serialize_doc(document)
