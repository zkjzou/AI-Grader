from fastapi import APIRouter, UploadFile, File, BackgroundTasks, status, Form
from starlette.responses import JSONResponse as JsonResponse
from pathlib import Path
import random
import shutil
import re
from typing import Optional
from app.agents.llm_grading import preprocess, rubric_to_problem_structure

router = APIRouter(prefix="/assignments", tags=["assignments"])

UPLOAD_DIR = Path("uploads/assignments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory store for assignments
assignments = {}

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

def process_rubric(file_id: str, file_path: Path):
    """
    Preprocess the uploaded PDF and store the rubric in the assignments dict.
    """
    rubric_dict = preprocess(
        problems_pdf_path=str(file_path),
        optional_solution_or_rubric_text=None,
    )

    problem_structure = rubric_to_problem_structure(rubric_dict)

    assignments[file_id]["rubric"] = rubric_dict
    assignments[file_id]["problem_structure"] = problem_structure

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_rubric(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...)
):
    file_id = str(random.randint(1, 999))
    sanitized_filename = _sanitize_filename(file.filename)
    saved_path = UPLOAD_DIR / f"{file_id}-{sanitized_filename}"
    
    with saved_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store basic assignment info first
    assignments[file_id] = {
        "id": file_id,
        "name": name,
        "file_path": str(saved_path),
        "rubric": None,
        "problem_structure": None  # Will be filled by background task
    }

    # Schedule preprocessing in the background
    background_tasks.add_task(
        process_rubric,
        file_id=file_id,
        file_path=saved_path
    )

    return JsonResponse(
        status_code=status.HTTP_201_CREATED,
        content={"assignment_id": file_id, "message": "Rubric uploaded. Processing in background."}
    )

@router.get("/", status_code=status.HTTP_200_OK)
def list_assignments():
    """List all assignments with their basic info."""
    assignment_list = []
    for assignment_id, assignment in assignments.items():
        assignment_list.append({
            "id": assignment_id,
            "name": assignment.get("name", f"Assignment {assignment_id}"),
            "file_path": assignment.get("file_path", ""),
            "has_rubric": assignment.get("rubric") is not None,
            "has_problem_structure": assignment.get("problem_structure") is not None,
        })
    
    return JsonResponse(
        status_code=status.HTTP_200_OK,
        content={"assignments": assignment_list}
    )

@router.get("/{assignment_id}", status_code=status.HTTP_200_OK)
def get_rubric(assignment_id: str):
    assignment = assignments.get(assignment_id)
    if not assignment:
        return JsonResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"message": "Assignment not found"}
        )

    return JsonResponse(
        status_code=status.HTTP_200_OK,
        content=assignment
    )
