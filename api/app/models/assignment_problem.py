from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal

class AssignmentProblem(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    assignment_id: UUID = Field(foreign_key="assignment.id")
    problem_number: int
    problem_text: str
    max_score: Decimal

    assignment: Optional["Assignment"] = Relationship(back_populates="problems")
    student_matches: List["StudentProblemMatch"] = Relationship(back_populates="problem")
