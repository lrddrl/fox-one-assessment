"""Task 4 - debugging & refactoring.

Write a simple Fibonacci function, break it on purpose, then find the bug, fix
it, and add iterative + memoized versions.
"""


# The bug is the last line: it adds fib(n - 1) twice instead of
# fib(n - 1) + fib(n - 2). It never crashes and F(0), F(1) are still right, so
# nothing obvious looks wrong - you only catch it by checking real values. It
# works out to fib_broken(n) == 2 ** (n - 1), so fib_broken(5) is 16, not 5.
# Kept in the file so the tests can pin down exactly how it fails.

def fib_broken(n: int) -> int:
    if n <= 1:
        return n
    return fib_broken(n - 1) + fib_broken(n - 1)


# Fixed: correct the recursive call and reject negative n. Reads like the
# definition, but it is O(2 ** n) and hits the recursion limit for large n.

def fib_recursive(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    if n <= 1:
        return n
    return fib_recursive(n - 1) + fib_recursive(n - 2)


# Walk up from the bottom carrying just the last two numbers: O(n) time,
# O(1) space, no recursion limit. This is what I would use for a plain fib(n).

def fib_iterative(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


# Same recursion, but cache each result so it is computed once: O(n) time,
# O(n) space. The _cache arg is a bit ugly - =None, not ={}, so each top-level
# call starts with a fresh dict.

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


# Why they differ: naive recursion recomputes the same subproblems (fib(5)
# works out fib(2) three times), and it gets exponentially worse; the memoized
# and iterative versions each compute every value once. I would default to
# fib_iterative - this function has one job and O(1) space is free here.


if __name__ == "__main__":
    print([fib_iterative(i) for i in range(11)])
    print("broken:", [fib_broken(i) for i in range(11)])
