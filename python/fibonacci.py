"""Task 4 - Fibonacci: a deliberate bug, then the fix + iterative + memoized.

The full write-up (why this bug, the trade-offs) is in README.md.
"""


# Bug: the last line adds fib(n - 1) twice - should be fib(n - 2). Never raises,
# so only a test against known values catches it. Kept for the tests.
def fib_broken(n: int) -> int:
    if n <= 1:
        return n
    return fib_broken(n - 1) + fib_broken(n - 1)


# Fixed. Correct, but O(2 ** n) - unusable past ~35.
def fib_recursive(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    if n <= 1:
        return n
    return fib_recursive(n - 1) + fib_recursive(n - 2)


# O(n) time, O(1) space, no recursion limit. My default.
def fib_iterative(n: int) -> int:
    if n < 0:
        raise ValueError("n must be >= 0")
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


# Same recursion + a cache: O(n) time, O(n) space. _cache=None, not {}, so each
# top-level call starts fresh.
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


"""
Version	Time	Space	Readability
fib_recursive	O(2ⁿ)	O(n) call stack	Best — it is the definition
fib_iterative	O(n)	O(1) Good, but the tuple swap takes a second to read
fib_memoized	O(n)	O(n) cache + O(n) call stack	Fair — the _cache parameter leaks the implementation into the signature
"""

if __name__ == "__main__":
    print([fib_iterative(i) for i in range(11)])
    print("broken:", [fib_broken(i) for i in range(11)])
