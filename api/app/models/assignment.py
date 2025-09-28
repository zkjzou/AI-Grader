from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Assignment(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    course_id: UUID = Field(foreign_key="course.id")
    title: str
    description: Optional[str] = None
    rubric_url: Optional[str] = None
    solution_key_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    course: Optional["Course"] = Relationship(back_populates="assignments")
    rubrics: List["Rubric"] = Relationship(back_populates="assignment")
    submissions: List["Submission"] = Relationship(back_populates="assignment")
    problems: List["AssignmentProblem"] = Relationship(back_populates="assignment")

