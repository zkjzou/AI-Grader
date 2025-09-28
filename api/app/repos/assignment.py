from typing import List, Optional
from sqlmodel import Session, select
from app.models.assignment import Assignment

class AssignmentRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, assignment: Assignment) -> Assignment:
        self.session.add(assignment)
        self.session.commit()
        self.session.refresh(assignment)
        return assignment

    def get(self, assignment_id: str) -> Optional[Assignment]:
        return self.session.get(Assignment, assignment_id)

    def get_by_course(self, course_id: str, skip: int = 0, limit: int = 100) -> List[Assignment]:
        statement = select(Assignment).where(Assignment.course_id == course_id).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Assignment]:
        statement = select(Assignment).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def update(self, db_assignment: Assignment, data: dict) -> Assignment:
        for key, value in data.items():
            setattr(db_assignment, key, value)
        self.session.add(db_assignment)
        self.session.commit()
        self.session.refresh(db_assignment)
        return db_assignment

    def delete(self, assignment_id: str) -> bool:
        db_assignment = self.get(assignment_id)
        if not db_assignment:
            return False
        self.session.delete(db_assignment)
        self.session.commit()
        return True
