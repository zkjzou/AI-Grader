from fastapi import FastAPI
from .routers import assignments, submissions

app = FastAPI(
    title="AI Assignment Grader",
    description="AI assignment grading",
    version="0.1.0",
)

app.include_router(assignments.router)
app.include_router(submissions.router)

@app.get("/")
async def root():
    return {"message": "AI Assignment Grader API is running!"}
