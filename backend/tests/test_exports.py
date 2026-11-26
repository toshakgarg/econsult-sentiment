import os
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from utils.export import generate_pdf_report


class ExportTestCase(unittest.TestCase):
    @patch.dict(os.environ, {"PDF_UNICODE_FONT": ""})
    def test_pdf_export_uses_packaged_font_when_system_font_is_unavailable(self):
        batch = {
            "batch_id": "pdf-export-check",
            "created_at": datetime.now(timezone.utc),
            "total_comments": 1,
            "sentiment_counts": {"positive": 1, "negative": 0, "neutral": 0},
            "results": [
                {
                    "comment_id": "C001",
                    "stakeholder_type": "Industry",
                    "provision_no": "1",
                    "date": "2026-01-01",
                    "sentiment": "positive",
                    "summary": "Synthetic export test.",
                    "original_comment": "Synthetic export test.",
                }
            ],
        }

        report = generate_pdf_report(batch)

        self.assertTrue(report.startswith(b"%PDF-"))


if __name__ == "__main__":
    unittest.main()
