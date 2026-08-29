"""Task 5 - Hashing & grouping.

    group_anagrams(words) -> list[list[str]]

Group words that are anagrams of one another.

Approach
--------
Two words are anagrams iff they use the same letters the same number of times.
So we need a *canonical key* that is identical for anagrams and distinct
otherwise, then bucket words by that key in a hash map.

Key = the word's letters sorted ("eat" -> "aet", "tea" -> "aet"). Build a
``dict[str, list[str]]`` in a single pass; return the buckets.

* ``collections.defaultdict(list)`` keeps the accumulation loop to one line.
* ``dict`` preserves insertion order (Python 3.7+), so groups come out in the
  order each anagram family first appears, and words stay in input order
  within a group. Predictable output makes testing straightforward.

Complexity: O(n * k log k) for n words up to length k - the per-word
``sorted`` call dominates. Space O(n * k) for the buckets.

Alternative key: letter counts
------------------------------
Instead of sorting we could key on a 26-slot count tuple, or
``tuple(sorted(Counter(word).items()))``. That is O(k) per word instead of
O(k log k), so it wins for long strings. The sorted-letters key was chosen
because it is shorter and more obviously correct, and the inputs here are
short words. For DNA strings or long text the count key is the better trade.

Decisions
---------
* Case-sensitive: "Eat" and "tea" do NOT group. Normalise with
  ``word.casefold()`` in the key if case should be ignored - one line, left
  out because the spec did not ask for it.
* Empty strings all share the key "" and form their own group.
* Duplicate words land in the same bucket and are kept - the function groups,
  it does not deduplicate.
* Non-letters are treated as ordinary characters ("a!b" and "b!a" group).
"""

from collections import defaultdict


def group_anagrams(words: list[str]) -> list[list[str]]:
    """Group ``words`` into lists of mutual anagrams.

    Args:
        words: Words to group; may be empty, contain duplicates, or contain
            empty strings.

    Returns:
        A list of groups, each a list of words that are anagrams of each other.
        Groups are ordered by first appearance; words within a group keep their
        input order. Matching is case-sensitive.
    """
    groups: dict[str, list[str]] = defaultdict(list)
    for word in words:
        key = "".join(sorted(word))  # canonical form: the word's sorted letters
        groups[key].append(word)
    return list(groups.values())


if __name__ == "__main__":
    print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
    # [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
