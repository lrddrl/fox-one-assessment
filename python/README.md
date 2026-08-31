# Part 2 — Python

Python 3 standard library only. No third-party packages.

## Layout

| File | Task |
|---|---|
| `most_common_word.py` | 1 — strings & collections |
| `merge_intervals.py`  | 2 — data structures & algorithms |
| `logger.py`           | 3 — OOP design & API thinking |
| `fibonacci.py`        | 4 — debugging & refactoring |
| `group_anagrams.py`   | 5 — hashing & grouping |
| `tests/`              | `unittest` suite, one module per task (54 tests) |

The source files are kept short; this README carries the approach, edge cases,
and trade-offs for each task.

## Running

From the repository root:

```bash
python -m unittest discover -s python/tests -t python -v
```

Or from inside `python/`:

```bash
cd python
python -m unittest discover -s tests -t . -v
```

Each file is also runnable on its own for a quick manual check:

```bash
python python/merge_intervals.py
```

## Task notes

### Task 1 — `most_common_word(text, stopwords=None) -> str | None`

**Approach.** Lower-case the text, split on whitespace, strip leading/trailing
punctuation off each token, drop anything with no letter in it and anything in
the stopword set, count with `collections.Counter`, return the top entry.

**Edge cases.** Empty / whitespace-only / punctuation-only input → `None`.
Every token filtered out by stopwords → `None`. `None` text → `None`
(defensive). Counting and stopword matching are case-insensitive. Contractions
and hyphenated words stay whole (`don't`, `one-nil`) because `str.strip` only
touches the ends. Pure-number tokens (`3`, `2026`) are dropped by the
"must contain a letter" check; alphanumerics that read as words (`76ers`) are
kept.

**Tie-break.** `Counter.most_common` keeps first-seen order on ties, i.e.
first-mention wins — deterministic.

**Alternatives.** `re.findall` with a word pattern is more compact, but
splitting on whitespace and trimming punctuation is easy to read and easy to
adjust (e.g. keep `.` for tokens like `U.S.`).

### Task 2 — `merge_intervals(intervals) -> list[list[int]]`

**Approach.** Sort by start, then one linear pass holding a "current"
interval: if the next interval starts at or before `current.end`, extend
`current.end`; otherwise emit `current` and start fresh. Sorting first means
any overlapping interval must start inside the current block, so no pairwise
comparisons are needed.

**Complexity.** O(n log n) time (the sort), O(n) space for the output. The
input list and its rows are not mutated.

**Decision.** Touching intervals (`[1,3]`, `[3,5]`) **merge** into `[1,5]`
(`<=` comparison). Half-open ranges would use `<`. Assumes `start <= end` per
interval.

**Alternatives.** A +1 / −1 sweep-line also answers "max concurrent overlaps"
but is more code than a plain merge needs; an interval tree pays off only for
repeated queries.

### Task 3 — `Logger`

**Interface.** `log(message)`, `get_logs()`, `search(query)`.

**Internals.** A `list[str]` — O(1) append, insertion order for free, which is
all a log needs. `get_logs()` returns a **copy** so callers cannot corrupt
internal state. `search` is a **case-insensitive substring** match (the
least-surprising default; not regex, not word-match).

**Separation of concerns.** The class only stores and retrieves. Timestamps,
levels, and formatting are deliberately out — they can be added as a
`LogRecord` object without breaking `log(message: str)`. Writing to files or
the network is a separate "sink" concern. Not thread-safe by contract.

**Scaling.** `search` is O(n·m). Fine for tens of thousands of lines. Millions
→ maintain an inverted index (token → message ids) on `log()`; a more complex
object, not justified by this interface.

### Task 4 — Fibonacci

The task is to write a Fibonacci function, **introduce a flaw on purpose**, then
diagnose and fix it. Mine has both kinds the brief mentions — a bug *and* a
design issue:

```python
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 1)   # bug: should be fib(n - 2)
```

**Why this bug.** A crash is uninteresting to debug — the traceback tells you
where to look. I wanted the failure mode that actually costs teams time: code
that **runs, returns numbers, and is wrong**. This never raises, the values look
plausible, and the base cases are *correct*, so the obvious place to look is
clean. Only a test against known values catches it — which is why
`fib_broken` stays in the module and the suite asserts exactly how it fails.

**The bug.** `fib(n) == 2 × fib(n-1) == 2ⁿ⁻¹` for `n ≥ 1`. `fib(5)` → 16, not 5.
F(0) and F(1) still agree, so a smoke test of just those two would pass.

**The design issue.** Fixing the typo leaves the shape wrong: two-way recursion
with no memoization is O(2ⁿ), and deep `n` trips `RecursionError`. Negative
input is unguarded too.

**Fix.** Correct the recursive call, reject `n < 0`, and compute each number
once (iterative / memoized).

**Alternatives.** Matrix exponentiation / fast doubling gets O(log n) but is
only worth it in a hot path; Binet's closed form is O(1) but goes silently
wrong past ~F(70) on float precision.

| Version | Time | Space | Readability |
|---|---|---|---|
| `fib_recursive` | O(2ⁿ) | O(n) stack | best — it *is* the definition |
| `fib_iterative` | O(n) | O(1) | good, but the tuple swap needs a moment; no longer looks like the maths |
| `fib_memoized` | O(n) | O(n) cache + O(n) stack | fair — the `_cache` parameter leaks plumbing into the signature |
| `fib_lru` | O(n) | O(n) cache | best of the fast three — one decorator, no plumbing |

**Two different winners, which is the interesting part.** `fib_iterative` is the
best *performer* (constant space, no recursion ceiling, no cache to invalidate);
`fib_lru` is the best *readability-per-speed* — it keeps the shape of the
definition and buys O(n) for one line. I default to `fib_iterative` because this
function has one job and O(1) space is free here; on a messier recurrence where
the recursive form carried real meaning, I'd take `lru_cache`.

**Why they differ.** Naive recursion recomputes the same subproblems
exponentially — `fib(5)` evaluates `fib(3)` twice and `fib(2)` three times.
Memoization stores each result the first time, collapsing the call tree to the
O(n) *distinct* subproblems. The iterative version avoids recursion entirely,
holding only the last two values — so there's neither a cache nor a stack to
grow.

**Edge cases.** `n = 0` → 0 and `n = 1` → 1 (the seeds, easy to get off by one);
`n < 0` → `ValueError` rather than silent nonsense or a `RecursionError`; very
large `n` is exact, not an overflow, because Python ints are arbitrary
precision; `fib_lru`'s cache persists across calls, so tests `cache_clear()`
between runs.

### Task 5 — `group_anagrams(words) -> list[list[str]]`

**Approach.** Canonical key = sorted letters of the word (`eat` → `aet`).
Bucket words into a `defaultdict(list)` by key in one pass; return the
buckets. Dict insertion order gives predictable output (groups by first
appearance, words in input order).

**Complexity.** O(n·k log k) for n words up to length k — the per-word sort
dominates.

**Alternative key.** A letter-count tuple is O(k) per word instead of
O(k log k); better for long strings. The sorted-key was chosen for being
shorter and more obviously correct on short words.

**Decisions.** Case-sensitive (one-line `casefold()` change to ignore case).
Empty strings group together. Duplicates are kept (grouping, not deduping).
