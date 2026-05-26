#!/usr/bin/env bash
# Generates a fresh RS256 keypair into ./secrets/.
# Used for local dev. In prod, use a real KMS / Secrets Manager rotation pipeline.
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p secrets
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/jwt-private.pem
openssl rsa -in secrets/jwt-private.pem -pubout -out secrets/jwt-public.pem
chmod 600 secrets/jwt-private.pem
chmod 644 secrets/jwt-public.pem

echo "✓ Wrote secrets/jwt-private.pem and secrets/jwt-public.pem"
