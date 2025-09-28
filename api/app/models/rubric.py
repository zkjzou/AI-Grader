from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Rubric(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    assignment_id: UUID = Field(foreign_key="assignment.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    assignment: Optional["Assignment"] = Relationship(back_populates="rubrics")
    criteria: List["RubricCriteria"] = Relationship(back_populates="rubric")
