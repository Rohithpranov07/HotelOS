"""Ingest a hotel knowledge base JSON file into Pinecone via POST /embed.

Usage:
    python scripts/ingest_knowledge_base.py <kb.json> --property-id <uuid>
                                              [--base-url http://localhost:3006]
                                              [--chunk-tokens 400]

The JSON file is expected to be a list of records, each with:
    { "id": str, "text": str, "category": str (optional) }
Long ``text`` fields are split into ~chunk-tokens-sized chunks before
ingestion. We approximate one token ≈ four characters — good enough for
chunk sizing without pulling in a tokenizer dependency.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import httpx


# ~4 chars per token is a reasonable approximation for English prose.
CHARS_PER_TOKEN = 4


def chunk_text(text: str, target_tokens: int) -> list[str]:
    target_chars = target_tokens * CHARS_PER_TOKEN
    if len(text) <= target_chars:
        return [text]
    # Split on paragraph boundaries first, then pack into chunks.
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for p in paragraphs:
        if len(current) + len(p) + 2 <= target_chars:
            current = f"{current}\n\n{p}" if current else p
        else:
            if current:
                chunks.append(current)
            if len(p) <= target_chars:
                current = p
            else:
                # Hard-split a single oversized paragraph.
                for i in range(0, len(p), target_chars):
                    chunks.append(p[i : i + target_chars])
                current = ""
    if current:
        chunks.append(current)
    return chunks


def expand_documents(documents: list[dict], chunk_tokens: int) -> list[dict]:
    expanded: list[dict] = []
    for doc in documents:
        if "id" not in doc or "text" not in doc:
            raise ValueError(f"Document missing id or text: {doc}")
        chunks = chunk_text(doc["text"], chunk_tokens)
        if len(chunks) == 1:
            expanded.append(doc)
            continue
        for idx, chunk in enumerate(chunks):
            expanded.append(
                {
                    "id": f"{doc['id']}_chunk_{idx}",
                    "text": chunk,
                    "category": doc.get("category", "general"),
                }
            )
    return expanded


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest hotel KB JSON into Pinecone.")
    parser.add_argument("kb_file", help="Path to knowledge base JSON file")
    parser.add_argument("--property-id", required=True, help="Property UUID for tenant scoping")
    parser.add_argument(
        "--base-url", default="http://localhost:3006", help="ai-service base URL"
    )
    parser.add_argument("--chunk-tokens", type=int, default=400, help="Target tokens per chunk")
    args = parser.parse_args()

    path = Path(args.kb_file)
    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        return 1

    raw = json.loads(path.read_text())
    if not isinstance(raw, list):
        print("KB file must be a JSON list of documents", file=sys.stderr)
        return 1

    documents = expand_documents(raw, args.chunk_tokens)
    print(f"Chunked {len(raw)} source docs → {len(documents)} embeddings")

    started = time.monotonic()
    response = httpx.post(
        f"{args.base_url}/api/v1/embed",
        json={"property_id": args.property_id, "documents": documents},
        timeout=120,
    )
    elapsed = time.monotonic() - started
    if response.status_code >= 400:
        print(f"Embed failed: {response.status_code} {response.text}", file=sys.stderr)
        return 2
    payload = response.json()
    print(
        f"Ingested {payload['documents_indexed']} documents in {elapsed:.1f}s "
        f"(success={payload['success']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
