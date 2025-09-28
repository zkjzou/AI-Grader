from typing import List
from uuid import UUID
from sqlmodel import Session, select
from app.models.submission_score import SubmissionScore

class SubmissionScoreRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, score: SubmissionScore) -> SubmissionScore:
        self.session.add(score)
        self.session.commit()
        self.session.refresh(score)
        return score

    def get(self, score_id: UUID) -> SubmissionScore | None:
        return self.session.get(SubmissionScore, score_id)

    def list_by_submission(self, submission_id: UUID) -> List[SubmissionScore]:
        statement = select(SubmissionScore).where(SubmissionScore.submission_id == submission_id)
        return self.session.exec(statement).all()

    def update(self, score: SubmissionScore) -> SubmissionScore:
        self.session.add(score)
        self.session.commit()
        self.session.refresh(score)
        return score

    def delete(self, score: SubmissionScore) -> None:
        self.session.delete(score)
        self.session.commit()
