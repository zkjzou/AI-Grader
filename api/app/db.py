from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine
from typing import Annotated
from app.models import assignment_problem, assignment, course, rubric_criteria, rubric_level, rubric, student_problem_match, submission_score, submission

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True)

SQLModel.metadata.create_all(engine)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
        