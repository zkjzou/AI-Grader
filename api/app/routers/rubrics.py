from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
from uuid import UUID

from app.models.rubric import Rubric
from app.models.rubric_criteria import RubricCriteria
from app.models.rubric_level import RubricLevel
from app.repos.rubric import RubricRepo
from app.schema.rubric import RubricRead, RubricUpdate
from app.db import get_session

router = APIRouter(prefix="/rubrics", tags=["rubrics"])

@router.post("/", response_model=Rubric, status_code=status.HTTP_201_CREATED)
def create_rubric(rubric_payload: dict, session: Session = Depends(get_session)):
    repo = RubricRepo(session)
    db_rubric = Rubric(assignment_id=UUID(rubric_payload["assignment_id"]))

    for crit_data in rubric_payload.get("criteria", []):
        db_criterion = RubricCriteria(
            rubric_id=db_rubric.id,
            name=crit_data["name"],
            description=crit_data.get("description"),
            max_score=crit_data.get("max_score", 0),
            order_index=crit_data.get("order_index", 0)
        )

        for lvl_data in crit_data.get("levels", []):
            db_level = RubricLevel(
                label=lvl_data["label"],
                score=lvl_data["score"],
                description=lvl_data.get("description")
            )
            db_criterion.levels.append(db_level)

        db_rubric.criteria.append(db_criterion)

    return repo.create(db_rubric)

@router.get("/by_assignment/{assignment_id}", response_model=RubricRead)
def get_rubric_by_assignment(assignment_id: UUID, session: Session = Depends(get_session)):
    repo = RubricRepo(session)
    course = repo.get_by_assignment(assignment_id)
    if not course:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return course

@router.put("/{rubric_id}", response_model=RubricRead)
def update_rubric(rubric_id: UUID, rubric: RubricUpdate, session: Session = Depends(get_session)):
    repo = RubricRepo(session)
    updated = repo.update(rubric_id, rubric)
    if not updated:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return updated