import os
import random
import time

import requests


DEFAULT_MODEL_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"


def _get_huggingface_config() -> tuple[str, str]:
    api_key = os.getenv("HUGGINGFACE_API_KEY", "").strip() or os.getenv(
        "HF_API_KEY", ""
    ).strip()
    model_url = os.getenv("HUGGINGFACE_MODEL_URL", DEFAULT_MODEL_URL).strip()

    if not api_key:
        raise RuntimeError(
            "Hugging Face API key is missing. Set HUGGINGFACE_API_KEY in backend/.env."
        )

    return api_key, model_url


def generate_summary(text: str, min_length: int = 20, max_length: int = 80) -> str:
    clean_text = text.strip()
    if not clean_text:
        return "No content available for summarization."
    if len(clean_text.split()) < 20:
        return clean_text

    api_key, model_url = _get_huggingface_config()
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {
        "inputs": clean_text,
        "parameters": {
            "min_length": min_length,
            "max_length": max_length,
            "do_sample": False,
        },
        "options": {"wait_for_model": True},
    }

    max_attempts = int(os.getenv("HF_MAX_ATTEMPTS", "4"))
    for attempt in range(max_attempts):
        try:
            response = requests.post(model_url, headers=headers, json=payload, timeout=60)
        except requests.Timeout as exc:
            if attempt == max_attempts - 1:
                raise RuntimeError("Hugging Face summarization timed out.") from exc
        except requests.RequestException as exc:
            if attempt == max_attempts - 1:
                raise RuntimeError("Hugging Face summarization service is unavailable.") from exc
        else:
            if response.status_code == 200:
                break
            if response.status_code in (429,) or 500 <= response.status_code < 600:
                if attempt == max_attempts - 1:
                    raise RuntimeError(
                        f"Hugging Face summarization exhausted retries ({response.status_code})."
                    )
            else:
                raise RuntimeError(
                    f"Hugging Face summarization failed ({response.status_code})."
                )
        delay = min(8.0, 0.5 * (2 ** attempt)) + random.uniform(0, 0.25)
        retry_after = response.headers.get("Retry-After") if 'response' in locals() else None
        if retry_after:
            try:
                delay = min(60.0, float(retry_after))
            except ValueError:
                pass
        time.sleep(delay)
    else:
        raise RuntimeError("Hugging Face summarization exhausted retries.")

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("Hugging Face returned malformed JSON.") from exc
    if isinstance(data, dict) and data.get("error"):
        raise RuntimeError(f"Hugging Face summarization error: {data['error']}")

    if isinstance(data, list) and data and isinstance(data[0], dict):
        summary = data[0].get("summary_text", "").strip()
        if summary:
            return summary

    raise RuntimeError(f"Unexpected Hugging Face response format: {data}")
