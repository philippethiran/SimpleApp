from fastapi import APIRouter, HTTPException

from app.schemas.graph import (
    ShortestPathRequest,
    ShortestPathResponse,
    ShortestTourRequest,
    ShortestTourResponse,
)
from app.services.dijkstra import shortest_path
from app.services.graph_store import graph_store
from app.services.tsp import shortest_tour

router = APIRouter(prefix="/api", tags=["optimize"])


@router.post("/path/shortest", response_model=ShortestPathResponse)
def find_shortest_path(body: ShortestPathRequest) -> ShortestPathResponse:
    if not graph_store.is_loaded:
        raise HTTPException(status_code=404, detail="no graph loaded")
    try:
        path, total_cost = shortest_path(graph_store, body.source, body.target)
        return ShortestPathResponse(path=path, total_cost=total_cost)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/tour/shortest", response_model=ShortestTourResponse)
def find_shortest_tour(body: ShortestTourRequest) -> ShortestTourResponse:
    if not graph_store.is_loaded:
        raise HTTPException(status_code=404, detail="no graph loaded")
    try:
        tour, total_cost, segments = shortest_tour(graph_store, body.destinations)
        return ShortestTourResponse(
            tour=tour, total_cost=total_cost, segments=segments
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
