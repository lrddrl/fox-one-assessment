"""Task 1 - Strings & collections.

    most_common_word(text, stopwords=None) -> str | None

Return the word that appears most often in ``text``. Return ``None`` when the
text has no countable word (empty / whitespace-only / punctuation-only input,
or every word removed by the stopword filter).

Approach
--------
1. Normalise so that "Goal", "goal." and "GOAL" all count as the same word:
   lower-case the text and pull out word tokens with a regex rather than
   ``str.split`` (plain split keeps punctuation attached -> "goal." != "goal").
2. Remove stopwords (also lower-cased, so the caller need not worry about case).
3. Count with ``collections.Counter`` and take the top entry.

Tie-breaking
------------
``Counter.most_common`` returns the most frequent item, and on a tie it keeps
the order items were first seen - i.e. first-mention wins. That is
deterministic and a reasonable rule here. A different rule (alphabetical,
longest word) would be an explicit sort; see the commented block below.

Edge cases handled
------------------
* ""  /  "   "  /  "!!!"                      -> None
* text is None                                -> None (defensive; signature says str)
* every token is a stopword                   -> None
* mixed case                                  -> counted case-insensitively
* "don't", "one-nil"                          -> kept as a single token
* "3", "2026" (pure numbers)                  -> not counted as words
* "76ers" (alphanumeric that reads as a word) -> counted

Alternatives considered
-----------------------
* ``text.lower().split()`` + ``str.strip(punctuation)``: simpler to read but
  awkward for internal punctuation and produces empty tokens.
* ``re.findall(r"\\w+", text)``: ``\\w`` is Unicode-aware (nice for accented
  text) but also matches digits and underscore and gives no control over
  apostrophes. The chosen ASCII-word regex is predictable for the
  English-language sports / entertainment content this targets, and the policy
  lives in one constant (``_WORD_RE``) that is trivial to swap.
* A hand-rolled dict counter: ``Counter`` is the idiomatic stdlib tool and
  states intent in a single line.
"""

import re
from collections import Counter

# A word: a run of ASCII letters/digits, optionally joined by a single
# apostrophe or hyphen ("don't", "one-nil"). The pattern cannot start or end
# on the ' or -, so a stray quote never becomes its own token.
_WORD_RE = re.compile(r"[a-z0-9]+(?:['-][a-z0-9]+)*")


def _tokenise(text: str) -> list[str]:
    """Lower-case ``text`` and split it into word tokens.

    Kept separate from the counting logic so the "what counts as a word"
    decision lives in one obvious, independently testable place.
    """
    tokens = _WORD_RE.findall(text.lower())
    # "most common *word*" -> drop pure-number tokens ("3", "2026") but keep
    # alphanumerics that read as words ("76ers", "3d"). Change this one line if
    # the caller wants bare numbers to count.
    return [token for token in tokens if any(char.isalpha() for char in token)]


def most_common_word(text: str, stopwords: set[str] | None = None) -> str | None:
    """Return the single most common word in ``text``.

    Args:
        text: Input text; may be empty.
        stopwords: Words to ignore, compared case-insensitively. ``None`` (the
            default) means no stopwords are removed.

    Returns:
        The most frequent word, lower-cased/normalised, or ``None`` if no word
        remains to count.
    """
    # Guards against "" and, defensively, None. Either way there is no answer.
    if not text:
        return None

    # Normalise the stopword set once so the filter below is a plain O(1) lookup.
    ignore = {word.lower() for word in stopwords} if stopwords else set()

    counts = Counter(token for token in _tokenise(text) if token not in ignore)
    if not counts:
        return None

    # most_common(1) -> [(word, count)]; [0][0] is the word. Ties keep
    # first-seen order.
    #
    # For an explicit alphabetical tie-break instead:
    #   return min(counts.items(), key=lambda kv: (-kv[1], kv[0]))[0]
    return counts.most_common(1)[0][0]


if __name__ == "__main__":
    sample = "The Rams beat the Niners. The Rams! Rams football."
    print(most_common_word(sample))  # -> 'rams'
    print(most_common_word(sample, stopwords={"the"}))  # -> 'rams'
