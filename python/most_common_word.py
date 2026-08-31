import string
from collections import Counter


def most_common_word(text: str, stopwords: set[str] | None = None) -> str | None:
    if not text:
        return None

    ignore = set()
    if stopwords:
        for w in stopwords:
            ignore.add(w.lower())

    counts = Counter()

    for item in text.lower().split():
        clean_word = item.strip(string.punctuation)

        has_alpha = False
        for c in clean_word:
            if c.isalpha():
                has_alpha = True
                break

        if clean_word != "" and has_alpha:
            if clean_word not in ignore:
                counts[clean_word] += 1

    if not counts:
        return None

    top_list = counts.most_common(1)
    top_pair = top_list[0]
    result_word = top_pair[0]

    return result_word


if __name__ == "__main__":
    sample = "The Rams beat the Niners. The Rams! Rams football."
    print(most_common_word(sample))
    print(most_common_word(sample, stopwords={"the"}))