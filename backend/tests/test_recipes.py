import pytest
from uuid import uuid4
from tests.conftest import client, mock_supabase, mock_user


def test_get_recipes_unauthorized(client):
    response = client.get("/api/v1/recipes")
    assert response.status_code == 403


def test_create_recipe(client, mock_supabase, mock_user):
    # Mock authentication
    with patch('app.core.dependencies.get_current_user', return_value=mock_user):
        recipe_data = {
            "title": "Test Recipe",
            "description": "A test recipe",
            "ingredients": [
                {"name": "Flour", "amount": 2, "unit": "cups", "order_index": 1}
            ],
            "steps": [
                {"description": "Mix ingredients", "order_index": 1}
            ],
            "tag_ids": []
        }
        
        response = client.post("/api/v1/recipes", json=recipe_data)
        assert response.status_code in [200, 201]


def test_get_recipe_not_found(client, mock_supabase, mock_user):
    recipe_id = str(uuid4())
    with patch('app.core.dependencies.get_current_user', return_value=mock_user):
        response = client.get(f"/api/v1/recipes/{recipe_id}")
        assert response.status_code == 404

