from __future__ import annotations

import heapq
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.graph import NodeId
    from app.services.graph_store import GraphStore


def _node_key(node: NodeId) -> str:
    return str(node)


def shortest_path(
    store: GraphStore, source: NodeId, target: NodeId
) -> tuple[list[NodeId], float]:
    if not store.has_node(source):
        raise ValueError(f"unknown source node: {source}")
    if not store.has_node(target):
        raise ValueError(f"unknown target node: {target}")

    source_key = _node_key(source)
    target_key = _node_key(target)
    if source_key == target_key:
        return [store.to_original(source_key)], 0.0

    adjacency = store.adjacency()
    distances: dict[str, float] = {source_key: 0.0}
    previous: dict[str, str | None] = {source_key: None}
    heap: list[tuple[float, str]] = [(0.0, source_key)]

    while heap:
        cost, node = heapq.heappop(heap)
        if cost > distances.get(node, float("inf")):
            continue
        if node == target_key:
            break
        for neighbor, weight in adjacency[node]:
            new_cost = cost + weight
            if new_cost < distances.get(neighbor, float("inf")):
                distances[neighbor] = new_cost
                previous[neighbor] = node
                heapq.heappush(heap, (new_cost, neighbor))

    if target_key not in distances:
        raise ValueError(f"no path exists between {source} and {target}")

    path_keys: list[str] = []
    current: str | None = target_key
    while current is not None:
        path_keys.append(current)
        current = previous.get(current)
    path_keys.reverse()

    return [store.to_original(key) for key in path_keys], distances[target_key]
