"""Task 4 - Debugging & refactoring: the Fibonacci function.

NOTE ON THE PROMPT
------------------
The exercise says "you are given a broken Fibonacci function" but no snippet
was included in the material provided (Danny had already omitted Part 2 once).
The analysis below is written against the form that is broken this way in the
large majority of cases. If the real handout differs, the three corrected
implementations still stand and only the "bug" bullets need adjusting.

The usual broken version
------------------------
    def fib(n):
        if n <= 2:
            return 1
        return fib(n - 1) + fib(n - 2)

Two defects:

1. Wrong base cases / off-by-one. The sequence is conventionally
   F(0)=0, F(1)=1, F(2)=1, F(3)=2, ...  With ``if n <= 2: return 1`` you get
   F(0)=1 and F(1)=1, so every value from the seed onward is shifted. Negative
   ``n`` silently returns 1 instead of being rejected.
2. Exponential blow-up. Each call spawns two more calls, so the work doubles
   with every step: O(2**n). F(40) is ~1.6e9 calls (seconds to minutes), and
   F(1000) also exceeds Python's default recursion limit (~1000) and raises
   ``RecursionError`` regardless of time.

Another common broken form omits the base case entirely (``return fib(n - 1) +
fib(n - 2)`` with no ``if``), which recurses forever -> immediate
``RecursionError``.

The fix: correct the base cases (F(0)=0, F(1)=1, reject n < 0) and change the
algorithm so each Fibonacci number is computed once.

Trade-offs of the four correct implementations
----------------------------------------------
| version        | time    | extra space        | when to use                          |
|----------------|---------|--------------------|--------------------------------------|
| fib_recursive  | O(2**n) | O(n) call stack    | reference / teaching only             |
| fib_iterative  | O(n)    | O(1)               | DEFAULT - fastest, no recursion limit |
| fib_memoized   | O(n)    | O(n) cache + stack | reads like the definition; costs      |
|                |         |                    | memory and hits the recursion limit   |
|                |         |                    | for very large n                      |
| fib_lru        | O(n)    | O(n) cache         | same idea via the stdlib              |
|                |         |                    | (functools.lru_cache); cache persists |
|                |         |                    | between calls                         |

Why they behave differently
---------------------------
The naive recursion recomputes the same subproblems again and again - fib(5)
computes fib(3) twice, fib(2) three times, and so on, which is where the
2**n comes from. Memoisation stores each result the first time it is computed,
collapsing the call tree to O(n) distinct subproblems. The iterative version
sidesteps recursion altogether: it builds the sequence bottom-up keeping only
the last two numbers, so it needs neither a cache nor stack frames.
"""

from functools import lru_cache


def fib_recursive(n: int) -> int:
    """Direct recursive definition. Correct, but O(2**n) - reference only.

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
    print([fib_iterative(i) for i in range(10)])  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
    print(fib_iterative(100))  # 354224848179261915075
