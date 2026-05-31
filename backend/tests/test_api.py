import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.graph import GraphInput
from app.services.graph_store import graph_store

client = TestClient(app)

SAMPLE_GRAPH = {
    "nodes": [0, 1, 2, 3],
    "edges": [
        {"from": 0, "to": 1, "weight": 10},
        {"from": 1, "to": 2, "weight": 5},
        {"from": 0, "to": 3, "weight": 20},
        {"from": 3, "to": 2, "weight": 8},
    ],
    "directed": False,
}


@pytest.fixture(autouse=True)
def reset_graph_store():
    graph_store._graph = None
    graph_store._adjacency = {}
    graph_store._key_to_node = {}
    yield
    graph_store._graph = None
    graph_store._adjacency = {}
    graph_store._key_to_node = {}


def upload_sample_graph():
    response = client.post(
        "/api/graph/upload",
        files={"file": ("graph.json", __import__("json").dumps(SAMPLE_GRAPH), "application/json")},
    )
    assert response.status_code == 200
    return response


def test_graph_upload_and_get():
    upload_sample_graph()
    response = client.get("/api/graph")
    assert response.status_code == 200
    data = response.json()
    assert data["nodes"] == [0, 1, 2, 3]
    assert len(data["edges"]) == 4


def test_undirected_reverse_traversal():
    graph_store.load(GraphInput.model_validate(SAMPLE_GRAPH))
    from app.services.dijkstra import shortest_path

    path, cost = shortest_path(graph_store, 2, 0)
    assert path == [2, 3, 0] or path == [2, 1, 0]
    assert cost == 18 or cost == 15


def test_invalid_weight_rejected():
    bad_graph = {
        "nodes": [0, 1],
        "edges": [{"from": 0, "to": 1, "weight": -1}],
        "directed": False,
    }
    response = client.post(
        "/api/graph/upload",
        files={"file": ("graph.json", __import__("json").dumps(bad_graph), "application/json")},
    )
    assert response.status_code == 400


def test_shortest_path():
    upload_sample_graph()
    response = client.post(
        "/api/path/shortest",
        json={"source": 0, "target": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["path"][0] == 0
    assert data["path"][-1] == 2
    assert data["total_cost"] == 15


def test_unreachable_path():
    upload_sample_graph()
    isolated_graph = {
        "nodes": [0, 1, 9],
        "edges": [{"from": 0, "to": 1, "weight": 1}],
        "directed": False,
    }
    client.post(
        "/api/graph/upload",
        files={"file": ("graph.json", __import__("json").dumps(isolated_graph), "application/json")},
    )
    response = client.post(
        "/api/path/shortest",
        json={"source": 0, "target": 9},
    )
    assert response.status_code == 400


def test_shortest_tour():
    upload_sample_graph()
    response = client.post(
        "/api/tour/shortest",
        json={"destinations": [0, 1, 2, 3]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tour"][0] == data["tour"][-1]
    assert data["total_cost"] > 0
    assert len(data["segments"]) == 4


def test_tour_requires_two_destinations():
    upload_sample_graph()
    response = client.post(
        "/api/tour/shortest",
        json={"destinations": [0]},
    )
    assert response.status_code == 422
