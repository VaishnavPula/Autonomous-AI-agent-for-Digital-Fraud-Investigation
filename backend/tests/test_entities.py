import pytest
from httpx import AsyncClient


class TestEntities:
    async def test_create_entity(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/entities/",
            headers=auth_headers,
            json={
                "name": "Test Entity",
                "entity_type": "person",
                "attributes": {"email": "test@example.com", "phone": "+1234567890"},
                "risk_score": 25.0,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Entity"
        assert data["entity_type"] == "person"
        assert "id" in data

    async def test_list_entities(self, client: AsyncClient, auth_headers):
        for i in range(3):
            await client.post(
                "/api/v1/entities/",
                headers=auth_headers,
                json={"name": f"Entity {i}", "entity_type": "person"},
            )

        response = await client.get("/api/v1/entities/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3

    async def test_list_entities_with_filters(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/entities/?entity_type=person&risk_level=high",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["entity_type"] == "person"

    async def test_get_entity(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/entities/",
            headers=auth_headers,
            json={"name": "Get Entity", "entity_type": "organization"},
        )
        entity_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/entities/{entity_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == entity_id
        assert data["name"] == "Get Entity"

    async def test_update_entity(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/entities/",
            headers=auth_headers,
            json={"name": "Original", "entity_type": "person"},
        )
        entity_id = create_response.json()["id"]

        response = await client.patch(
            f"/api/v1/entities/{entity_id}",
            headers=auth_headers,
            json={"name": "Updated", "risk_score": 75.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated"
        assert data["risk_score"] == 75.0

    async def test_resolve_entities(self, client: AsyncClient, auth_headers):
        create1 = await client.post(
            "/api/v1/entities/",
            headers=auth_headers,
            json={"name": "Entity A", "entity_type": "person", "attributes": {"email": "a@test.com"}},
        )
        create2 = await client.post(
            "/api/v1/entities/",
            headers=auth_headers,
            json={"name": "Entity B", "entity_type": "person", "attributes": {"email": "b@test.com"}},
        )
        entity_a_id = create1.json()["id"]
        entity_b_id = create2.json()["id"]

        response = await client.post(
            "/api/v1/entities/resolve",
            headers=auth_headers,
            json={
                "entity_ids": [entity_a_id, entity_b_id],
                "match_threshold": 0.8,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "matches" in data

    async def test_get_entity_relationships(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/entities/",
            headers=auth_headers,
            json={"name": "Relationship Entity", "entity_type": "person"},
        )
        entity_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/entities/{entity_id}/relationships", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "relationships" in data

    async def test_get_entity_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/entities/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_type" in data
        assert "by_risk_level" in data
        assert "resolved_count" in data