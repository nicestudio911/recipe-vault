import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_supabase
from unittest.mock import Mock, patch


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_supabase():
    with patch('app.db.session.get_supabase') as mock:
        yield mock


@pytest.fixture
def mock_user():
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "user_metadata": {}
    }

