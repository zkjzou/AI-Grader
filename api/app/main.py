from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import assignments, submissions

app = FastAPI(
    title="AI Assignment Grader",
    description="AI assignment grading",
    version="0.1.0",
)

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(assignments.router)
app.include_router(submissions.router)

# Mount static files for serving uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "AI Assignment Grader API is running!"}
