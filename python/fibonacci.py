"""Task 4 - Debugging & refactoring: the Fibonacci function.

The task: write a simple Fibonacci function, introduce a bug or design issue on
purpose, then identify it, explain it, fix it, and provide iterative and
memoized versions with a comparison.

THE FUNCTION I WROTE, WITH THE FLAW IN IT
-----------------------------------------
    def fib(n):
        if n <= 1:
            return n
        return fib(n - 1) + fib(n - 1)

It has both kinds of flaw the task mentions - a bug *and* a design issue.

Why I chose this particular bug
-------------------------------
A crash is not interesting to debug: you see the traceback and you know where
to look. I wanted the failure mode that actually costs teams time - code that
**runs, returns numbers, and is wrong**. This one does:

* it never raises,
* the values look plausible (they grow, they are positive integers),
* and the base cases are *correct*, so the obvious place to look is clean.

That is a realistic copy-paste slip, and it is the kind of defect only a test
against known values catches. Which is why `tests/test_fibonacci.py` keeps the
broken version and asserts exactly how it is wrong.

1. THE BUG: a typo in the recursive step
----------------------------------------
The second call should be ``fib(n - 2)``, not ``fib(n - 1)``.

As written, ``fib(n) == 2 * fib(n - 1)``, so the function returns
``2 ** (n - 1)`` for ``n >= 1``:

    n          0  1  2  3  4   5   6   7    8    9
    broken     0  1  2  4  8  16  32  64  128  256
    correct    0  1  1  2  3   5   8  13   21   34

``fib(5)`` gives 16 instead of 5; ``fib(10)`` gives 512 instead of 55. Note the
first two values agree - a smoke test of only F(0) and F(1) would pass.

2. THE DESIGN ISSUE: exponential recursion, and no input guard
--------------------------------------------------------------
Fixing the typo leaves the shape wrong. Two-way recursion with no memoisation
recomputes the same subproblems over and over: O(2**n). ``fib(40)`` is roughly
1.6 billion calls, and deep n also exceeds CPython's default recursion limit
(~1000 frames) and raises ``RecursionError``.

Negative input is also unguarded: ``fib(-1)`` recurses toward -inf until the
recursion limit trips, instead of failing with a clear message.

3. THE FIX
----------
Correct the recursive call, reject ``n < 0``, and - because the exponential
blow-up survives the typo fix - compute each value only once. Three correct
implementations follow, plus the fixed recursion kept as a reference.

EDGE CASES HANDLED
------------------
* ``n = 0`` -> 0 and ``n = 1`` -> 1 (the seeds; easy to get off by one)
* ``n < 0``  -> ``ValueError``, not silent nonsense or a ``RecursionError``
* very large n -> ``fib_iterative`` has no recursion ceiling; Python's int is
  arbitrary precision, so F(10_000) is exact, not an overflow
* ``fib_lru`` caches across calls, so tests must ``cache_clear()`` between runs

TRADE-OFFS
----------
| version        | time    | extra space     | readability                     |
|----------------|---------|-----------------|---------------------------------|
| fib_recursive  | O(2**n) | O(n) call stack | best - it *is* the definition   |
| fib_iterative  | O(n)    | O(1)            | good, but the tuple swap needs  |
|                |         |                 | a moment; it no longer looks    |
|                |         |                 | like the maths                  |
| fib_memoized   | O(n)    | O(n) cache      | fair - the `_cache` parameter   |
|                |         | + O(n) stack    | leaks plumbing into the API     |
| fib_lru        | O(n)    | O(n) cache      | best of the fast three - one    |
|                |         |                 | decorator, no plumbing          |

Two different winners, which is the interesting part: **`fib_iterative` is the
best performer** (constant space, no recursion limit, no cache to invalidate)
while **`fib_lru` is the best readability-per-speed** - it keeps the shape of
the definition and gets O(n) for one line. I default to `fib_iterative` because
this function has one job and O(1) space is free here; on a messier recurrence
where the recursive form carried real meaning, I would take `lru_cache`.

WHY THEY BEHAVE DIFFERENTLY
---------------------------
The naive recursion recomputes subproblems exponentially - ``fib(5)`` evaluates
``fib(3)`` twice and ``fib(2)`` three times. Memoisation stores each result the
first time it is produced, so the call tree collapses to the O(n) *distinct*
subproblems. The iterative version avoids recursion entirely: it walks upward
holding only the last two values, so there is neither a cache nor a stack to
grow.

ALTERNATIVE APPROACHES I CONSIDERED
-----------------------------------
* **A generator** (`yield` the sequence) - the better API when the caller wants
  a *run* of values rather than one; wrong shape for a single ``fib(n)``.
* **Matrix exponentiation** or **fast doubling** - O(log n) by squaring
  [[1,1],[1,0]]. Genuinely faster for huge n, and the right answer if this were
  a hot path. Not justified here: it is several times the code and needs its own
  explanation, and O(n) on Python ints is already instant at any n a caller of
  this function will pass.
* **Binet's closed form** (phi**n / sqrt(5)) - O(1) and tempting, but it uses
  floats: it silently goes wrong past F(70) or so as the mantissa runs out. An
  exactness bug is a bad trade for a constant factor.
"""

from functools import lru_cache


def fib_broken(n: int) -> int:
    """The flawed version, kept verbatim so the defect is demonstrable.

    Returns ``2 ** (n - 1)`` for n >= 1 - not the Fibonacci sequence. See the
    module docstring. Kept only as the subject of the debugging exercise;
    ``fib_iterative`` is the answer.
    """
    if n <= 1:
        return n
    # THE BUG: the second call should be fib_broken(n - 2).
    return fib_broken(n - 1) + fib_broken(n - 1)


def fib_recursive(n: int) -> int:
    """The bug fixed in place, plus an input guard. Still O(2**n).

    Kept as a reference: it reads exactly like the mathematical definition,
    which makes it a good specification to check the fast versions against for
    small n. Fine up to about n=30, painfully slow by n=40, and ``RecursionError``
    once n passes the interpreter's recursion limit.
    """
    if n < 0:
        raise ValueError("Fibonacci is undefined for negative n")
    if n < 2:
        return n  # F(0) = 0, F(1) = 1
    return fib_recursive(n - 1) + fib_recursive(n - 2)


def fib_iterative(n: int) -> int:
    """Bottom-up iteration. O(n) time, O(1) space - the version to prefer.

    Walks up from the base cases holding only the previous two values. No
    recursion, so no recursion-limit ceiling and no per-call overhead.
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
    created once at function-definition time and would then be shared - and
    grow - across every call, a classic Python footgun. Instead a fresh dict is
    created on the top-level call and threaded through the recursion.

    The leading underscore marks ``_cache`` as an implementation detail callers
    should not pass. That it appears in the signature at all is this version's
    main readability cost, and the reason ``fib_lru`` below is usually nicer.
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

    Same complexity as ``fib_memoized`` with none of the plumbing - the body is
    just the definition again. The cache lives on the function object and
    persists for the process, which is a feature for repeated use and something
    tests must reset with ``fib_lru.cache_clear()``.
    """
    if n < 0:
        raise ValueError("Fibonacci is undefined for negative n")
    if n < 2:
        return n
    return fib_lru(n - 1) + fib_lru(n - 2)


if __name__ == "__main__":
    print("broken: ", [fib_broken(i) for i in range(10)])
    print("fixed:  ", [fib_iterative(i) for i in range(10)])
    print("F(100): ", fib_iterative(100))
