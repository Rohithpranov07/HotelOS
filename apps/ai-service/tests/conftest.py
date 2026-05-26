"""Shared pytest fixtures."""

from __future__ import annotations

import sys
from pathlib import Path

# Make the app importable when pytest is invoked from anywhere.
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client() -> TestClient:
    from main import app

    return TestClient(app)
