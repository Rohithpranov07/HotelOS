"""Lightweight sentiment scoring.

Used by /classify and /respond to gauge complaint risk without requiring
an LLM call. Returns a score in [0.1, 0.9] (neutral = 0.5).
"""

import re

POSITIVE_WORDS = {
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "good",
    "nice",
    "perfect",
    "love",
    "happy",
    "satisfied",
    "clean",
    "helpful",
    "fast",
    "delicious",
    "lovely",
    "thanks",
    "thank",
}

NEGATIVE_WORDS = {
    "bad",
    "terrible",
    "horrible",
    "awful",
    "dirty",
    "slow",
    "rude",
    "disappointed",
    "broken",
    "loud",
    "problem",
    "issue",
    "complaint",
    "wrong",
    "cold",
    "late",
    "noisy",
    "noise",
    "smelly",
}


def score_sentiment(text: str) -> float:
    """Score text sentiment on a 0.1 → 0.9 scale (0.5 = neutral)."""
    if not text:
        return 0.5

    text_lower = text.lower()
    words = re.findall(r"\b\w+\b", text_lower)

    positive = sum(1 for w in words if w in POSITIVE_WORDS)
    negative = sum(1 for w in words if w in NEGATIVE_WORDS)

    total = positive + negative
    if total == 0:
        return 0.5

    ratio = positive / total
    return 0.1 + (ratio * 0.8)
