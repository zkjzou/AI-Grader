from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal

class StudentProblemMatch(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    submission_id: UUID = Field(foreign_key="submission.id")
    problem_id: UUID = Field(foreign_key="assignmentproblem.id")
    matched_text: str
    confidence: Decimal

    submission: Optional["Submission"] = Relationship(back_populates="problem_matches")
    problem: Optional["AssignmentProblem"] = Relationship(back_populates="student_matches")
