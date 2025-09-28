from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal

class Submission(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    assignment_id: UUID = Field(foreign_key="assignment.id")
    submission_url: str
    graded_at: Optional[datetime] = None
    total_score: Optional[Decimal] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    assignment: Optional["Assignment"] = Relationship(back_populates="submissions")
    scores: List["SubmissionScore"] = Relationship(back_populates="submission")
    problem_matches: List["StudentProblemMatch"] = Relationship(back_populates="submission")
