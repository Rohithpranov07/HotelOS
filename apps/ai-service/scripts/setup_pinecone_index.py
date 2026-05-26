"""Create the Pinecone index for the hotel knowledge base.

Run once per Pinecone project before the first /embed call. Idempotent —
if the index already exists with matching dimensions we just report it.

Usage:
    python scripts/setup_pinecone_index.py
    python scripts/setup_pinecone_index.py --cloud aws --region us-east-1 --metric cosine

Requires ``PINECONE_API_KEY`` to be set in the environment or .env file.
The embedding model is OpenAI ``text-embedding-3-small`` (1536 dims).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow ``python scripts/setup_pinecone_index.py`` from any cwd.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings  # noqa: E402

# text-embedding-3-small produces 1536-dim vectors. If you swap embedding
# models (e.g. text-embedding-3-large → 3072), update this constant.
EMBEDDING_DIMENSIONS = 1536


def main() -> int:
    parser = argparse.ArgumentParser(description="Create the Pinecone index.")
    parser.add_argument("--cloud", default="aws", help="Pinecone cloud (default: aws)")
    parser.add_argument("--region", default="us-east-1", help="Pinecone region")
    parser.add_argument(
        "--metric", default="cosine", choices=["cosine", "dotproduct", "euclidean"]
    )
    parser.add_argument(
        "--dimensions",
        type=int,
        default=EMBEDDING_DIMENSIONS,
        help=f"Vector dimensions (default: {EMBEDDING_DIMENSIONS} for text-embedding-3-small)",
    )
    args = parser.parse_args()

    if not settings.has_pinecone:
        print("PINECONE_API_KEY is not set; cannot create index.", file=sys.stderr)
        return 1

    # Imported lazily so this script can be inspected without the dep installed.
    from pinecone import Pinecone, ServerlessSpec

    pc = Pinecone(api_key=settings.pinecone_api_key)
    name = settings.pinecone_index_name

    existing = {idx["name"]: idx for idx in pc.list_indexes()}
    if name in existing:
        info = existing[name]
        dims = info.get("dimension")
        if dims and dims != args.dimensions:
            print(
                f"Index '{name}' already exists with dimension={dims} "
                f"(expected {args.dimensions}). Delete it manually before re-running.",
                file=sys.stderr,
            )
            return 2
        print(f"Index '{name}' already exists — nothing to do.")
        return 0

    print(
        f"Creating index '{name}' (dim={args.dimensions}, metric={args.metric}, "
        f"cloud={args.cloud}, region={args.region})..."
    )
    pc.create_index(
        name=name,
        dimension=args.dimensions,
        metric=args.metric,
        spec=ServerlessSpec(cloud=args.cloud, region=args.region),
    )
    print(f"Index '{name}' created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
