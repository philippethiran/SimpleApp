---
title: 'Travel & Flight Optimizer'
type: 'feature'
created: '2026-05-31'
status: 'done'
baseline_commit: '6a3a957db133a9c02dc7eb3c51c4eabebed25b44'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<!-- INTENT_START -->
## Intent

Build a local web app for **Travel & Flight Optimization**. Users upload a JSON graph file, visualize it (with zoom), then run two algorithms:

1. **Smart Flight Finder** — cheapest route between two nodes via **Dijkstra**
2. **Tour Optimizer** — shortest tour visiting selected destinations via **TSP**

No authentication. Backend computes algorithms; frontend handles upload, visualization, and result display.

**Problem:** Users need to explore flight/route networks and compute optimal paths and multi-stop tours from a graph defined in JSON.

**Approach:** FastAPI backend holds the uploaded graph in memory and exposes REST endpoints for upload, shortest path, and shortest tour. Angular frontend provides file upload, interactive SVG graph view with pan/zoom, node selection, and highlighted results.

## Boundaries & Constraints

**Always:**
- Accept graph JSON: `{ nodes, edges, directed? }` per user schema; `directed` defaults to `false`
- Undirected graphs: one edge entry creates bidirectional travel at the same weight
- Weights must be positive numbers; reject invalid graphs with clear errors
- Algorithms run server-side only
- REST under `/api/`; snake_case JSON on backend
- No login or user accounts

**Ask First:**
- Adding npm/pip packages beyond Angular CLI defaults and minimal graph layout needs
- Persisting graphs to SQLite (v1 uses in-memory store only)

**Never:**
- Client-side-only algorithm execution
- External flight API integrations
- Auth, roles, or multi-user features

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| -------- | ------------- | -------------------------- | -------------- |
| Upload valid graph | JSON file with nodes + edges | Graph loaded; visualization renders all nodes/edges | 400 if malformed JSON or schema violation |
| Upload undirected | `directed: false`, edge 0→1 weight 10 | Traversal 0↔1 at cost 10 | N/A |
| Shortest path | source + target in loaded graph | Ordered path + total cost; highlight on graph | 400 if nodes missing or no path exists |
| Shortest tour | 2+ destination nodes | Visit order + total cost; highlight tour edges | 400 if <2 nodes or no connected tour |
| TSP large set | >10 destinations selected | Nearest-neighbor + 2-opt heuristic (exact permutations if ≤10) | 400 if destinations not in graph |
| Empty graph | No upload yet | UI prompts upload; API calls return 404/400 | Clear message in UI |
| Zoom/pan | Mouse wheel + drag on graph | Graph scales and pans smoothly | N/A |

## Code Map

- `backend/` — FastAPI app root
- `backend/app/main.py` — app entry, CORS for local Angular dev
- `backend/app/schemas/graph.py` — Pydantic models for graph I/O
- `backend/app/services/graph_store.py` — in-memory graph holder + validation
- `backend/app/services/dijkstra.py` — shortest path algorithm
- `backend/app/services/tsp.py` — TSP (exact ≤10 nodes, heuristic above)
- `backend/app/routes/graph.py` — upload + get current graph
- `backend/app/routes/optimize.py` — shortest path + tour endpoints
- `backend/tests/` — pytest for algorithms and routes
- `frontend/` — Angular app (standalone components)
- `frontend/src/app/services/graph-api.service.ts` — HTTP client
- `frontend/src/app/components/graph-view/` — SVG graph with pan/zoom + highlights
- `frontend/src/app/components/upload/` — file upload panel
- `frontend/src/app/components/path-finder/` — source/target + run Dijkstra
- `frontend/src/app/components/tour-optimizer/` — multi-select destinations + run TSP
- `sample-data/graph-example.json` — example graph for local testing

## Tasks & Acceptance

### Task 1: Backend scaffold + graph upload

**Execution:**
- [x] `backend/requirements.txt` — pin FastAPI, uvicorn, pydantic, pytest
- [x] `backend/app/main.py` — FastAPI app with CORS and route registration
- [x] `backend/app/schemas/graph.py` — GraphInput, Edge, NodeId (str|int), response schemas
- [x] `backend/app/services/graph_store.py` — parse, validate, store graph; build adjacency list (respect `directed`)
- [x] `backend/app/routes/graph.py` — `POST /api/graph/upload`, `GET /api/graph`
- [x] `backend/tests/test_graph_store.py` — validation + undirected edge tests

