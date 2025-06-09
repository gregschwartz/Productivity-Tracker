import pytest
from fastapi.testclient import TestClient
from main import app # Import your FastAPI app

# Fixture for TestClient
@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    """Test the health check endpoint GET /health."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root_endpoint(client):
    """Test the root endpoint GET /."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Productivity Tracker API is running"}

# Add any other main app specific tests if necessary.
# For example, if there was specific middleware whose effects you wanted to test globally.
# However, the request is for basic health and root endpoint tests.
