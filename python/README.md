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
| `tests/`              | `unittest` suite, one module per task (51 tests) |

Every source file opens with a module docstring covering the approach, edge
cases, alternatives considered, and trade-offs. This README is the short
version.

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

**Approach.** Lower-case the text, extract word tokens with a regex (not
`str.split`, which keeps punctuation stuck to words), drop stopwords, count
with `collections.Counter`, return the top entry.

**Edge cases.** Empty / whitespace-only / punctuation-only input → `None`.
Every token filtered out by stopwords → `None`. `None` text → `None`
(defensive). Counting and stopword matching are case-insensitive. Contractions
and hyphenated words stay whole (`don't`, `one-nil`). Pure-number tokens (`3`,
`2026`) are not counted as words; alphanumerics that read as words (`76ers`)
are.

**Tie-break.** `Counter.most_common` keeps first-seen order on ties, i.e.
first-mention wins — deterministic. A different rule (alphabetical, longest)
would be an explicit sort, shown commented in the code.

**Alternatives.** `re.findall(r"\w+")` is Unicode-aware but also grabs digits
and underscores and gives no control over apostrophes; the chosen ASCII-word
regex is predictable for English content and is a single constant to change.

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

> ⚠️ The broken snippet was not included in the assessment material. The
> write-up targets the most common broken form (`if n <= 2: return 1`); it will
> be aligned exactly once the original is available. The corrected
> implementations do not change.

**The usual bug.** `if n <= 2: return 1` makes `F(0) = 1` (should be 0) — an
off-by-one across the whole sequence — and the two-way recursion is O(2ⁿ), so
`F(40)` is ~1.6 billion calls and large `n` also busts Python's recursion
limit.

**Fix.** Correct the base cases (`F(0)=0`, `F(1)=1`, reject `n < 0`) and
compute each number once.

| Version | Time | Space | When to use |
|---|---|---|---|
| `fib_recursive` | O(2ⁿ) | O(n) stack | reference / teaching only |
| `fib_iterative` | O(n) | O(1) | **default** — fastest, no recursion limit |
| `fib_memoized` | O(n) | O(n) cache + stack | reads like the definition; memory + depth cost |
| `fib_lru` | O(n) | O(n) cache | same idea via `functools.lru_cache`; cache persists |

**Why they differ.** Naive recursion recomputes the same subproblems
exponentially; memoisation stores each once (O(n) distinct subproblems); the
iterative version avoids recursion entirely, keeping only the last two values.

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
