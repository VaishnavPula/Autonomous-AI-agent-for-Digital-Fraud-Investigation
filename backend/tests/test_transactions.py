import pytest
from httpx import AsyncClient
import io


class TestTransactions:
    async def test_create_transaction(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/transactions/",
            headers=auth_headers,
            json={
                "amount": 1000.50,
                "currency": "USD",
                "sender_account": "ACC123",
                "receiver_account": "ACC456",
                "transaction_type": "transfer",
                "description": "Test transaction",
                "risk_score": 30.0,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["amount"] == 1000.50
        assert data["currency"] == "USD"
        assert "id" in data

    async def test_list_transactions(self, client: AsyncClient, auth_headers):
        for i in range(3):
            await client.post(
                "/api/v1/transactions/",
                headers=auth_headers,
                json={"amount": 100 * (i + 1), "currency": "USD", "sender_account": f"S{i}", "receiver_account": f"R{i}"},
            )

        response = await client.get("/api/v1/transactions/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3

    async def test_list_transactions_with_filters(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/transactions/?currency=USD&risk_level=high",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["currency"] == "USD"

    async def test_get_transaction(self, client: AsyncClient, auth_headers):
        create_response = await client.post(
            "/api/v1/transactions/",
            headers=auth_headers,
            json={"amount": 5000, "currency": "EUR", "sender_account": "S1", "receiver_account": "R1"},
        )
        transaction_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/transactions/{transaction_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == transaction_id
        assert data["amount"] == 5000

    async def test_import_transactions_csv(self, client: AsyncClient, auth_headers):
        csv_content = """amount,currency,sender_account,receiver_account,transaction_type,description
100,USD,ACC1,ACC2,transfer,Test 1
200,USD,ACC2,ACC3,transfer,Test 2"""
        files = {"file": ("transactions.csv", io.BytesIO(csv_content.encode()), "text/csv")}

        response = await client.post(
            "/api/v1/transactions/import",
            headers=auth_headers,
            files=files,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["imported"] == 2
        assert data["failed"] == 0

    async def test_get_transaction_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/transactions/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "total_volume" in data
        assert "avg_amount" in data
        assert "by_currency" in data
        assert "by_risk_level" in data

    async def test_get_money_flow(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/transactions/analysis/money-flow?min_amount=1000",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "flows" in data