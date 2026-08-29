"""Tests for Task 3 - Logger."""

import unittest

from logger import Logger


class LoggerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.logger = Logger()

    def test_starts_empty(self) -> None:
        self.assertEqual(self.logger.get_logs(), [])

    def test_log_then_get_preserves_order(self) -> None:
        for message in ("first", "second", "third"):
            self.logger.log(message)
        self.assertEqual(self.logger.get_logs(), ["first", "second", "third"])

    def test_get_logs_returns_a_copy(self) -> None:
        self.logger.log("only")
        snapshot = self.logger.get_logs()
        snapshot.append("tampered")
        self.assertEqual(self.logger.get_logs(), ["only"])

    def test_search_is_case_insensitive(self) -> None:
        self.logger.log("Server started")
        self.logger.log("SERVER stopped")
        self.logger.log("client connected")
        self.assertEqual(
            self.logger.search("server"), ["Server started", "SERVER stopped"]
        )

    def test_search_is_substring(self) -> None:
        self.logger.log("disk usage 91%")
        self.assertEqual(self.logger.search("usage"), ["disk usage 91%"])

    def test_search_no_match(self) -> None:
        self.logger.log("all good")
        self.assertEqual(self.logger.search("error"), [])

    def test_search_empty_query_matches_everything(self) -> None:
        self.logger.log("a")
        self.logger.log("b")
        self.assertEqual(self.logger.search(""), ["a", "b"])

    def test_search_preserves_log_order(self) -> None:
        self.logger.log("error 1")
        self.logger.log("ok")
        self.logger.log("error 2")
        self.assertEqual(self.logger.search("error"), ["error 1", "error 2"])

    def test_duplicate_messages_are_kept(self) -> None:
        self.logger.log("dup")
        self.logger.log("dup")
        self.assertEqual(self.logger.get_logs(), ["dup", "dup"])


if __name__ == "__main__":
    unittest.main()
