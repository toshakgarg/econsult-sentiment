import unittest
from unittest.mock import Mock, patch

from pymongo.errors import DuplicateKeyError

from services.mongodb_service import save_analysis_batch


class MongoDBServiceTestCase(unittest.TestCase):
    def test_idempotent_insert_race_returns_existing_batch(self):
        collection = Mock()
        collection.find_one.side_effect = [None, {"batch_id": "existing-batch"}]
        collection.insert_one.side_effect = DuplicateKeyError("duplicate idempotency key")
        database = {"analysis_batches": collection}
        batch = {
            "batch_id": "new-batch",
            "idempotency_key": "retry-key",
        }

        with patch("services.mongodb_service.get_database", return_value=database):
            batch_id = save_analysis_batch(batch, "owner-1")

        self.assertEqual(batch_id, "existing-batch")
        self.assertEqual(batch["owner_id"], "owner-1")
        collection.find_one.assert_any_call(
            {"owner_id": "owner-1", "idempotency_key": "retry-key"},
            {"batch_id": 1},
        )


if __name__ == "__main__":
    unittest.main()
