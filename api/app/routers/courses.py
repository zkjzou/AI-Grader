from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
from uuid import UUID

from app.models.course import Course
from app.repos.course import CourseRepo
from app.db import get_session

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/", response_model=Course, status_code=status.HTTP_201_CREATED)
def create_course(course: Course, session: Session = Depends(get_session)):
    repo = CourseRepo(session)
    return repo.create(course)


@router.get("/", response_model=List[Course])
def list_courses(session: Session = Depends(get_session)):
    repo = CourseRepo(session)
    return repo.get_all()


@router.get("/{course_id}", response_model=Course)
def get_course(course_id: UUID, session: Session = Depends(get_session)):
    repo = CourseRepo(session)
    course = repo.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.put("/{course_id}", response_model=Course)
def update_course(course_id: UUID, updated_course: Course, session: Session = Depends(get_session)):
    repo = CourseRepo(session)
    course = repo.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.name = updated_course.name
    course.code = updated_course.code
    course.description = updated_course.description
    return repo.update(course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: UUID, session: Session = Depends(get_session)):
    repo = CourseRepo(session)
    course = repo.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    repo.delete(course)
    return None
