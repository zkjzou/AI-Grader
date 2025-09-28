from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class SubmissionScoreRead(BaseModel):
    id: UUID
    submission_id: UUID
    criterion_id: UUID
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

    class Config:
        orm_mode = True

class SubmissionScoreCreate(BaseModel):
    criterion_id: UUID
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

