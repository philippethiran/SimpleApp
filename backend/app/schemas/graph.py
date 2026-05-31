from __future__ import annotations

from typing import Union

from pydantic import BaseModel, Field, field_validator

NodeId = Union[int, str]


class EdgeInput(BaseModel):
    from_: NodeId = Field(alias="from")
    to: NodeId
    weight: float

    model_config = {"populate_by_name": True}

    @field_validator("weight")
    @classmethod
    def weight_must_be_positive(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("weight must be a positive number")
        return value


class GraphInput(BaseModel):
    nodes: list[NodeId]
    edges: list[EdgeInput]
    directed: bool = False

    @field_validator("nodes")
    @classmethod
    def nodes_must_not_be_empty(cls, value: list[NodeId]) -> list[NodeId]:
        if not value:
            raise ValueError("nodes must not be empty")
        return value


class EdgeOutput(BaseModel):
    from_: NodeId = Field(alias="from", serialization_alias="from")
    to: NodeId
    weight: float

    model_config = {"populate_by_name": True}


class GraphOutput(BaseModel):
    nodes: list[NodeId]
    edges: list[EdgeOutput]
    directed: bool


class ShortestPathRequest(BaseModel):
    source: NodeId
    target: NodeId


class ShortestPathResponse(BaseModel):
    path: list[NodeId]
    total_cost: float


class ShortestTourRequest(BaseModel):
    destinations: list[NodeId]

    @field_validator("destinations")
    @classmethod
    def at_least_two_destinations(cls, value: list[NodeId]) -> list[NodeId]:
        if len(value) < 2:
            raise ValueError("destinations must contain at least 2 nodes")
        return value


class ShortestTourResponse(BaseModel):
    tour: list[NodeId]
    total_cost: float
    segments: list[list[NodeId]]
