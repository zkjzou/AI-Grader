from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.models.rubric import Rubric
from app.models.rubric_criteria import RubricCriteria
from app.models.rubric_level import RubricLevel

class RubricRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, rubric: Rubric) -> Rubric:
        db_rubric = Rubric(assignment_id=rubric.assignment_id)
        self.session.add(db_rubric)
        self.session.commit()
        self.session.refresh(db_rubric)

        for criterion_data in getattr(rubric, "criteria", []):
            db_criterion = RubricCriteria(
                rubric_id=db_rubric.id,
                name=criterion_data.name,
                description=criterion_data.description,
                max_score=criterion_data.max_score,
                order_index=criterion_data.order_index
            )
            self.session.add(db_criterion)
            self.session.commit()
            self.session.refresh(db_criterion)

            for level_data in getattr(criterion_data, "levels", []):
                db_level = RubricLevel(
                    criterion_id=db_criterion.id,
                    label=level_data.label,
                    score=level_data.score,
                    description=level_data.description
                )
                self.session.add(db_level)

        self.session.commit()
        self.session.refresh(db_rubric)
        return db_rubric

    def get(self, rubric_id: UUID) -> Optional[Rubric]:
        statement = select(Rubric).where(Rubric.id == rubric_id).options(
            selectinload(Rubric.criteria).selectinload(RubricCriteria.levels)
        )
        return self.session.exec(statement).first()

    def get_by_assignment(self, assignment_id: UUID) -> Optional[Rubric]:
        statement = select(Rubric).where(Rubric.assignment_id == assignment_id).options(
            selectinload(Rubric.criteria).selectinload(RubricCriteria.levels)
        )
        return self.session.exec(statement).first()

    def update(self, rubric_id: UUID, rubric_data) -> Optional[Rubric]:
        db_rubric = self.session.get(Rubric, rubric_id)
        if not db_rubric:
            return None

        for field in ["assignment_id"]:
            if hasattr(rubric_data, field):
                setattr(db_rubric, field, getattr(rubric_data, field))

        if getattr(rubric_data, "criteria", None):
            for c in db_rubric.criteria:
                for l in c.levels:
                    self.session.delete(l)
                self.session.delete(c)
            self.session.commit()

            for criterion_data in rubric_data.criteria:
                db_criterion = RubricCriteria(
                    rubric_id=db_rubric.id,
                    name=criterion_data.name,
                    description=criterion_data.description,
                    max_score=criterion_data.max_score,
                    order_index=criterion_data.order_index
                )
                self.session.add(db_criterion)
                self.session.commit()
                self.session.refresh(db_criterion)

                for level_data in getattr(criterion_data, "levels", []):
                    db_level = RubricLevel(
                        criterion_id=db_criterion.id,
                        label=level_data.label,
                        score=level_data.score,
                        description=level_data.description
                    )
                    self.session.add(db_level)

        self.session.commit()
        self.session.refresh(db_rubric)
        return db_rubric

    def delete(self, rubric_id: UUID) -> bool:
        db_rubric = self.get(rubric_id)
        if not db_rubric:
            return False

        self.session.delete(db_rubric)
        self.session.commit()
        return True
