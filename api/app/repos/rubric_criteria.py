from typing import List
from uuid import UUID
from sqlmodel import Session, select
from app.models.rubric_criteria import RubricCriteria

class RubricCriteriaRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, criterion: RubricCriteria) -> RubricCriteria:
        self.session.add(criterion)
        self.session.commit()
        self.session.refresh(criterion)
        return criterion

    def get(self, criterion_id: UUID) -> RubricCriteria | None:
        return self.session.get(RubricCriteria, criterion_id)

    def list_by_rubric(self, rubric_id: UUID) -> List[RubricCriteria]:
        statement = select(RubricCriteria).where(RubricCriteria.rubric_id == rubric_id)
        return self.session.exec(statement).all()

    def update(self, criterion: RubricCriteria) -> RubricCriteria:
        self.session.add(criterion)
        self.session.commit()
        self.session.refresh(criterion)
        return criterion

    def delete(self, criterion: RubricCriteria) -> None:
        self.session.delete(criterion)
        self.session.commit()
