# SimpleApp — Travel & Flight Optimizer

Local web app to upload a JSON route graph, visualize it, and run:

- **Smart Flight Finder** — cheapest path between two nodes (Dijkstra)
- **Tour Optimizer** — shortest tour over selected destinations (TSP)

## Tech stack

- **Backend:** Python, FastAPI, Pydantic
- **Frontend:** Angular 19

## Prerequisites

- Python 3.9+
- Node.js 18+ and npm

## Quick start

### 1. Backend

```bash
cd backend
python3 -m pip install -r requirements.txt
PYTHONPATH=. python3 -m pytest
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

App: http://localhost:4200

### 3. Try it

1. Open http://localhost:4200
2. Upload `sample-data/graph-example.json`
3. Use **Smart Flight Finder** or **Tour Optimizer**
4. Pan (drag) and zoom (scroll or buttons) on the graph

## Graph JSON format

```json
{
  "nodes": [0, 1, 2, 3, 4],
  "edges": [
    {"from": 0, "to": 1, "weight": 10}
  ],
  "directed": false
}
```

- `directed` is optional (defaults to `false`)
- For undirected graphs, one edge entry is enough per connection
- Weights must be positive numbers

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/graph/upload` | Upload graph JSON file |
| GET | `/api/graph` | Get current graph |
| POST | `/api/path/shortest` | Dijkstra shortest path |
| POST | `/api/tour/shortest` | TSP shortest tour |
