"""Работа с календарным графиком."""
from fastapi import APIRouter
from app.matching.schedule import load_schedule
from app.matching.rules import load_rules

router = APIRouter()


@router.get("/schedule")
def get_schedule(path: str = "data/schedule.example.csv"):
    stages = load_schedule(path)
    return [s.model_dump() for s in stages]


@router.get("/rules")
def get_rules(path: str = "data/equipment_rules.json"):
    return load_rules(path)
