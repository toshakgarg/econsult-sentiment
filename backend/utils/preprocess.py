import re
from typing import Any

from langdetect import DetectorFactory, LangDetectException, detect


DetectorFactory.seed = 0

SPECIAL_CHARS_PATTERN = re.compile(r"[^a-zA-Z0-9\s\.,;:!?'\-()/]")
MULTI_SPACE_PATTERN = re.compile(r"\s+")


def clean_text(text: Any) -> str:
    if text is None:
        return ""
    value = str(text).strip()
    if not value:
        return ""

    value = SPECIAL_CHARS_PATTERN.sub(" ", value)
    value = MULTI_SPACE_PATTERN.sub(" ", value)
    return value.strip()


def is_empty_comment(text: Any) -> bool:
    return clean_text(text) == ""


def detect_language(text: Any) -> str:
    cleaned_text = clean_text(text)
    if not cleaned_text:
        return "unknown"
    try:
        return detect(cleaned_text)
    except LangDetectException:
        return "unknown"
