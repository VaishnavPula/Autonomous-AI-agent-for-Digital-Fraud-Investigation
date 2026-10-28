import pytest
from httpx import AsyncClient
import io


class TestTimeline:
    async def test_create_timeline_event(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/timeline/events",
            headers=auth_headers,
            json={
                "event_type": "transaction",
                "title": "Test Event",
                "description": "Test event description",
                "event_time": "2024-01-15T10:30:00Z",
                "entities": ["entity1", "entity2"],
                "risk_score": 45.0,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Event"
        assert data["event_type"] == "transaction"
        assert "id" in data

    async def test_list_timeline_events(self, client: AsyncClient, auth_headers):
        for i in range(3):
            await client.post(
                "/api/v1/timeline/events",
                headers=auth_headers,
                json={"event_type": "login", "title": f"Event {i}", "event_time": "2024-01-15T10:30:00Z"},
            )

        response = await client.get("/api/v1/timeline/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3

    async def test_get_timeline_event(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/timeline/events",
            headers=auth_headers,
            json={"event_type": "transaction", "title": "Get Event", "event_time": "2024-01-15T10:30:00Z"},
        )
        event_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/timeline/events/{event_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == event_id

    async def test_upload_timeline_csv(self, client: AsyncClient, auth_headers):
        csv_content = """event_type,title,description,event_time,entities,risk_score
transaction,Event 1,Desc 1,2024-01-15T10:30:00Z,"[\"e1\"]",30
login,Event 2,Desc 2,2024-01-15T11:00:00Z,"[\"e2\"]",10"""
        files = {"file": ("timeline.csv", io.BytesIO(csv_content.encode()), "text/csv")}

        response = await client.post(
            "/api/v1/timeline/upload",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["imported"] == 2

    async def test_analyze_timeline(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/timeline/analyze",
            headers=auth_headers,
            json={"entity_ids": ["entity1", "entity2"], "time_window_hours": 24},
        )
        assert response.status_code == 200
        data = response.json()
        assert "correlations" in data
        assert "impossible_travel" in data
        assert "suspicious_patterns" in data

    async def test_get_timeline_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/timeline/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_events" in data
        assert "by_type" in data
        assert "suspicious_count" in data
        assert "impossible_travel_count" in data