from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.schema.rubric import RubricCriteriaRead

class SubmissionRubricCriteriaRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    max_score: Decimal
    order_index: int

class RubricLevelRead(BaseModel):
    id: UUID
    label: str
    score: Decimal
    description: Optional[str]

class SubmissionScoreRead(BaseModel):
    id: UUID
    criterion: Optional[SubmissionRubricCriteriaRead] = None
    selected_level: Optional[RubricLevelRead] = None
    score: Decimal
    reasoning: Optional[str] = None
    human_override: bool = False

class SubmissionRead(BaseModel):
    id: UUID
    assignment_id: UUID
    submission_url: str
    graded_at: Optional[datetime] = None
    total_score: Optional[Decimal] = None
    created_at: datetime
    scores: List[SubmissionScoreRead] = []

class SubmissionScoreCreate(BaseModel):
    criterion_id: UUID
    selected_level_id: Optional[UUID] = None
    score: Decimal
    reasoning: Optional[str] = None
    human_override: bool = False

class SubmissionCreate(BaseModel):
    assignment_id: UUID
    submission_url: str
    graded_at: Optional[datetime] = None
    total_score: Optional[Decimal] = None
    scores: Optional[List[SubmissionScoreCreate]] = []

class SubmissionUpdate(BaseModel):
    submission_url: Optional[str] = None
    graded_at: Optional[datetime] = None
    total_score: Optional[Decimal] = None
    scores: Optional[List[SubmissionScoreCreate]] = []

