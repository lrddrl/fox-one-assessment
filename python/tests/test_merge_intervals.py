"""Tests for Task 2 - merge_intervals."""

import unittest

from merge_intervals import merge_intervals


class MergeIntervalsTests(unittest.TestCase):
    def test_empty(self) -> None:
        self.assertEqual(merge_intervals([]), [])

    def test_single_interval(self) -> None:
        self.assertEqual(merge_intervals([[1, 4]]), [[1, 4]])

    def test_no_overlap(self) -> None:
        self.assertEqual(merge_intervals([[1, 2], [4, 5]]), [[1, 2], [4, 5]])

    def test_simple_overlap(self) -> None:
        self.assertEqual(merge_intervals([[1, 3], [2, 6]]), [[1, 6]])

    def test_unsorted_input(self) -> None:
        self.assertEqual(
            merge_intervals([[8, 10], [1, 3], [2, 6], [15, 18]]),
            [[1, 6], [8, 10], [15, 18]],
        )

    def test_touching_intervals_merge(self) -> None:
        self.assertEqual(merge_intervals([[1, 2], [2, 3]]), [[1, 3]])

    def test_fully_contained(self) -> None:
        self.assertEqual(merge_intervals([[1, 10], [2, 4], [5, 7]]), [[1, 10]])

    def test_duplicates(self) -> None:
        self.assertEqual(merge_intervals([[1, 4], [1, 4], [1, 4]]), [[1, 4]])

    def test_negative_numbers(self) -> None:
        self.assertEqual(
            merge_intervals([[-5, -1], [-3, 2], [3, 4]]), [[-5, 2], [3, 4]]
        )

    def test_single_point_intervals(self) -> None:
        self.assertEqual(merge_intervals([[5, 5], [5, 5]]), [[5, 5]])
        self.assertEqual(merge_intervals([[1, 1], [2, 2]]), [[1, 1], [2, 2]])

    def test_input_list_not_mutated(self) -> None:
        data = [[3, 5], [1, 4]]
        merge_intervals(data)
        self.assertEqual(data, [[3, 5], [1, 4]])

    def test_result_rows_are_not_aliases_of_input(self) -> None:
        row = [1, 4]
        result = merge_intervals([row])
        result[0][1] = 999
        self.assertEqual(row, [1, 4])  # the caller's row must be untouched


if __name__ == "__main__":
    unittest.main()
