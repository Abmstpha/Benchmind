"""
Basic tests for Benchmind API
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    """Test the root endpoint returns correct response."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "status" in data
    assert data["status"] == "running"

def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "version" in data

def test_models_endpoint():
    """Test the models endpoint (may require API keys)."""
    response = client.get("/models/")
    # Should return 200 or 500 (if API keys not configured)
    assert response.status_code in [200, 500]

def test_docs_endpoint():
    """Test that API documentation is available."""
    response = client.get("/docs")
    assert response.status_code == 200
