from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.repos.submission import SubmissionRepo
from app.db import get_session

from app.schema.submission import SubmissionRead, SubmissionCreate, SubmissionUpdate

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/", response_model=SubmissionRead, status_code=status.HTTP_201_CREATED)
def create_submission(
    submission: SubmissionCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    repo = SubmissionRepo(session)
    rec = repo.create(submission)
    # TODO: background_tasks.add_task(grade_submission, rec.id)
    return rec


@router.get("/by_assignment/{assignment_id}", response_model=List[SubmissionRead])
def list_submissions_by_assignment(
    assignment_id: UUID, session: Session = Depends(get_session)
):
    repo = SubmissionRepo(session)
    return repo.get_by_assignment(assignment_id)


@router.get("/{submission_id}", response_model=SubmissionRead)
def get_submission(submission_id: UUID, session: Session = Depends(get_session)):
    repo = SubmissionRepo(session)
    submission = repo.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@router.put("/{submission_id}", response_model=SubmissionRead)
def update_submission(
    submission_id: UUID,
    updated_submission: SubmissionUpdate,
    session: Session = Depends(get_session),
):
    repo = SubmissionRepo(session)
    submission = repo.get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return repo.update(submission, updated_submission)
