"""Task 4 - debugging & refactoring.

Write a simple Fibonacci function, break it on purpose, then find the bug, fix
it, and add iterative + memoized versions. Notes are inline next to each one;
the comparison is at the bottom.
"""

from functools import lru_cache


# 1. The broken version
#
# The bug is the last line: it adds fib(n - 1) twice instead of
# fib(n - 1) + fib(n - 2). It never crashes and F(0), F(1) are still right, so
# nothing obvious looks wrong - you only catch it by checking real values. It
# works out to fib_broken(n) == 2 ** (n - 1), so fib_broken(5) is 16, not 5.
# Kept in the file so the tests can pin down exactly how it fails.

def fib_broken(n: int) -> int:
    if n <= 1:
        return n
    return fib_broken(n - 1) + fib_broken(n - 1)


# 2. Fixed recursive version
#
# Correct now, and it reads exactly like the maths. Still O(2 ** n) though - it
# recomputes the same subproblems over and over - and deep n hits Python's
# recursion limit. Also rejects negative n instead of recursing forever.

def fib_recursive(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    if n <= 1:
        return n
    return fib_recursive(n - 1) + fib_recursive(n - 2)


# 3. Iterative version
#
# Walk up from the bottom carrying just the last two numbers. O(n) time,
# O(1) space, no recursion limit. This is what I'd use for a plain fibonacci(n).

def fib_iterative(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


# 4. Memoized version
#
# Same recursion as #2, but each result is stored the first time it is computed,
# so the call tree collapses to the n distinct subproblems: O(n) time, O(n)
# space. The _cache argument is the ugly part - it leaks an implementation
# detail into the signature. (=None, not ={}, so each top-level call gets a
# fresh dict rather than one shared for the life of the process.)

def fib_memoized(n: int, _cache: dict[int, int] | None = None) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    if _cache is None:
        _cache = {}
    if n <= 1:
        return n
    if n not in _cache:
        _cache[n] = fib_memoized(n - 1, _cache) + fib_memoized(n - 2, _cache)
    return _cache[n]


# 5. Memoized, the idiomatic way
#
# Same idea, but functools.lru_cache holds the cache instead of a parameter -
# one line, clean signature. Downside: the cache lives for the whole process,
# so the tests call fib_lru.cache_clear() between runs.

@lru_cache(maxsize=None)
def fib_lru(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    if n <= 1:
        return n
    return fib_lru(n - 1) + fib_lru(n - 2)


# Comparison
#
#   version         time       space               readability
#   fib_recursive   O(2 ** n)  O(n) stack          best - it is the definition
#   fib_iterative   O(n)       O(1)                good; the tuple swap needs a second look
#   fib_memoized    O(n)       O(n) cache + stack  fair; the _cache arg is plumbing
#   fib_lru         O(n)       O(n) cache          clean - one decorator
#
# Why they differ: naive recursion recomputes the same subproblems - fib(5)
# does fib(3) twice and fib(2) three times, and it gets exponentially worse.
# Memoizing stores each result once, so the tree collapses to the n distinct
# values. The iterative version never recurses, so there is no stack and no
# cache to grow.
#
# Default pick: fib_iterative - this function has one job and O(1) space is free
# here. On a messier recurrence where the recursive form carried real meaning,
# I would keep that shape and put lru_cache on it.


if __name__ == "__main__":
    print([fib_iterative(i) for i in range(11)])
    print("broken:", [fib_broken(i) for i in range(11)])
