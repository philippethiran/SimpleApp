from __future__ import annotations

import itertools
from typing import TYPE_CHECKING

from app.services.dijkstra import shortest_path

if TYPE_CHECKING:
    from app.schemas.graph import NodeId
    from app.services.graph_store import GraphStore


def _build_distance_matrix(
    store: GraphStore, destinations: list[NodeId]
) -> tuple[list[NodeId], list[list[float]], dict[tuple[NodeId, NodeId], list[NodeId]]]:
    ordered = list(dict.fromkeys(destinations))
    if len(ordered) < 2:
        raise ValueError("destinations must contain at least 2 unique nodes")

    for node in ordered:
        if not store.has_node(node):
            raise ValueError(f"unknown destination node: {node}")

    size = len(ordered)
    matrix = [[0.0] * size for _ in range(size)]
    segment_paths: dict[tuple[NodeId, NodeId], list[NodeId]] = {}

    for i, source in enumerate(ordered):
        for j, target in enumerate(ordered):
            if i == j:
                continue
            path, cost = shortest_path(store, source, target)
            matrix[i][j] = cost
            segment_paths[(source, target)] = path

    return ordered, matrix, segment_paths


def _tour_cost(order: list[int], matrix: list[list[float]]) -> float:
    total = 0.0
    for i in range(len(order)):
        current = order[i]
        nxt = order[(i + 1) % len(order)]
        total += matrix[current][nxt]
    return total


def _exact_tsp(order_indices: list[int], matrix: list[list[float]]) -> list[int]:
    if len(order_indices) <= 1:
        return order_indices

    anchor = order_indices[0]
    rest = order_indices[1:]
    best_order = order_indices
    best_cost = float("inf")

    for perm in itertools.permutations(rest):
        candidate = [anchor, *perm]
        cost = _tour_cost(candidate, matrix)
        if cost < best_cost:
            best_cost = cost
            best_order = list(candidate)

    return best_order


def _nearest_neighbor(order_indices: list[int], matrix: list[list[float]]) -> list[int]:
    unvisited = set(order_indices[1:])
    tour = [order_indices[0]]
    current = order_indices[0]

    while unvisited:
        nxt = min(unvisited, key=lambda idx: matrix[current][idx])
        tour.append(nxt)
        unvisited.remove(nxt)
        current = nxt

    return tour


def _two_opt(tour_indices: list[int], matrix: list[list[float]]) -> list[int]:
    improved = True
    best = tour_indices
    while improved:
        improved = False
        for i in range(1, len(best) - 1):
            for j in range(i + 1, len(best)):
                if j - i == 1:
                    continue
                new_tour = best[:i] + best[i:j][::-1] + best[j:]
                if _tour_cost(new_tour, matrix) < _tour_cost(best, matrix):
                    best = new_tour
                    improved = True
    return best


def shortest_tour(
    store: GraphStore, destinations: list[NodeId]
) -> tuple[list[NodeId], float, list[list[NodeId]]]:
    nodes, matrix, segment_paths = _build_distance_matrix(store, destinations)
    indices = list(range(len(nodes)))

    if len(indices) <= 10:
        tour_indices = _exact_tsp(indices, matrix)
    else:
        tour_indices = _two_opt(_nearest_neighbor(indices, matrix), matrix)

    tour_nodes = [nodes[i] for i in tour_indices]
    closed_tour = tour_nodes + [tour_nodes[0]]
    total_cost = _tour_cost(tour_indices, matrix)

    segments: list[list[NodeId]] = []
    for i in range(len(tour_nodes)):
        source = tour_nodes[i]
        target = tour_nodes[(i + 1) % len(tour_nodes)]
        segments.append(segment_paths[(source, target)])

    return closed_tour, total_cost, segments
