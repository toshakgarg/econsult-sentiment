import json
import logging
import os
from threading import Lock
from typing import Optional

import firebase_admin
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from firebase_admin.exceptions import FirebaseError
from google.auth.exceptions import DefaultCredentialsError
from pymongo.errors import PyMongoError


bearer_scheme = HTTPBearer(auto_error=False)
_firebase_app = None
_firebase_app_lock = Lock()
logger = logging.getLogger(__name__)


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    with _firebase_app_lock:
        if _firebase_app is not None:
            return _firebase_app

        project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
        if not project_id:
            raise RuntimeError("Firebase authentication is not configured. Set FIREBASE_PROJECT_ID.")

        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
        if service_account_json:
            try:
                service_account = json.loads(service_account_json)
            except json.JSONDecodeError as exc:
                raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid service account JSON.") from exc
            if (
                not isinstance(service_account, dict)
                or service_account.get("project_id") != project_id
            ):
                raise RuntimeError(
                    "FIREBASE_SERVICE_ACCOUNT_JSON must belong to FIREBASE_PROJECT_ID."
                )
            try:
                firebase_credential = credentials.Certificate(service_account)
            except (TypeError, ValueError) as exc:
                raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid service account JSON.") from exc
        else:
            firebase_credential = credentials.ApplicationDefault()

        if firebase_credential.project_id and firebase_credential.project_id != project_id:
            raise RuntimeError("Firebase Admin credentials do not match FIREBASE_PROJECT_ID.")

        try:
            _firebase_app = firebase_admin.get_app()
        except ValueError:
            _firebase_app = firebase_admin.initialize_app(
                firebase_credential, {"projectId": project_id}
            )

        if _firebase_app.project_id != project_id:
            _firebase_app = None
            raise RuntimeError("Firebase Admin credentials do not match FIREBASE_PROJECT_ID.")
        return _firebase_app


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    if (
        not credentials
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):
        raise HTTPException(status_code=401, detail="Authentication is required.")

    try:
        decoded_token = firebase_auth.verify_id_token(
            credentials.credentials,
            app=_get_firebase_app(),
            check_revoked=True,
        )
    except (
        firebase_auth.InvalidIdTokenError,
        firebase_auth.ExpiredIdTokenError,
        firebase_auth.RevokedIdTokenError,
        firebase_auth.UserDisabledError,
        firebase_auth.UserNotFoundError,
    ) as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase ID token.") from exc
    except (FirebaseError, DefaultCredentialsError, RuntimeError) as exc:
        logger.error(
            "Firebase token verification is unavailable (%s).",
            type(exc).__name__,
        )
        raise HTTPException(status_code=503, detail="Firebase authentication is unavailable.") from exc

    firebase_uid = decoded_token.get("uid")
    if not isinstance(firebase_uid, str) or not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid Firebase token identity.")

    try:
        from services.mongodb_service import get_legacy_owner_mapping

        legacy_owner_id = get_legacy_owner_mapping(firebase_uid)
    except (PyMongoError, RuntimeError) as exc:
        raise HTTPException(status_code=503, detail="User data ownership lookup is unavailable.") from exc

    if legacy_owner_id:
        return legacy_owner_id
    return f"firebase:{firebase_uid}"
