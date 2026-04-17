import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


class ApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    @patch("routes.upload.save_uploaded_comments", return_value="upload-123")
    def test_upload_csv_success(self, _save_mock):
        csv_content = (
            "comment_id,stakeholder_type,provision_no,comment_text,date\n"
            "C001,Industry,Sec 1,This draft is clear and practical,2026-01-01\n"
        ).encode("utf-8")

        response = self.client.post(
            "/api/upload/",
            files={"file": ("comments.csv", csv_content, "text/csv")},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["upload_id"], "upload-123")
        self.assertEqual(payload["total_comments"], 1)
        self.assertEqual(len(payload["preview"]), 1)

    def test_upload_missing_required_columns(self):
        csv_content = (
            "comment_id,stakeholder_type,provision_no,date\n"
            "C001,Industry,Sec 1,2026-01-01\n"
        ).encode("utf-8")

        response = self.client.post(
            "/api/upload/",
            files={"file": ("comments.csv", csv_content, "text/csv")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing required columns", response.json()["detail"])

    def test_analysis_success_from_upload(self):
        uploaded_comments = [
            {
                "comment_id": "C001",
                "stakeholder_type": "Industry",
                "provision_no": "Sec 1",
                "comment_text": "This is a practical and beneficial amendment.",
                "date": "2026-01-01",
            }
        ]
        with (
            patch(
                "routes.analysis.get_uploaded_comments",
                return_value=uploaded_comments,
            ),
            patch(
                "routes.analysis.analyze_sentiment",
                return_value={
                    "sentiment": "positive",
                    "confidence": {
                        "positive": 0.91,
                        "neutral": 0.07,
                        "negative": 0.02,
                    },
                },
            ),
            patch(
                "routes.analysis.generate_summary",
                return_value="The comment supports the proposed amendment.",
            ),
            patch(
                "routes.analysis.generate_word_cloud_base64",
                return_value="fake-image-b64",
            ),
            patch("routes.analysis.save_analysis_batch"),
        ):
            response = self.client.post("/api/analysis/", json={"upload_id": "upload-123"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total_comments"], 1)
        self.assertEqual(payload["sentiment_counts"]["positive"], 1)
        self.assertEqual(payload["word_cloud"]["image_base64"], "fake-image-b64")
        self.assertEqual(payload["results"][0]["sentiment"], "positive")

    @patch("routes.analysis.get_uploaded_comments", return_value=[])
    def test_analysis_returns_404_when_upload_not_found(self, _uploaded_mock):
        response = self.client.post("/api/analysis/", json={"upload_id": "missing-id"})
        self.assertEqual(response.status_code, 404)

    @patch("routes.history.get_analysis_batches", return_value=[{"batch_id": "B001"}])
    def test_history_list_success(self, _history_mock):
        response = self.client.get("/api/history/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["batch_id"], "B001")

    @patch(
        "routes.history.get_analysis_batch_by_batch_id",
        return_value={"batch_id": "B001"},
    )
    @patch("routes.history.generate_excel_report", return_value=b"excel-content")
    def test_export_excel_success(self, _excel_mock, _batch_mock):
        response = self.client.get("/api/history/B001/export/excel")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["content-type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        self.assertIn(".xlsx", response.headers["content-disposition"])
        self.assertEqual(response.content, b"excel-content")

    @patch(
        "routes.history.get_analysis_batch_by_batch_id",
        return_value={"batch_id": "B001"},
    )
    @patch("routes.history.generate_pdf_report", return_value=b"pdf-content")
    def test_export_pdf_success(self, _pdf_mock, _batch_mock):
        response = self.client.get("/api/history/B001/export/pdf")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertIn(".pdf", response.headers["content-disposition"])
        self.assertEqual(response.content, b"pdf-content")


if __name__ == "__main__":
    unittest.main()
