from __future__ import annotations

from typing import Any

from app.schemas.graph import EdgeOutput, GraphInput, GraphOutput, NodeId


def _node_key(node: NodeId) -> str:
    return str(node)


class GraphStore:
    def __init__(self) -> None:
        self._graph: GraphInput | None = None
        self._adjacency: dict[str, list[tuple[str, float]]] = {}
        self._key_to_node: dict[str, NodeId] = {}

    @property
    def is_loaded(self) -> bool:
        return self._graph is not None

    def load(self, graph: GraphInput) -> None:
        node_keys = [_node_key(node) for node in graph.nodes]
        if len(node_keys) != len(set(node_keys)):
            raise ValueError("nodes must be unique")

        adjacency: dict[str, list[tuple[str, float]]] = {key: [] for key in node_keys}
        node_set = set(node_keys)

        for edge in graph.edges:
            from_key = _node_key(edge.from_)
            to_key = _node_key(edge.to)
            if from_key not in node_set or to_key not in node_set:
                raise ValueError("edge references unknown node")
            adjacency[from_key].append((to_key, edge.weight))
            if not graph.directed:
                adjacency[to_key].append((from_key, edge.weight))

        self._graph = graph
        self._adjacency = adjacency
        self._key_to_node = {_node_key(node): node for node in graph.nodes}

    def get_graph(self) -> GraphOutput:
        if self._graph is None:
            raise ValueError("no graph loaded")
        return GraphOutput(
            nodes=list(self._graph.nodes),
            edges=[
                EdgeOutput(from_=edge.from_, to=edge.to, weight=edge.weight)
                for edge in self._graph.edges
            ],
            directed=self._graph.directed,
        )

    def has_node(self, node: NodeId) -> bool:
        return _node_key(node) in self._adjacency

    def to_original(self, key: str) -> NodeId:
        return self._key_to_node[key]

    def adjacency(self) -> dict[str, list[tuple[str, float]]]:
        if not self.is_loaded:
            raise ValueError("no graph loaded")
        return self._adjacency


graph_store = GraphStore()
