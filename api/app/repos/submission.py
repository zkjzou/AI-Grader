from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlmodel import Session
from app.models.submission import Submission
from app.models.submission_score import SubmissionScore
from app.schema.submission import SubmissionCreate, SubmissionUpdate, SubmissionScoreCreate

class SubmissionRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, submission_data: SubmissionCreate) -> Submission:
        db_submission = Submission(
            assignment_id=submission_data.assignment_id,
            submission_url=submission_data.submission_url,
            graded_at=submission_data.graded_at,
            total_score=submission_data.total_score
        )
        self.session.add(db_submission)
        self.session.commit()
        self.session.refresh(db_submission)

        for score_data in submission_data.scores or []:
            db_score = SubmissionScore(
                submission_id=db_submission.id,
                criterion_id=score_data.criterion_id,
                score=score_data.score,
                reasoning=score_data.reasoning,
                human_override=score_data.human_override
            )
            self.session.add(db_score)
        self.session.commit()
        self.session.refresh(db_submission)
        return db_submission

    def get(self, submission_id: UUID) -> Optional[Submission]:
        return self.session.get(Submission, submission_id)

    def update(self, db_submission: Submission, update_data: SubmissionUpdate) -> Submission:
        # Update submission fields
        for field in ["submission_url", "graded_at", "total_score"]:
            value = getattr(update_data, field, None)
            if value is not None:
                setattr(db_submission, field, value)

        # Handle nested scores
        if update_data.scores:
            # Delete old scores
            for score in db_submission.scores:
                self.session.delete(score)
            self.session.commit()

            # Add new scores
            for score_data in update_data.scores:
                db_score = SubmissionScore(
                    submission_id=db_submission.id,
                    criterion_id=score_data.criterion_id,
                    score=score_data.score,
                    reasoning=score_data.reasoning,
                    human_override=score_data.human_override
                )
                self.session.add(db_score)

        self.session.commit()
        self.session.refresh(db_submission)
        return db_submission

    def get_by_assignment(self, assignment_id: UUID, skip: int = 0, limit: int = 100) -> List[Submission]:
        return self.session.query(Submission).filter(Submission.assignment_id == assignment_id).offset(skip).limit(limit).all()

    def delete(self, submission_id: UUID) -> bool:
        db_submission = self.get(submission_id)
        if not db_submission:
            return False
        self.session.delete(db_submission)
        self.session.commit()
        return True

    def grade_submission(self, submission_id: UUID, total_score: float) -> Optional[Submission]:
        db_submission = self.get(submission_id)
        if not db_submission:
            return None
        db_submission.total_score = total_score
        db_submission.graded_at = datetime.utcnow()
        self.session.commit()
        self.session.refresh(db_submission)
        return db_submission
