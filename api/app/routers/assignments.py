from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session
from typing import List
from uuid import UUID

from app.models.assignment import Assignment
from app.repos.assignment import AssignmentRepo
from app.db import get_session

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("/", response_model=Assignment, status_code=status.HTTP_201_CREATED)
def create_assignment(assignment: Assignment, background_tasks: BackgroundTasks, session: Session = Depends(get_session),):
    assignment.course_id = UUID(assignment.course_id)
    repo = AssignmentRepo(session)
    rec = repo.create(assignment)
    # TODO background_tasks.add_task(preprocess_assignment, rec.id)
    return rec


@router.get("/by_course/{course_id}", response_model=List[Assignment])
def list_assignments_by_course(course_id: UUID, session: Session = Depends(get_session)):
    repo = AssignmentRepo(session)
    return repo.get_by_course(course_id)


@router.get("/{assignment_id}", response_model=Assignment)
def get_assignment(assignment_id: UUID, session: Session = Depends(get_session)):
    repo = AssignmentRepo(session)
    assignment = repo.get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


@router.put("/{assignment_id}", response_model=Assignment)
def update_assignment(assignment_id: UUID, updated_assignment: Assignment, session: Session = Depends(get_session)):
    repo = AssignmentRepo(session)
    assignment = repo.get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.title = updated_assignment.title
    assignment.description = updated_assignment.description
    assignment.rubric_url = updated_assignment.rubric_url
    assignment.solution_key_url = updated_assignment.solution_key_url
    
    return repo.update(assignment)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: UUID, session: Session = Depends(get_session)):
    repo = AssignmentRepo(session)
    assignment = repo.get(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    repo.delete(assignment)
    return None
