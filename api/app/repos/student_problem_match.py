from typing import List
from uuid import UUID
from sqlmodel import Session, select
from app.models.student_problem_match import StudentProblemMatch

class StudentProblemMatchRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, match: StudentProblemMatch) -> StudentProblemMatch:
        self.session.add(match)
        self.session.commit()
        self.session.refresh(match)
        return match

    def get(self, match_id: UUID) -> StudentProblemMatch | None:
        return self.session.get(StudentProblemMatch, match_id)

    def list_by_submission(self, submission_id: UUID) -> List[StudentProblemMatch]:
        statement = select(StudentProblemMatch).where(StudentProblemMatch.submission_id == submission_id)
        return self.session.exec(statement).all()

    def list_by_problem(self, problem_id: UUID) -> List[StudentProblemMatch]:
        statement = select(StudentProblemMatch).where(StudentProblemMatch.problem_id == problem_id)
        return self.session.exec(statement).all()

    def update(self, match: StudentProblemMatch) -> StudentProblemMatch:
        self.session.add(match)
        self.session.commit()
        self.session.refresh(match)
        return match

    def delete(self, match: StudentProblemMatch) -> None:
        self.session.delete(match)
        self.session.commit()
