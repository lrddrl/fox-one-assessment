from collections import defaultdict


def group_anagrams(words: list[str]) -> list[list[str]]:

    groups: dict[str, list[str]] = defaultdict(list)
    for word in words:
        key = "".join(sorted(word))
        groups[key].append(word)
    return list(groups.values())


"""
{
  "aet": ["eat", "tea", "ate"],     
  "ant": ["tan", "nat"],
  "abt": ["bat"],
}
"""

if __name__ == "__main__":
    print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))