import json

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.graph import GraphInput, GraphOutput
from app.services.graph_store import graph_store

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.post("/upload", response_model=GraphOutput)
async def upload_graph(file: UploadFile = File(...)) -> GraphOutput:
    try:
        raw = await file.read()
        payload = json.loads(raw.decode("utf-8"))
        graph = GraphInput.model_validate(payload)
        graph_store.load(graph)
        return graph_store.get_graph()
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="invalid JSON file") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=GraphOutput)
def get_graph() -> GraphOutput:
    try:
        return graph_store.get_graph()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
