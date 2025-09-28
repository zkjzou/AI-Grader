from fastapi import FastAPI, Depends
from sqlmodel import SQLModel, Session, create_engine
from .db import create_db_and_tables
from .routers import assignments, courses, rubrics, submissions

app = FastAPI(
    title="AI Assignment Grader",
    description="Hackathon backend for single-user AI assignment grading",
    version="0.1.0",
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(assignments.router)
app.include_router(courses.router)
app.include_router(rubrics.router)
app.include_router(submissions.router)

@app.get("/")
async def root():
    return {"message": "AI Assignment Grader API is running!"}
