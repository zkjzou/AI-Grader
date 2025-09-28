from fastapi import APIRouter, UploadFile, File, BackgroundTasks, status
from starlette.responses import JSONResponse as JsonResponse
from pathlib import Path
import random
import shutil
from typing import Optional
from app.agents.llm_grading import preprocess, rubric_to_problem_structure

router = APIRouter(prefix="/assignments", tags=["assignments"])

UPLOAD_DIR = Path("uploads/assignments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory store for assignments
assignments = {}

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
    file: UploadFile = File(...)
):
    file_id = str(random.randint(1, 999))
    saved_path = UPLOAD_DIR / f"{file_id}-{file.filename}"
    
    with saved_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Store basic assignment info first
    assignments[file_id] = {
        "id": file_id,
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
