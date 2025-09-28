from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal

class SubmissionScore(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    submission_id: UUID = Field(foreign_key="submission.id")
    criterion_id: UUID = Field(foreign_key="rubriccriteria.id")
    score: Decimal
    reasoning: Optional[str] = None
    human_override: bool = Field(default=False)

    submission: Optional["Submission"] = Relationship(back_populates="scores")
    criterion: Optional["RubricCriteria"] = Relationship(back_populates="submission_scores")
