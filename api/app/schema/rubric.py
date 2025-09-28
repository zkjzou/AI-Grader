from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class RubricLevelRead(BaseModel):
    id: UUID
    label: str
    score: Decimal
    description: Optional[str]

class RubricCriteriaRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    max_score: Decimal
    order_index: int
    levels: List[RubricLevelRead] = []

class RubricRead(BaseModel):
    id: UUID
    assignment_id: UUID
    created_at: datetime
    criteria: List[RubricCriteriaRead] = []

class RubricLevelCreate(BaseModel):
    label: str
    score: Decimal
    description: Optional[str] = None

class RubricCriteriaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    max_score: Decimal
    order_index: int
    levels: List[RubricLevelCreate] = []

class RubricUpdate(BaseModel):
    assignment_id: Optional[UUID] = None
    criteria: List[RubricCriteriaCreate] = []