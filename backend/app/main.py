from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import graph, optimize

app = FastAPI(title="SimpleApp Travel Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(optimize.router)
