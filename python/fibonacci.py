"""Task 4 - Debugging & refactoring: the Fibonacci function.

The broken function
------------------
    def fib(n):
        if n <= 1:
            return n
        return fib(n - 1) + fib(n - 1)

What is wrong
------------
1. **The bug: a typo in the recursive step.** The second call should be
   ``fib(n - 2)``, not ``fib(n - 1)``. As written, ``fib(n) == 2 * fib(n - 1)``,
   so for ``n >= 1`` the function returns ``2 ** (n - 1)`` - a *plausible-looking*
   but wrong sequence: ``fib(5)`` gives 16 instead of 5, ``fib(10)`` gives 512
   instead of 55. The base cases (``if n <= 1: return n``) are actually fine -
   they correctly seed F(0)=0 and F(1)=1 - which is what makes the typo easy to
   miss: the function runs and returns numbers.

2. **Even once the typo is fixed, the shape is still bad.** Two-way recursion
   with no memoisation is O(2**n): ``fib(40)`` is ~1.6e9 calls (seconds to
   minutes), and the call depth also hits Python's default recursion limit
   (~1000), so ``fib(2000)`` raises ``RecursionError`` regardless of time.

3. **Negative input is unguarded.** ``fib(-1)`` recurses toward more negative
   numbers until it hits the recursion limit. It should be rejected.

The fix
-------
Correct the recursive call to ``fib(n - 1) + fib(n - 2)``, reject ``n < 0``, and
- because the exponential blow-up remains - change the algorithm so each
Fibonacci number is computed once. Three ways to do that below.

Trade-offs of the corrected implementations
-------------------------------------------
| version        | time    | extra space        | when to use                          |
|----------------|---------|--------------------|--------------------------------------|
| fib_recursive  | O(2**n) | O(n) call stack    | reference only - it *is* the fixed   |
|                |         |                    | recursive version, kept to show the  |
|                |         |                    | one-character fix and as a spec      |
| fib_iterative  | O(n)    | O(1)               | DEFAULT - fastest, no recursion limit |
| fib_memoized   | O(n)    | O(n) cache + stack | reads like the definition; costs      |
|                |         |                    | memory and hits the recursion limit  |
|                |         |                    | for very large n                     |
| fib_lru        | O(n)    | O(n) cache         | same idea via the stdlib             |
|                |         |                    | (functools.lru_cache); cache persists |
|                |         |                    | between calls                        |

Why they behave differently
---------------------------
The naive (fixed) recursion recomputes the same subproblems again and again -
fib(5) computes fib(3) twice, fib(2) three times, and so on, which is where the
O(2**n) comes from. Memoisation stores each result the first time it is
computed, collapsing the call tree to O(n) distinct subproblems. The iterative
version sidesteps recursion altogether: it builds the sequence bottom-up keeping
only the last two numbers, so it needs neither a cache nor stack frames.
"""

from functools import lru_cache


def fib_broken(n: int) -> int:
    """The original buggy function, kept verbatim so the bug is demonstrable.

    ``fib_broken(n) == 2 ** (n - 1)`` for n >= 1 - NOT the Fibonacci sequence.
    See the module docstring. Do not use; ``fib_iterative`` is the answer.
    """
    if n <= 1:
        return n
    return fib_broken(n - 1) + fib_broken(n - 1)  # bug: 2nd call should be n - 2


def fib_recursive(n: int) -> int:
    """The bug fixed in place: ``fib(n - 1) + fib(n - 2)``, plus an ``n < 0``
    guard. Correct, but still O(2**n) - reference only.

    Behaviour: fine up to ~n=30, painfully slow by n=40, ``RecursionError``
    once n exceeds the interpreter's recursion limit.
    """
    if n < 0:
        raise ValueError("Fibonacci is undefined for negative n")
    if n < 2:
        return n  # F(0) = 0, F(1) = 1
    return fib_recursive(n - 1) + fib_recursive(n - 2)


def fib_iterative(n: int) -> int:
    """Bottom-up iteration. O(n) time, O(1) space - the version to prefer.

    Walk from the base cases upward, keeping only the previous two values.
    No recursion, so no recursion-limit ceiling and no per-call overhead.
    """
    if n < 0:
        raise ValueError("Fibonacci is undefined for negative n")
    previous, current = 0, 1  # F(0), F(1)
    for _ in range(n):
        previous, current = current, previous + current
    return previous


def fib_memoized(n: int, _cache: dict[int, int] | None = None) -> int:
    """Top-down recursion with a cache. O(n) time, O(n) space.

    ``_cache`` defaults to ``None``, not ``{}``: a mutable default argument is
    created once at function-definition time and would be shared (and grow)
    across every call - a classic Python footgun. Instead we create a fresh
    dict on the top-level call and thread it through the recursion.
    """
    if n < 0:
        raise ValueError("Fibonacci is undefined for negative n")
    if _cache is None:
        _cache = {}
    if n < 2:
        return n
    if n not in _cache:
        _cache[n] = fib_memoized(n - 1, _cache) + fib_memoized(n - 2, _cache)
    return _cache[n]


@lru_cache(maxsize=None)
def fib_lru(n: int) -> int:
    """Memoisation the idiomatic stdlib way: ``functools.lru_cache``.

    Same complexity as ``fib_memoized`` with less code. The cache lives on the
    function object and persists between calls for the process lifetime - a
    feature for repeated use, something to reset in tests via
    ``fib_lru.cache_clear()``.
    """
    if n < 0:
        raise ValueError("Fibonacci is undefined for negative n")
    if n < 2:
        return n
    return fib_lru(n - 1) + fib_lru(n - 2)


if __name__ == "__main__":
    print("broken: ", [fib_broken(i) for i in range(10)])   # 0,1,2,4,8,16,32,64,128,256
    print("fixed:  ", [fib_iterative(i) for i in range(10)])  # 0,1,1,2,3,5,8,13,21,34
    print("F(100): ", fib_iterative(100))  # 354224848179261915075
