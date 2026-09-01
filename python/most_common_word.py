import string
from collections import Counter


def most_common_word(text: str, stopwords: set[str] | None = None) -> str | None:
    if not text:
        return None

    ignore = {w.lower() for w in stopwords} if stopwords else set()

    counts = Counter()
    for token in text.lower().split():
        word = token.strip(string.punctuation)
        if word and word not in ignore and any(c.isalpha() for c in word):
            counts[word] += 1

    if not counts:
        return None
    return counts.most_common(1)[0][0]


if __name__ == "__main__":
    sample = "The Rams beat the Niners. The Rams! Rams football."
    print(most_common_word(sample))
    print(most_common_word(sample, stopwords={"the"}))