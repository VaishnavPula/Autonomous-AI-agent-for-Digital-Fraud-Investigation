import pytest
from httpx import AsyncClient
import io


class TestEvidence:
    async def test_upload_evidence(self, client: AsyncClient, auth_headers):
        file_content = b"Test evidence file content"
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
        data = {
            "title": "Test Evidence",
            "description": "Test evidence description",
            "evidence_type": "document",
            "source": "internal",
        }

        response = await client.post(
            "/api/v1/evidence/upload",
            headers=auth_headers,
            files=files,
            data=data,
        )
        assert response.status_code == 201
        result = response.json()
        assert result["title"] == "Test Evidence"
        assert result["evidence_type"] == "document"
        assert result["file_size"] == len(file_content)
        assert "file_hash" in result
        assert "id" in result

    async def test_upload_evidence_invalid_type(self, client: AsyncClient, auth_headers):
        files = {"file": ("test.exe", io.BytesIO(b"executable"), "application/x-executable")}
        data = {"title": "Test", "evidence_type": "document", "source": "internal"}

        response = await client.post(
            "/api/v1/evidence/upload",
            headers=auth_headers,
            files=files,
            data=data,
        )
        assert response.status_code == 400

    async def test_list_evidence(self, client: AsyncClient, auth_headers):
        for i in range(3):
            files = {"file": (f"test{i}.txt", io.BytesIO(f"content {i}".encode()), "text/plain")}
            await client.post(
                "/api/v1/evidence/upload",
                headers=auth_headers,
                files=files,
                data={"title": f"Evidence {i}", "evidence_type": "document", "source": "internal"},
            )

        response = await client.get("/api/v1/evidence/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3

    async def test_list_evidence_with_filters(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/evidence/?evidence_type=document&source=internal",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            assert item["evidence_type"] == "document"
            assert item["source"] == "internal"

    async def test_get_evidence(self, client: AsyncClient, auth_headers):
        files = {"file": ("get_test.txt", io.BytesIO(b"get test content"), "text/plain")}
        create_response = await client.post(
            "/api/v1/evidence/upload",
            headers=auth_headers,
            files=files,
            data={"title": "Get Test", "evidence_type": "document", "source": "internal"},
        )
        evidence_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/evidence/{evidence_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == evidence_id
        assert data["title"] == "Get Test"

    async def test_verify_evidence_integrity(self, client: AsyncClient, auth_headers):
        files = {"file": ("integrity.txt", io.BytesIO(b"integrity test"), "text/plain")}
        create_response = await client.post(
            "/api/v1/evidence/upload",
            headers=auth_headers,
            files=files,
            data={"title": "Integrity Test", "evidence_type": "document", "source": "internal"},
        )
        evidence_id = create_response.json()["id"]

        response = await client.post(
            f"/api/v1/evidence/{evidence_id}/verify",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "verified" in data
        assert data["verified"] is True

    async def test_chain_of_custody(self, client: AsyncClient, auth_headers):
        files = {"file": ("custody.txt", io.BytesIO(b"custody test"), "text/plain")}
        create_response = await client.post(
            "/api/v1/evidence/upload",
            headers=auth_headers,
            files=files,
            data={"title": "Custody Test", "evidence_type": "document", "source": "internal"},
        )
        evidence_id = create_response.json()["id"]

        response = await client.post(
            f"/api/v1/evidence/{evidence_id}/custody",
            headers=auth_headers,
            json={
                "action": "transferred",
                "from_user": "User A",
                "to_user": "User B",
                "notes": "Transfer for review",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["action"] == "transferred"

        response = await client.get(f"/api/v1/evidence/{evidence_id}/custody", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    async def test_get_evidence_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/evidence/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "total_size" in data
        assert "by_type" in data
        assert "by_source" in data
        assert "integrity_verified" in data