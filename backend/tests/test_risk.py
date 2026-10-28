import pytest
from httpx import AsyncClient


class TestRisk:
    async def test_create_risk_signal(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/risk/signals",
            headers=auth_headers,
            json={
                "signal_type": "velocity",
                "entity_id": "entity1",
                "severity": "high",
                "score": 85.0,
                "description": "High velocity transactions detected",
                "metadata": {"count": 50, "window_hours": 1},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["signal_type"] == "velocity"
        assert data["severity"] == "high"
        assert "id" in data

    async def test_list_risk_signals(self, client: AsyncClient, auth_headers):
        for i in range(3):
            await client.post(
                "/api/v1/risk/signals",
                headers=auth_headers,
                json={"signal_type": "anomaly", "entity_id": f"e{i}", "severity": "medium", "score": 50.0},
            )

        response = await client.get("/api/v1/risk/signals", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3

    async def test_calculate_risk_score(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/risk/score",
            headers=auth_headers,
            json={"entity_id": "entity1", "include_factors": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "risk_level" in data
        assert "factors" in data

    async def test_get_risk_assessment(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/risk/assessment/entity1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "entity_id" in data
        assert "overall_score" in data
        assert "signals" in data

    async def test_list_hypotheses(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/risk/hypotheses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    async def test_create_hypothesis(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/risk/hypotheses",
            headers=auth_headers,
            json={
                "title": "Money Laundering Scheme",
                "description": "Structured deposits detected",
                "hypothesis_type": "money_laundering",
                "confidence": 0.85,
                "supporting_evidence": ["evidence1", "evidence2"],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Money Laundering Scheme"
        assert data["confidence"] == 0.85

    async def test_get_risk_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/risk/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_signals" in data
        assert "by_severity" in data
        assert "by_type" in data
        assert "avg_score" in data
        assert "false_positive_rate" in data