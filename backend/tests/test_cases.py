import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


class TestCases:
    async def test_create_case(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={
                "title": "Test Case",
                "description": "Test case description",
                "case_type": "fraud",
                "priority": "high",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Case"
        assert data["status"] == "open"
        assert "id" in data

    async def test_list_cases(self, client: AsyncClient, auth_headers):
        await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={"title": "Case 1", "case_type": "fraud"},
        )
        await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={"title": "Case 2", "case_type": "aml"},
        )

        response = await client.get("/api/v1/cases/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2

    async def test_list_cases_with_filters(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/cases/?status=open&case_type=fraud",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["status"] == "open"
            assert item["case_type"] == "fraud"

    async def test_get_case(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={"title": "Get Case Test", "case_type": "fraud"},
        )
        case_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/cases/{case_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id
        assert data["title"] == "Get Case Test"

    async def test_update_case(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={"title": "Original Title", "case_type": "fraud"},
        )
        case_id = create_response.json()["id"]

        response = await client.patch(
            f"/api/v1/cases/{case_id}",
            headers=auth_headers,
            json={"title": "Updated Title", "priority": "critical"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["priority"] == "critical"

    async def test_assign_case(self, client: AsyncClient, auth_headers, test_user):
        create_response = await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={"title": "Assign Case", "case_type": "fraud"},
        )
        case_id = create_response.json()["id"]

        response = await client.post(
            f"/api/v1/cases/{case_id}/assign",
            headers=auth_headers,
            json={"user_id": str(test_user.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["assigned_to_id"] == str(test_user.id)

    async def test_transition_case_status(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/cases/",
            headers=auth_headers,
            json={"title": "Status Test", "case_type": "fraud"},
        )
        case_id = create_response.json()["id"]

        response = await client.post(
            f"/api/v1/cases/{case_id}/status",
            headers=auth_headers,
            json={"status": "in_progress"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"

    async def test_get_case_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/cases/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_status" in data
        assert "by_priority" in data
        assert "by_type" in data