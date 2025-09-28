from typing import List
from uuid import UUID
from sqlmodel import Session, select
from app.models.rubric_level import RubricLevel

class RubricLevelRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, level: RubricLevel) -> RubricLevel:
        self.session.add(level)
        self.session.commit()
        self.session.refresh(level)
        return level

    def get(self, level_id: UUID) -> RubricLevel | None:
        return self.session.get(RubricLevel, level_id)

    def list_by_criterion(self, criterion_id: UUID) -> List[RubricLevel]:
        statement = select(RubricLevel).where(RubricLevel.criterion_id == criterion_id)
        return self.session.exec(statement).all()

    def update(self, level: RubricLevel) -> RubricLevel:
        self.session.add(level)
        self.session.commit()
        self.session.refresh(level)
        return level

    def delete(self, level: RubricLevel) -> None:
        self.session.delete(level)
        self.session.commit()
