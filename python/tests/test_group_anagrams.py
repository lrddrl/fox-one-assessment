"""Tests for Task 5 - group_anagrams."""

import unittest

from group_anagrams import group_anagrams


def _as_sets(groups: list[list[str]]) -> set[frozenset[str]]:
    """Order-independent view, for assertions that do not care about group
    order or within-group order (and where there are no duplicate words)."""
    return {frozenset(group) for group in groups}


class GroupAnagramsTests(unittest.TestCase):
    def test_empty(self) -> None:
        self.assertEqual(group_anagrams([]), [])

    def test_single_word(self) -> None:
        self.assertEqual(group_anagrams(["solo"]), [["solo"]])

    def test_basic_grouping(self) -> None:
        result = group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
        self.assertEqual(
            _as_sets(result),
            {
                frozenset({"eat", "tea", "ate"}),
                frozenset({"tan", "nat"}),
                frozenset({"bat"}),
            },
        )

    def test_no_anagrams(self) -> None:
        result = group_anagrams(["abc", "def", "ghi"])
        self.assertEqual(len(result), 3)

    def test_all_one_group(self) -> None:
        result = group_anagrams(["abc", "bca", "cab"])
        self.assertEqual(len(result), 1)
        self.assertEqual(sorted(result[0]), ["abc", "bca", "cab"])

    def test_case_sensitive(self) -> None:
        result = group_anagrams(["Eat", "eat", "ate"])
        self.assertEqual(
            _as_sets(result), {frozenset({"Eat"}), frozenset({"eat", "ate"})}
        )

    def test_empty_strings_group_together(self) -> None:
        self.assertEqual(group_anagrams(["", "", "a"]), [["", ""], ["a"]])

    def test_duplicates_are_kept(self) -> None:
        result = group_anagrams(["ab", "ba", "ab"])
        self.assertEqual(len(result), 1)
        self.assertEqual(sorted(result[0]), ["ab", "ab", "ba"])

    def test_preserves_first_appearance_and_input_order(self) -> None:
        # group order = order families first appear; within a group = input order
        result = group_anagrams(["tea", "bat", "eat", "tab"])
        self.assertEqual(result, [["tea", "eat"], ["bat", "tab"]])

    def test_non_letters_treated_as_characters(self) -> None:
        result = group_anagrams(["a!b", "b!a", "!ab"])
        self.assertEqual(len(result), 1)


if __name__ == "__main__":
    unittest.main()
