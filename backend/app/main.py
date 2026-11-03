from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import tm, simulation, projects
from .storage.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    await init_db()
    yield


app = FastAPI(
    title="Turing Studio Local Backend",
    version="1.0.0",
    description="Deterministic runtime, validator, compiler, and storage for Turing machines.",
    lifespan=lifespan,
)

# Enable CORS for local desktop UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tm.router)
app.include_router(simulation.router)
app.include_router(projects.router)


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "Turing Studio Backend",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
