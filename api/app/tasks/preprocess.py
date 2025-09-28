from uuid import UUID
from app.agents.llm_grading import preprocess, score_rubric_to_repo_rubric
from app.db import engine
from app.repos.assignment import AssignmentRepo
from app.repos.rubric import RubricRepo
from sqlmodel import Session

def preprocess_assignment(assignment_id: UUID) -> None:
    with Session(engine) as db:
        repo = AssignmentRepo(db)
        assignment = repo.get(assignment_id)
        if not assignment or not assignment.rubric_url:
            return
        try:
            score_rubric = preprocess(
                problems_pdf_path=assignment.rubric_url,
                optional_solution_or_rubric_text=None,
            )
            # Persist as normalized tables
            rubric_repo = RubricRepo(db)
            repo_rubric = score_rubric_to_repo_rubric(assignment.id, score_rubric)
            rubric_repo.create(repo_rubric)
        except Exception:
            # Swallow exceptions in background to avoid failing the request path
            return