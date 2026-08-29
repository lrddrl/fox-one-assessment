"""Tests for Task 4 - Fibonacci implementations.

Every implementation must reproduce the same reference sequence and reject
negative input. ``fib_recursive`` is exercised only for small n because it is
O(2**n).
"""

import unittest

from fibonacci import (
    fib_broken,
    fib_iterative,
    fib_lru,
    fib_memoized,
    fib_recursive,
)

# F(0..10) - the sequence every implementation must reproduce.
EXPECTED = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]

ALL_IMPLEMENTATIONS = (fib_recursive, fib_iterative, fib_memoized, fib_lru)
FAST_IMPLEMENTATIONS = (fib_iterative, fib_memoized, fib_lru)


class BrokenFibonacciTests(unittest.TestCase):
    """Pin down exactly how the original is wrong, so the fix is verifiable."""

    def test_base_cases_are_actually_fine(self) -> None:
        # The bug is NOT in the base cases - that is what makes it easy to miss.
        self.assertEqual(fib_broken(0), 0)
        self.assertEqual(fib_broken(1), 1)

    def test_recursive_step_typo_yields_powers_of_two(self) -> None:
        # fib(n-1) + fib(n-1) == 2 * fib(n-1) == 2 ** (n - 1) for n >= 1.
        for n in range(1, 12):
            self.assertEqual(fib_broken(n), 2 ** (n - 1))

    def test_it_disagrees_with_the_real_sequence(self) -> None:
        self.assertNotEqual(fib_broken(5), 5)   # returns 16
        self.assertNotEqual(fib_broken(10), 55)  # returns 512


class FibonacciTests(unittest.TestCase):
    def setUp(self) -> None:
        # lru_cache persists across calls for the process lifetime; clear it so
        # each test starts from a known state.
        fib_lru.cache_clear()

    def test_base_cases(self) -> None:
        for fn in ALL_IMPLEMENTATIONS:
            with self.subTest(fn=fn.__name__):
                self.assertEqual(fn(0), 0)
                self.assertEqual(fn(1), 1)

    def test_matches_reference_sequence(self) -> None:
        for fn in ALL_IMPLEMENTATIONS:
            with self.subTest(fn=fn.__name__):
                self.assertEqual(
                    [fn(i) for i in range(len(EXPECTED))], EXPECTED
                )

    def test_larger_value_consistent(self) -> None:
        # fib_recursive omitted: O(2**n) makes n=40 far too slow.
        for fn in FAST_IMPLEMENTATIONS:
            with self.subTest(fn=fn.__name__):
                self.assertEqual(fn(40), 102334155)

    def test_iterative_matches_known_large_value(self) -> None:
        self.assertEqual(fib_iterative(100), 354224848179261915075)

    def test_iterative_handles_very_large_n(self) -> None:
        # The recursive and memoized versions hit Python's recursion limit long
        # before here; the iterative version has no such ceiling. Checking the
        # Fibonacci identity F(n) = F(n-1) + F(n-2) makes the assertion
        # self-verifying without a hard-coded 2000-digit literal.
        a, b, c = fib_iterative(9_998), fib_iterative(9_999), fib_iterative(10_000)
        self.assertEqual(a + b, c)

    def test_negative_input_rejected(self) -> None:
        for fn in ALL_IMPLEMENTATIONS:
            with self.subTest(fn=fn.__name__):
                with self.assertRaises(ValueError):
                    fn(-1)


if __name__ == "__main__":
    unittest.main()
