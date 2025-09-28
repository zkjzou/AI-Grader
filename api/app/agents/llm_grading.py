import os
import json
import time
import re
from typing import Dict, Any, Optional, List

# External deps
from google import genai  # requires GEMINI_API_KEY or GOOGLE_API_KEY in env
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage


def _ensure_api_key() -> None:
    """Raise a helpful error if the Gemini key is missing."""
    if not (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")):
        raise RuntimeError(
            "Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable."
        )


def _load_prompts() -> Dict[str, str]:
    """Load prompt strings by importing directly from `prompts` module."""
    from .prompts import (
        PREPROCESSING_SYSTEM_PROMPT,
        PREPROCESSING_USER_PROMPT,
        PROBLEM_EXTRACTION_SYSTEM_PROMPT,
        PROBLEM_EXTRACTION_USER_PROMPT,
        GRADING_SYSTEM_PROMPT,
        GRADING_USER_PROMPT,
    )

    return {
        "PREPROCESSING_SYSTEM_PROMPT": PREPROCESSING_SYSTEM_PROMPT,
        "PREPROCESSING_USER_PROMPT": PREPROCESSING_USER_PROMPT,
        "PROBLEM_EXTRACTION_SYSTEM_PROMPT": PROBLEM_EXTRACTION_SYSTEM_PROMPT,
        "PROBLEM_EXTRACTION_USER_PROMPT": PROBLEM_EXTRACTION_USER_PROMPT,
        "GRADING_SYSTEM_PROMPT": GRADING_SYSTEM_PROMPT,
        "GRADING_USER_PROMPT": GRADING_USER_PROMPT,
    }


def _detect_mime_type(path: str) -> str:
    ext = os.path.splitext(path.lower())[1]
    if ext == ".pdf":
        return "application/pdf"
    return "application/octet-stream"


def _upload_file(client: genai.Client, file_path: str, *, mime_type: Optional[str] = None, timeout_s: int = 120) -> Any:
    """Return an existing Google file if present; otherwise upload and wait until ACTIVE.

    Matching is attempted by resource name 'files/<basename>'. If found and PROCESSING,
    this function polls until ACTIVE (or timeout). If not found, it uploads with the
    basename as the server-side name and then polls until ACTIVE.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    desired_name = os.path.basename(file_path).split(".")[0]
    expected_resource_name = f"files/{desired_name}"

    # Try to reuse an existing file by name
    existing = None
    try:
        existing = client.files.get(name=expected_resource_name)
    except Exception:
        existing = None

    target = existing
    if target is None:
        inferred_mime = mime_type or _detect_mime_type(file_path)
        with open(file_path, "rb") as f:
            target = client.files.upload(
                file=f,
                config={"mime_type": inferred_mime, "name": desired_name},
            )

    # Poll until ACTIVE if the API exposes a state
    start = time.time()
    current = target
    while getattr(current, "state", None) and getattr(current.state, "name", None) == "PROCESSING":
        if time.time() - start > timeout_s:
            raise TimeoutError(f"Timed out waiting for file to process: {file_path}")
        time.sleep(2)
        current = client.files.get(name=current.name)
    return current


def _init_llm_json() -> ChatGoogleGenerativeAI:
    """Chat model configured to return JSON directly."""
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        model_kwargs={
            "generation_config": {
                "response_mime_type": "application/json",
                "thinkingConfig": {"thinkingBudget": 0},
            }
        },
    )


def _parse_json_output(content: str) -> Any:
    """Parse model content into JSON, handling potential code fences."""
    try:
        return json.loads(content)
    except Exception:
        pass
    m = re.search(r"```json\s*\n([\s\S]*?)\n```", content)
    if m:
        return json.loads(m.group(1))
    # Sometimes models wrap as bare fenced block without language
    m2 = re.search(r"```\s*\n([\s\S]*?)\n```", content)
    if m2:
        return json.loads(m2.group(1))
    raise ValueError("Model did not return valid JSON content")


from typing import Any, Dict, List


def rubric_to_problem_structure(score_rubric: List[Dict[str, Any]]) -> Dict[str, Any]:
    structure: List[Dict[str, Any]] = []

    for problem in score_rubric or []:
        if not isinstance(problem, dict):
            continue

        problem_entry: Dict[str, Any] = {}

        if "id" in problem:
            problem_entry["id"] = problem["id"]
        if "name" in problem:
            problem_entry["name"] = problem["name"]

        if "description" in problem:
            problem_entry["description"] = problem["description"]

        items = problem.get("items")
        if isinstance(items, list):
            minimized_items: List[Dict[str, Any]] = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                item_entry: Dict[str, Any] = {}
                if "id" in item:
                    item_entry["id"] = item["id"]
                if "description" in item:
                    item_entry["description"] = item["description"]
                if item_entry:
                    minimized_items.append(item_entry)
            if minimized_items:
                problem_entry["items"] = minimized_items

        if problem_entry:
            structure.append(problem_entry)

    return structure



def preprocess(
    problems_pdf_path: str,
    *,
    optional_solution_or_rubric_text: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a rubric JSON using PREPROCESSING prompts.

    Inputs:
      - problems_pdf_path: required PDF containing the assignment problems.
      - empty_assignment_pdf_path: required PDF template (blank assignment); used as extra context.
      - optional_second_pdf_path: optional additional PDF (e.g., instructor notes).
      - optional_solution_or_rubric_text: optional text containing solution keys or rubric hints.

    Returns: dict parsed from model JSON output representing the scoring rubric.
    """
    _ensure_api_key()
    prompts = _load_prompts()
    client = genai.Client()

    # Upload available files
    uploads: List[Any] = []
    uploads.append(_upload_file(client, problems_pdf_path))

    llm = _init_llm_json()

    human_content: List[Dict[str, Any]] = [
        {"type": "text", "text": prompts["PREPROCESSING_USER_PROMPT"]},
    ]
    # Include optional rubric/solution hints if provided
    if optional_solution_or_rubric_text:
        human_content.append(
            {
                "type": "text",
                "text": f"Optional rubric/solutions provided by user:\n{optional_solution_or_rubric_text}",
            }
        )
    # Attach all uploaded PDFs as media
    for f in uploads:
        human_content.append({"type": "media", "file_uri": f.uri, "mime_type": "application/pdf"})

    messages = [
        SystemMessage(content=prompts["PREPROCESSING_SYSTEM_PROMPT"]),
        HumanMessage(content=human_content),
    ]

    response = llm.invoke(messages)
        # todo write update call

    return _parse_json_output(response.content)


def extract_submission(
    submission_pdf_path: str,
    problem_structure: Dict[str, Any],
) -> str:
    """Extract a structured markdown of the student's solutions using the provided problem structure.

    Inputs:
      - submission_pdf_path: the student's submission PDF.
      - problem_structure: dict with problem and subproblem text descriptions.

    Returns: markdown string summarizing the student's submission by problem.
    """
    _ensure_api_key()
    prompts = _load_prompts()
    client = genai.Client()
    submission = _upload_file(client, submission_pdf_path)

    llm = _init_llm_json()

    # For extraction we want markdown, not JSON. Use a separate lightweight model configured for text.
    # However we can keep the same client but override MIME type expectations by instantiating a fresh model.
    llm_md = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", model_kwargs={"generation_config": {"thinkingConfig": {"thinkingBudget": 0}}})

    messages = [
        SystemMessage(content=prompts["PROBLEM_EXTRACTION_SYSTEM_PROMPT"]),
        HumanMessage(
            content=[
                {"type": "text", "text": prompts["PROBLEM_EXTRACTION_USER_PROMPT"]},
                {"type": "text", "text": json.dumps({"problem_structure": problem_structure})},
                {"type": "media", "file_uri": submission.uri, "mime_type": "application/pdf"},
            ]
        ),
    ]

    response = llm_md.invoke(messages)
    return response.content


def grade_submission(
    rubric: Dict[str, Any],
    student_markdown: str,
    submission_pdf_path: str,
) -> Dict[str, Any]:
    """Grade the submission using rubric JSON, extracted markdown, and the PDF.

    Inputs:
      - rubric: dict representing the scoring rubric (from preprocess)
      - student_markdown: markdown string of student's extracted answers (from extract_submission)
      - submission_pdf_path: path to the student's original PDF (as additional grounding)

    Returns: dict parsed from model JSON output containing detailed grades.
    """
    _ensure_api_key()
    prompts = _load_prompts()
    client = genai.Client()
    submission = _upload_file(client, submission_pdf_path)

    llm = _init_llm_json()

    rubric_json_str = json.dumps(rubric)
    user_text = prompts["GRADING_USER_PROMPT"]

    # Try to inject rubric and markdown if placeholders are present; otherwise append them.
    replaced = False
    if "<PASTE THE RUBRIC JSON" in user_text:
        user_text = user_text.replace(
            "<PASTE THE RUBRIC JSON EXACTLY — include which items belong to 1a/1b/1c, with point values>",
            rubric_json_str,
        )
        replaced = True
    if "{}" in user_text:
        user_text = user_text.replace("{}", student_markdown)
        replaced = True
    if not replaced:
        user_text = (
            f"{user_text}\n\nRubric JSON (verbatim):\n```json\n{rubric_json_str}\n```\n\n"
            f"Student solutions (markdown):\n{student_markdown}"
        )

    messages = [
        SystemMessage(content=prompts["GRADING_SYSTEM_PROMPT"]),
        HumanMessage(
            content=[
                {"type": "text", "text": user_text},
                {"type": "media", "file_uri": submission.uri, "mime_type": _detect_mime_type(str(submission_pdf_path))},
            ]
        ),
    ]

    response = llm.invoke(messages)
    return _parse_json_output(response.content)


__all__ = [
    "preprocess",
    "extract_submission",
    "grade_submission",
    "rubric_to_problem_structure",
]


