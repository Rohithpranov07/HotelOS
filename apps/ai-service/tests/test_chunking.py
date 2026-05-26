"""Unit tests for the KB ingestion chunker."""

import sys
from pathlib import Path

# Ingestion script lives next to ``scripts/`` — make it importable.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.ingest_knowledge_base import chunk_text, expand_documents  # noqa: E402


def test_chunk_text_returns_single_chunk_when_short():
    chunks = chunk_text("Short text here.", target_tokens=400)
    assert chunks == ["Short text here."]


def test_chunk_text_splits_on_paragraph_boundaries():
    para_a = "A" * 1200
    para_b = "B" * 1200
    text = f"{para_a}\n\n{para_b}"
    chunks = chunk_text(text, target_tokens=400)  # 1600-char budget
    # Both paragraphs are < budget individually, > budget combined, so we should
    # see exactly two chunks split cleanly along the \n\n boundary.
    assert len(chunks) == 2
    assert chunks[0] == para_a
    assert chunks[1] == para_b


def test_chunk_text_hard_splits_a_single_oversized_paragraph():
    text = "X" * 5000
    chunks = chunk_text(text, target_tokens=400)  # 1600-char limit
    assert len(chunks) >= 3
    assert all(len(c) <= 1600 for c in chunks)


def test_expand_documents_renames_chunked_ids():
    doc = {"id": "policy-1", "text": "X" * 5000, "category": "policy"}
    expanded = expand_documents([doc], chunk_tokens=400)
    assert len(expanded) > 1
    assert expanded[0]["id"] == "policy-1_chunk_0"
    assert all(d["category"] == "policy" for d in expanded)


def test_expand_documents_preserves_short_docs():
    doc = {"id": "faq-1", "text": "Hello world", "category": "faq"}
    expanded = expand_documents([doc], chunk_tokens=400)
    assert expanded == [doc]
