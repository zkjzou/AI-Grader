from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Course(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    assignments: List["Assignment"] = Relationship(back_populates="course")
