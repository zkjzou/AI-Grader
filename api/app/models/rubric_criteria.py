from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal

class RubricCriteria(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    rubric_id: UUID = Field(foreign_key="rubric.id")
    name: str
    description: Optional[str] = None
    max_score: Decimal
    order_index: int

    rubric: Optional["Rubric"] = Relationship(back_populates="criteria")
    levels: List["RubricLevel"] = Relationship(back_populates="criterion")
    submission_scores: List["SubmissionScore"] = Relationship(back_populates="criterion")
