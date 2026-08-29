"""Tests for Task 1 - most_common_word."""

import unittest

from most_common_word import most_common_word


class MostCommonWordTests(unittest.TestCase):
    def test_simple_majority(self) -> None:
        self.assertEqual(most_common_word("the ball the ball the"), "the")

    def test_case_insensitive(self) -> None:
        self.assertEqual(most_common_word("Goal goal GOAL"), "goal")

    def test_ignores_punctuation(self) -> None:
        self.assertEqual(most_common_word("win! win, win. lose"), "win")

    def test_contractions_and_hyphens_stay_whole(self) -> None:
        self.assertEqual(most_common_word("don't don't do"), "don't")
        self.assertEqual(most_common_word("one-nil one-nil draw"), "one-nil")

    def test_stopwords_removed(self) -> None:
        text = "the team won the game the fans cheered"
        # After removing "the": team/won/game/fans/cheered each appear once,
        # so the first-seen word wins the tie.
        self.assertEqual(most_common_word(text, stopwords={"the"}), "team")

    def test_stopwords_are_case_insensitive(self) -> None:
        self.assertEqual(
            most_common_word("The the THE game", stopwords={"the"}), "game"
        )

    def test_empty_string_returns_none(self) -> None:
        self.assertIsNone(most_common_word(""))

    def test_whitespace_only_returns_none(self) -> None:
        self.assertIsNone(most_common_word("   \n\t "))

    def test_punctuation_only_returns_none(self) -> None:
        self.assertIsNone(most_common_word("!!! ??? ..."))

    def test_all_words_are_stopwords_returns_none(self) -> None:
        self.assertIsNone(
            most_common_word("a an the", stopwords={"a", "an", "the"})
        )

    def test_pure_numbers_are_not_words(self) -> None:
        self.assertEqual(most_common_word("3 3 3 goals"), "goals")

    def test_alphanumeric_team_name_counts(self) -> None:
        self.assertEqual(most_common_word("76ers 76ers heat"), "76ers")

    def test_tie_breaks_on_first_appearance(self) -> None:
        self.assertEqual(most_common_word("draw win win draw"), "draw")

    def test_none_input_returns_none(self) -> None:
        self.assertIsNone(most_common_word(None))  # type: ignore[arg-type]


if __name__ == "__main__":
    unittest.main()