**Acceptance Criteria:**
- Given a valid JSON graph file, when uploaded via POST, then GET returns the same nodes and edges
- Given `directed: false`, when edge 0→1 weight 10 exists, then path 1→0 is reachable at cost 10
- Given invalid JSON or negative weight, when uploaded, then API returns 400 with `detail`

### Task 2: Dijkstra shortest path

**Execution:**
- [x] `backend/app/services/dijkstra.py` — Dijkstra using min-heap; returns path + cost
- [x] `backend/app/routes/optimize.py` — `POST /api/path/shortest` body `{ source, target }`
- [x] `backend/tests/test_dijkstra.py` — known graph cases + unreachable nodes

**Acceptance Criteria:**
- Given a loaded graph and valid source/target, when shortest path requested, then response includes ordered node list and total weight
- Given unreachable target, when shortest path requested, then API returns 400 with clear detail

### Task 3: TSP tour optimizer

**Execution:**
- [x] `backend/app/services/tsp.py` — exact brute-force for ≤10 destinations; nearest-neighbor + 2-opt for larger sets
- [x] `backend/app/routes/optimize.py` — `POST /api/tour/shortest` body `{ destinations: [...] }`
- [x] `backend/tests/test_tsp.py` — small graph with known optimal tour

**Acceptance Criteria:**
- Given 3+ connected destinations, when tour requested, then response includes visit order and total tour cost
- Given fewer than 2 destinations, when tour requested, then API returns 400

### Task 4: Angular frontend

**Execution:**
- [x] `frontend/` — Angular app scaffold (routing, HttpClient, standalone components)
- [x] `frontend/src/app/services/graph-api.service.ts` — upload, get graph, path, tour API calls
- [x] `frontend/src/app/components/upload/` — file picker, upload status/errors
- [x] `frontend/src/app/components/graph-view/` — circular layout SVG, pan (drag), zoom (wheel), highlight path/tour
- [x] `frontend/src/app/components/path-finder/` — source/target selectors + result display
- [x] `frontend/src/app/components/tour-optimizer/` — checkbox multi-select on nodes + result display
- [x] `sample-data/graph-example.json` — demo graph matching schema

**Acceptance Criteria:**
- Given a valid graph file, when user uploads it, then graph renders with all nodes and edges visible
- Given loaded graph, when user selects source/target and runs Smart Flight Finder, then cheapest path highlights on graph with total cost shown
- Given loaded graph, when user selects multiple destinations and runs Tour Optimizer, then tour route highlights with total cost shown
- Given API error, when any action fails, then UI shows error message (loading states during calls)

### Task 5: Local run docs

**Execution:**
- [x] `README.md` — how to start backend (`uvicorn`) and frontend (`ng serve`); sample data usage

**Acceptance Criteria:**
- Given fresh clone, when following README, then both apps start locally and full upload→visualize→optimize flow works

## Spec Change Log

| Date | Change |
| ---- | ------ |
| 2026-05-31 | Initial spec from user intent |

## Design Notes

- **Graph storage:** In-memory singleton on backend (no SQLite for v1 — graph is re-uploaded each session).
- **Layout:** Circular node placement by index order — simple, no force-layout library required.
- **Pan/zoom:** SVG `transform` with wheel delta scaling and mousedown/mousemove panning.
- **TSP scope:** User selects destinations (subset of nodes); tour starts at the best permutation (closed tour returning to start node of cycle).
- **CORS:** Allow `http://localhost:4200` for Angular dev server.

## Verification

**Commands:**
- `cd backend && pip install -r requirements.txt && pytest` — expected: all tests pass
- `cd backend && uvicorn app.main:app --reload --port 8000` — expected: API at :8000/docs
- `cd frontend && npm install && npm start` — expected: app at :4200

**Manual checks:**
- Upload `sample-data/graph-example.json`, verify graph renders
- Run Dijkstra between two nodes, confirm highlighted path matches expected cost
- Select 4+ destinations, run TSP, confirm tour highlights and cost displays
<!-- INTENT_END -->
