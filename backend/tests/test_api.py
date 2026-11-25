import unittest
import sys
from contextlib import contextmanager
from pathlib import Path
from io import BytesIO
from unittest.mock import ANY, patch
from openpyxl import load_workbook
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient

from main import app
from services.auth import get_current_user_id
from utils.export import generate_excel_report


@contextmanager
def firebase_bearer_auth():
    dependency = app.dependency_overrides.pop(get_current_user_id)
    try:
        with (
            patch("services.auth._get_firebase_app", return_value=object()),
            patch(
                "services.auth.firebase_auth.verify_id_token",
                return_value={"uid": "api-firebase-user"},
            ) as verify_mock,
            patch("services.mongodb_service.get_legacy_owner_mapping", return_value=None),
        ):
            yield verify_mock
    finally:
        app.dependency_overrides[get_current_user_id] = dependency


class ApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        app.dependency_overrides[get_current_user_id] = lambda: "test-user"

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_cors_allows_local_and_production_frontends(self):
        for origin in ("http://localhost:5173", "https://sentrix.page"):
            response = self.client.options(
                "/api/history/",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "authorization",
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.headers["access-control-allow-origin"], origin)

    @patch("routes.upload.save_uploaded_comments", return_value="upload-123")
    def test_upload_csv_success(self, save_mock):
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
        save_mock.assert_called_once()
        self.assertEqual(save_mock.call_args.args[2], "test-user")

    def test_firebase_authenticated_upload(self):
        csv_content = (
            "comment_id,stakeholder_type,provision_no,comment_text,date\n"
            "C001,Industry,Sec 1,Test upload content,2026-01-01\n"
        ).encode("utf-8")
        with (
            firebase_bearer_auth() as verify_mock,
            patch(
                "routes.upload.save_uploaded_comments",
                return_value="upload-firebase",
            ) as save_mock,
        ):
            response = self.client.post(
                "/api/upload/",
                files={"file": ("comments.csv", csv_content, "text/csv")},
                headers={"Authorization": "Bearer firebase-test-id-token"},
            )

        self.assertEqual(response.status_code, 200)
        save_mock.assert_called_once()
        self.assertEqual(save_mock.call_args.args[2], "firebase:api-firebase-user")
        verify_mock.assert_called_once_with(
            "firebase-test-id-token", app=ANY, check_revoked=True
        )

    def test_firebase_authenticated_history_retrieval(self):
        with (
            firebase_bearer_auth(),
            patch(
                "routes.history.get_analysis_batches",
                return_value=[{"batch_id": "firebase-batch"}],
            ) as history_mock,
        ):
            response = self.client.get(
                "/api/history/",
                headers={"Authorization": "Bearer firebase-test-id-token"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["items"][0]["batch_id"], "firebase-batch")
        history_mock.assert_called_once_with(owner_id="firebase:api-firebase-user", limit=25)

    def test_firebase_authenticated_sentiment_analysis(self):
        comments = [{
            "comment_id": "C001",
            "stakeholder_type": "Industry",
            "provision_no": "Sec 1",
            "comment_text": "The proposal is practical and beneficial.",
            "date": "2026-01-01",
        }]
        sentiment = {
            "sentiment": "positive",
            "confidence": {"positive": 0.9, "neutral": 0.08, "negative": 0.02},
        }
        with (
            firebase_bearer_auth(),
            patch("routes.analysis.analyze_sentiment_batch", return_value={"doc-0": sentiment}),
            patch("routes.analysis.generate_summary", return_value="Positive feedback."),
            patch("routes.analysis.generate_word_cloud_base64", return_value="test-image"),
            patch(
                "routes.analysis.save_analysis_batch",
                side_effect=lambda batch, owner: batch["batch_id"],
            ) as save_mock,
        ):
            response = self.client.post(
                "/api/analysis/",
                json={"comments": comments},
                headers={"Authorization": "Bearer firebase-test-id-token"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["sentiment"], "positive")
        self.assertEqual(save_mock.call_args.args[1], "firebase:api-firebase-user")

    def test_analysis_idempotency_returns_existing_owner_scoped_batch(self):
        stored_batch = {
            "batch_id": "stored-batch",
            "created_at": "2026-01-01T00:00:00+00:00",
            "total_comments": 1,
            "sentiment_counts": {"positive": 1, "negative": 0, "neutral": 0},
            "word_cloud": {"image_base64": "stored-image"},
            "results": [
                {
                    "comment_id": "C001",
                    "stakeholder_type": "Industry",
                    "provision_no": "1",
                    "date": "2026-01-01",
                    "original_comment": "Stored comment",
                    "cleaned_comment": "Stored comment",
                    "language": "en",
                    "sentiment": "positive",
                    "sentiment_confidence": {
                        "positive": 1.0,
                        "neutral": 0.0,
                        "negative": 0.0,
                    },
                    "summary": "Stored summary",
                }
            ],
        }
        with (
            firebase_bearer_auth(),
            patch(
                "routes.analysis.get_analysis_batch_by_idempotency_key",
                return_value=stored_batch,
            ) as existing_mock,
            patch(
                "routes.analysis.analyze_sentiment_batch",
                side_effect=AssertionError("Retry must not repeat provider calls."),
            ),
            patch(
                "routes.analysis.save_analysis_batch",
                side_effect=AssertionError("Retry must not insert another batch."),
            ),
        ):
            response = self.client.post(
                "/api/analysis/",
                json={
                    "comments": [
                        {
                            "comment_id": "C002",
                            "stakeholder_type": "Industry",
                            "provision_no": "2",
                            "comment_text": "Retry request",
                            "date": "2026-01-02",
                        }
                    ]
                },
                headers={
                    "Authorization": "Bearer firebase-test-id-token",
                    "Idempotency-Key": "retry-key",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["batch_id"], "stored-batch")
        existing_mock.assert_called_once_with(
            "retry-key", "firebase:api-firebase-user"
        )

    def test_analysis_marks_batch_document_errors_as_failed(self):
        sentiment_error = {
            "sentiment": "neutral",
            "confidence": {"positive": 0.0, "neutral": 1.0, "negative": 0.0},
            "processing_error": "Azure Language document error.",
        }
        comments = [
            {
                "comment_id": "C001",
                "stakeholder_type": "Industry",
                "provision_no": "1",
                "comment_text": "The proposal is practical.",
                "date": "2026-01-01",
            }
        ]
        with (
            patch(
                "routes.analysis.analyze_sentiment_batch",
                return_value={"doc-0": sentiment_error},
            ),
            patch(
                "routes.analysis.analyze_sentiment",
                side_effect=AssertionError("Batch errors must not be retried singly."),
            ),
            patch("routes.analysis.generate_summary", return_value="Summary."),
            patch(
                "routes.analysis.generate_word_cloud_base64",
                return_value="test-image",
            ),
            patch(
                "routes.analysis.save_analysis_batch",
                side_effect=lambda batch, owner: batch["batch_id"],
            ),
        ):
            response = self.client.post(
                "/api/analysis/",
                json={"comments": comments},
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()["results"][0]
        self.assertEqual(result["processing_status"], "failed")
        self.assertEqual(
            result["processing_error"],
            "Sentiment provider failed for this comment.",
        )

    def test_protected_history_requires_authentication(self):
        dependency = app.dependency_overrides.pop(get_current_user_id)
        try:
            response = self.client.get("/api/history/")
        finally:
            app.dependency_overrides[get_current_user_id] = dependency

        self.assertEqual(response.status_code, 401)

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

    @patch(
        "routes.upload.save_uploaded_comments",
        side_effect=RuntimeError("MongoDB connection string is missing"),
    )
    def test_upload_returns_service_unavailable_when_storage_is_unavailable(
        self, _save_mock
    ):
        csv_content = (
            "comment_id,stakeholder_type,provision_no,comment_text,date\n"
            "C001,Industry,Sec 1,This draft is clear and practical,2026-01-01\n"
        ).encode("utf-8")

        response = self.client.post(
            "/api/upload/",
            files={"file": ("comments.csv", csv_content, "text/csv")},
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn("Upload storage is unavailable", response.json()["detail"])

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
            patch(
                "routes.analysis.save_analysis_batch",
                side_effect=lambda batch, owner: batch["batch_id"],
            ),
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

    def test_excel_formula_injection_is_neutralized(self):
        batch = {
            "batch_id": "B001",
            "total_comments": 1,
            "sentiment_counts": {"positive": 1, "negative": 0, "neutral": 0},
            "results": [{
                "comment_id": "=1+1",
                "stakeholder_type": "+CMD",
                "provision_no": "-10",
                "date": "@SUM(A1:A2)",
                "original_comment": "\t=HYPERLINK(\"bad\")",
                "cleaned_comment": "\rDROP",
                "language": "en",
                "sentiment": "positive",
                "sentiment_confidence": {"positive": 1.0, "neutral": 0.0, "negative": 0.0},
                "summary": "-10",
            }],
        }
        workbook = load_workbook(BytesIO(generate_excel_report(batch)))
        sheet = workbook["Comment Analysis"]
        values = [sheet.cell(row=2, column=column).value for column in range(1, 13)]
        self.assertTrue(all(not (isinstance(value, str) and value.startswith("=")) for value in values))
        self.assertEqual(sheet["I2"].value, 1.0)


if __name__ == "__main__":
    unittest.main()
