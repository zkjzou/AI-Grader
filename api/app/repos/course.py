from typing import List, Optional
from sqlmodel import Session, select
from app.models.course import Course

class CourseRepo:
    def __init__(self, session: Session):
        self.session = session

    def create(self, course: Course) -> Course:
        db_course = Course.model_validate(course)
        self.session.add(db_course)
        self.session.commit()
        self.session.refresh(db_course)
        return db_course

    def get(self, course_id: str) -> Optional[Course]:
        return self.session.get(Course, course_id)

    def get_by_code(self, code: str) -> Optional[Course]:
        statement = select(Course).where(Course.code == code)
        return self.session.exec(statement).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Course]:
        statement = select(Course).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def update(self, course_id: str, course: Course) -> Optional[Course]:
        db_course = self.get(course_id)
        if not db_course:
            return None

        course_data = course.model_dump(exclude_unset=True)
        db_course.sqlmodel_update(course_data)
        self.session.add(db_course)
        self.session.commit()
        self.session.refresh(db_course)
        return db_course

    def delete(self, course_id: str) -> bool:
        db_course = self.get(course_id)
        if not db_course:
            return False

        self.session.delete(db_course)
        self.session.commit()
        return True
