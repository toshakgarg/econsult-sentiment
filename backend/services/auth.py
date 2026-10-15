import os
from functools import lru_cache

import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _appwrite_account_url() -> str:
    endpoint = os.getenv(
        "APPWRITE_ENDPOINT", os.getenv("VITE_APPWRITE_ENDPOINT", "")
    ).strip().rstrip("/")
    project_id = os.getenv(
        "APPWRITE_PROJECT_ID", os.getenv("VITE_APPWRITE_PROJECT_ID", "")
    ).strip()
    if not endpoint or not project_id:
        raise RuntimeError(
            "Appwrite authentication is not configured. Set "
            "VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID in backend/.env."
        )
    return f"{endpoint}/account"


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication is required.")

    try:
        response = requests.get(
            _appwrite_account_url(),
            headers={
                "X-Appwrite-Project": os.getenv(
                    "APPWRITE_PROJECT_ID",
                    os.getenv("VITE_APPWRITE_PROJECT_ID", ""),
                ).strip(),
                "Authorization": f"Bearer {credentials.credentials}",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=503, detail="Authentication service is unavailable."
        ) from exc

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    try:
        user_id = response.json().get("$id")
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid authentication response.") from exc

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication response.")
    return str(user_id)
