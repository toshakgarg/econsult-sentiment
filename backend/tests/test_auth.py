import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from services.auth import _get_firebase_app, get_current_user_id
from firebase_admin import auth as firebase_auth


class FirebaseAuthTestCase(unittest.TestCase):
    def setUp(self):
        os.environ["FIREBASE_PROJECT_ID"] = "sentrix-test"

    def tearDown(self):
        os.environ.pop("FIREBASE_PROJECT_ID", None)
        os.environ.pop("FIREBASE_SERVICE_ACCOUNT_JSON", None)

    def credentials(self):
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials="firebase-token")

    @patch("services.mongodb_service.get_legacy_owner_mapping", return_value=None)
    @patch("services.auth._get_firebase_app", return_value=object())
    @patch("services.auth.firebase_auth.verify_id_token")
    def test_valid_id_token_uses_firebase_uid_as_owner(
        self, verify_mock, _app_mock, mapping_mock
    ):
        verify_mock.return_value = {"uid": "firebase-user-1", "email": "person@example.com"}

        owner_id = get_current_user_id(self.credentials())

        self.assertEqual(owner_id, "firebase:firebase-user-1")
        verify_mock.assert_called_once_with(
            "firebase-token", app=_app_mock.return_value, check_revoked=True
        )
        mapping_mock.assert_called_once_with("firebase-user-1")

    @patch("services.mongodb_service.get_legacy_owner_mapping", return_value="legacy-owner-1")
    @patch("services.auth._get_firebase_app", return_value=object())
    @patch("services.auth.firebase_auth.verify_id_token", return_value={"uid": "firebase-user-1"})
    def test_explicit_uid_mapping_preserves_legacy_owner(
        self, _verify_mock, _app_mock, _mapping_mock
    ):
        self.assertEqual(get_current_user_id(self.credentials()), "legacy-owner-1")

    def test_missing_token(self):
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(None)
        self.assertEqual(context.exception.status_code, 401)

    def test_empty_bearer_token(self):
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="")
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(credentials)
        self.assertEqual(context.exception.status_code, 401)

    @patch("services.auth._get_firebase_app", return_value=object())
    @patch(
        "services.auth.firebase_auth.verify_id_token",
        side_effect=firebase_auth.InvalidIdTokenError("invalid token"),
    )
    def test_invalid_token_is_unauthorized(self, _verify_mock, _app_mock):
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(self.credentials())
        self.assertEqual(context.exception.status_code, 401)

    @patch("services.auth._get_firebase_app", side_effect=RuntimeError("not configured"))
    def test_missing_firebase_configuration_is_unavailable(self, _app_mock):
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(self.credentials())
        self.assertEqual(context.exception.status_code, 503)

    @patch("services.auth._firebase_app", None)
    @patch("services.auth.firebase_admin.get_app", side_effect=ValueError("not initialized"))
    @patch("services.auth.credentials.ApplicationDefault")
    def test_application_default_credential_must_match_project(
        self, credential_mock, _get_app_mock
    ):
        credential_mock.return_value.project_id = "different-project"

        with self.assertRaisesRegex(RuntimeError, "do not match"):
            _get_firebase_app()

    @patch("services.mongodb_service.get_legacy_owner_mapping", side_effect=RuntimeError("offline"))
    @patch("services.auth._get_firebase_app", return_value=object())
    @patch("services.auth.firebase_auth.verify_id_token", return_value={"uid": "firebase-user-1"})
    def test_ownership_mapping_failure_does_not_fall_back_to_a_new_owner(
        self, _verify_mock, _app_mock, _mapping_mock
    ):
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(self.credentials())
        self.assertEqual(context.exception.status_code, 503)

    @patch("services.auth._get_firebase_app", return_value=object())
    @patch("services.auth.firebase_auth.verify_id_token", return_value={"email": "person@example.com"})
    def test_token_without_uid_is_rejected(self, _verify_mock, _app_mock):
        with self.assertRaises(HTTPException) as context:
            get_current_user_id(self.credentials())
        self.assertEqual(context.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
