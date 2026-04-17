import os
from typing import Dict

import requests


AZURE_SENTIMENT_PATH = "/language/:analyze-text"


def _get_azure_config() -> tuple[str, str, str]:
    endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT", "").strip().rstrip("/")
    api_key = os.getenv("AZURE_LANGUAGE_KEY", "").strip()
    api_version = os.getenv("AZURE_LANGUAGE_API_VERSION", "2023-04-01").strip()

    if not endpoint or not api_key:
        raise RuntimeError(
            "Azure Language credentials are missing. Set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY in backend/.env."
        )

    return endpoint, api_key, api_version


def analyze_sentiment(text: str, language: str = "en") -> Dict[str, object]:
    if not text.strip():
        return {
            "sentiment": "neutral",
            "confidence": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
        }

    endpoint, api_key, api_version = _get_azure_config()
    url = f"{endpoint}{AZURE_SENTIMENT_PATH}?api-version={api_version}"
    payload = {
        "kind": "SentimentAnalysis",
        "analysisInput": {
            "documents": [{"id": "1", "language": language or "en", "text": text}]
        },
        "parameters": {"opinionMining": False},
    }
    headers = {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": api_key,
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        raise RuntimeError(
            f"Azure Language sentiment request failed ({response.status_code}): {response.text}"
        )

    data = response.json()
    documents = data.get("results", {}).get("documents", [])
    if not documents:
        raise RuntimeError(f"Azure Language returned no documents: {data}")

    document = documents[0]
    sentiment = str(document.get("sentiment", "neutral")).lower()
    confidence = document.get("confidenceScores", {})
    return {
        "sentiment": sentiment,
        "confidence": {
            "positive": float(confidence.get("positive", 0.0)),
            "neutral": float(confidence.get("neutral", 0.0)),
            "negative": float(confidence.get("negative", 0.0)),
        },
    }
