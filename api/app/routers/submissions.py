from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import JSONResponse
import random
import shutil
import re
from pathlib import Path
from typing import Optional, Dict, Any
from .assignments import assignments
from app.agents.llm_grading import extract_submission, grade_submission

router = APIRouter(prefix="/submissions", tags=["submissions"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory store for submissions
submissions = {}

def _sanitize_filename(filename: str) -> str:
    """Sanitize filename to be safe for filesystem and API usage."""
    # Remove or replace problematic characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '-', filename)
    # Remove multiple consecutive dashes
    sanitized = re.sub(r'-+', '-', sanitized)
    # Remove leading and trailing dashes
    sanitized = sanitized.strip('-')
    # Ensure it's not empty
    if not sanitized:
        sanitized = "file"
    return sanitized

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
    student_name: str = Form(...),
):
    submission_id = str(random.randint(1, 999))

    assignment = assignments.get(assignment_id)
    if not assignment:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Assignment not found"}
        )

    sanitized_filename = _sanitize_filename(file.filename)
    submission_path = UPLOAD_DIR / f"{submission_id}-{sanitized_filename}"
    with submission_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store basic submission info in dict
    submissions[submission_id] = {
        "id": submission_id,
        "assignment_id": assignment_id,
        "student_name": student_name,
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

@router.get("/", status_code=status.HTTP_200_OK)
def list_submissions():
    """List all submissions with their basic info."""
    submission_list = []
    for submission_id, submission in submissions.items():
        submission_list.append({
            "id": submission_id,
            "assignment_id": submission.get("assignment_id", ""),
            "student_name": submission.get("student_name", f"Student {submission_id}"),
            "file_path": submission.get("file_path", ""),
            "graded_content": submission.get("graded_content"),
        })
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"submissions": submission_list}
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


@router.put("/{submission_id}", status_code=status.HTTP_200_OK)
def update_submission(submission_id: str, payload: Dict[str, Any]):
    """Update a submission's fields (e.g., graded_content).

    Expects a JSON body containing fields to update. For now we allow
    updating `graded_content` and `student_name` and `file_path` if provided.
    """
    submission = submissions.get(submission_id)
    if not submission:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Submission not found"}
        )

    # Only update allowed fields to avoid unexpected changes
    allowed_fields = {"graded_content", "student_name", "file_path"}
    for key, value in payload.items():
        if key in allowed_fields:
            submission[key] = value

    submissions[submission_id] = submission

    return JSONResponse(status_code=status.HTTP_200_OK, content=submission)
