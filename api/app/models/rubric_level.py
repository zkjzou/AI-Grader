from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal

class RubricLevel(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    criterion_id: UUID = Field(foreign_key="rubriccriteria.id")
    label: str
    score: Decimal
    description: Optional[str] = None

    criterion: Optional["RubricCriteria"] = Relationship(back_populates="levels")
