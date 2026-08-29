"""Task 2 - Data structures & algorithms.

    merge_intervals(intervals) -> list[list[int]]

Merge every set of overlapping (or touching) intervals and return the reduced
list, sorted by start.

Approach
--------
Sort by start value, then sweep left to right holding one "current" interval:

* next.start <= current.end  -> they overlap or touch; extend current.end to
  max(current.end, next.end)
* otherwise                  -> there is a gap; emit current, start a new one

Sorting first is the whole trick. Once intervals are ordered by start, any
interval that overlaps the current block must begin inside it, so a single
linear pass is enough - no need to compare every pair (which would be O(n^2)).

Complexity: O(n log n) time (the sort dominates the linear merge), O(n) extra
space for the result.

Design decision: do touching intervals merge?
---------------------------------------------
[1, 3] and [3, 5] share only the endpoint 3. This implementation MERGES them
into [1, 5] (the comparison is ``<=``). That is the usual expectation for
closed integer ranges and for things like "busy" time blocks. If intervals
were half-open [start, end) you would use ``<`` instead - a one-character
change, worth confirming with whoever owns the data model.

Assumption: each interval is well-formed with start <= end. Validating that
(or normalising [b, a] -> [a, b]) is easy to add for untrusted input; left out
to keep the core logic clear.

Alternatives considered
-----------------------
* Sweep-line with +1 / -1 events at each endpoint: more general (it also
  yields "maximum simultaneous overlap") but more code and allocation than a
  plain merge needs.
* Building an interval tree: pays off for repeated queries against a stable
  set, not for a one-shot merge.
"""


def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    """Merge overlapping / touching intervals.

    Args:
        intervals: A list of ``[start, end]`` pairs, in any order. Each pair is
            assumed to satisfy ``start <= end``.

    Returns:
        A new list of disjoint ``[start, end]`` pairs sorted by start. Empty
        input returns an empty list. The input list and its rows are not
        mutated.
    """
    if not intervals:
        return []

    # sorted() returns a new list, so we do not mutate the caller's data as a
    # side effect. The secondary key (end) just makes ordering fully
    # deterministic when two intervals share a start.
    ordered = sorted(intervals, key=lambda pair: (pair[0], pair[1]))

    # Seed with a copy of the first interval so we never write through to a
    # list object the caller still holds a reference to.
    merged: list[list[int]] = [list(ordered[0])]

    for start, end in ordered[1:]:
        current = merged[-1]
        if start <= current[1]:
            # Overlap or touch. ``end`` can be smaller than current[1] when
            # this interval sits entirely inside the current block - hence max.
            current[1] = max(current[1], end)
        else:
            # Disjoint: this interval opens a new merged block.
            merged.append([start, end])

    return merged


if __name__ == "__main__":
    print(merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]))  # [[1, 6], [8, 10], [15, 18]]
    print(merge_intervals([[1, 4], [4, 5]]))  # [[1, 5]]  (touching -> merged)
