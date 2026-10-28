import pytest
from httpx import AsyncClient


class TestGraph:
    async def test_get_network_graph(self, client: AsyncClient, auth_headers):
        response = await client.get(
            "/api/v1/graph/network?entity_ids=entity1,entity2,entity3&depth=2",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data

    async def test_find_shortest_path(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/graph/path",
            headers=auth_headers,
            json={"source_id": "entity1", "target_id": "entity2", "algorithm": "dijkstra"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "path" in data
        assert "distance" in data
        assert "algorithm" in data

    async def test_find_all_paths(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/graph/paths",
            headers=auth_headers,
            json={"source_id": "entity1", "target_id": "entity2", "max_paths": 5, "max_depth": 4},
        )
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        assert len(data["paths"]) <= 5

    async def test_detect_communities(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/graph/communities",
            headers=auth_headers,
            json={"entity_ids": ["e1", "e2", "e3", "e4", "e5"], "algorithm": "louvain", "resolution": 1.0},
        )
        assert response.status_code == 200
        data = response.json()
        assert "communities" in data
        assert "modularity" in data

    async def test_calculate_centrality(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/graph/centrality",
            headers=auth_headers,
            json={"entity_ids": ["e1", "e2", "e3"], "metrics": ["degree", "betweenness", "closeness", "eigenvector"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert "centrality" in data
        for metric in ["degree", "betweenness", "closeness", "eigenvector"]:
            assert metric in data["centrality"]

    async def test_get_subgraph(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/graph/subgraph",
            headers=auth_headers,
            json={"entity_ids": ["e1", "e2", "e3"], "include_neighbors": True, "neighbor_depth": 1},
        )
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data

    async def test_get_graph_stats(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/v1/graph/stats/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_nodes" in data
        assert "total_edges" in data
        assert "avg_degree" in data
        assert "density" in data
        assert "connected_components" in data