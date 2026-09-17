"""Точка входа FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.database import Base, engine
from app.routes import analyze as analyze_route
from app.routes import schedule as schedule_route
from app.routes import deviations as deviations_route
from app.routes import status as status_route

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Construction Site Monitoring API",
    description="Обнаружение техники на стройплощадке и сопоставление с графиком работ",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(analyze_route.router, prefix="/api", tags=["analyze"])
app.include_router(schedule_route.router, prefix="/api", tags=["schedule"])
app.include_router(deviations_route.router, prefix="/api", tags=["deviations"])
app.include_router(status_route.router, prefix="/api", tags=["status"])
