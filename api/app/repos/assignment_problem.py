from typing import List
from uuid import UUID
from sqlmodel import Session, select
from app.models.assignment_problem import AssignmentProblem

class AssignmentProblemRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, problem: AssignmentProblem) -> AssignmentProblem:
        self.session.add(problem)
        self.session.commit()
        self.session.refresh(problem)
        return problem

    def get(self, problem_id: UUID) -> AssignmentProblem | None:
        return self.session.get(AssignmentProblem, problem_id)

    def list_by_assignment(self, assignment_id: UUID) -> List[AssignmentProblem]:
        statement = select(AssignmentProblem).where(AssignmentProblem.assignment_id == assignment_id)
        return self.session.exec(statement).all()

    def update(self, problem: AssignmentProblem) -> AssignmentProblem:
        self.session.add(problem)
        self.session.commit()
        self.session.refresh(problem)
        return problem

    def delete(self, problem: AssignmentProblem) -> None:
        self.session.delete(problem)
        self.session.commit()
