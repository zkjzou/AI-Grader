from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import JSONResponse
import random
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from .assignments import assignments
from app.agents.llm_grading import extract_submission, grade_submission

router = APIRouter(prefix="/submissions", tags=["submissions"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory store for submissions
submissions = {}

def process_submission(submission_id: str, submission_path: Path, rubric: Dict[str, Any], problem_structure: Dict[str, Any]):
    """
    Extract and grade submission, store result in the submissions dict.
    """
    student_md = extract_submission(
        submission_pdf_path=str(submission_path),
        problem_structure=problem_structure
    )

    graded_content = grade_submission(
        rubric=rubric,
        student_markdown=student_md,
        submission_pdf_path=submission_path
    )

    # Update the in-memory submissions dictionary
    submissions[submission_id]["graded_content"] = graded_content

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_submission(
    background_tasks: BackgroundTasks,
    assignment_id: str = Form(...),
    file: UploadFile = File(...),
):
    submission_id = str(random.randint(1, 999))

    assignment = assignments.get(assignment_id)
    if not assignment:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Assignment not found"}
        )

    submission_path = UPLOAD_DIR / f"{submission_id}-{file.filename}"
    with submission_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store basic submission info in dict
    submissions[submission_id] = {
        "id": submission_id,
        "assignment_id": assignment_id,
        "file_path": str(submission_path),
        "graded_content": None  # Will be filled by background task
    }

    # Schedule grading in background
    background_tasks.add_task(
        process_submission,
        submission_id=submission_id,
        submission_path=submission_path,
        rubric=assignment.get("rubric", {}),
        problem_structure=assignment.get("problem_structure", {}),
    )

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"submission_id": submission_id, "message": "Submission received. Grading in progress."}
    )

@router.get("/{submission_id}", status_code=status.HTTP_200_OK)
def get_submission(submission_id: str):
    submission = submissions.get(submission_id)
    if not submission:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Submission not found"}
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=submission
    )
