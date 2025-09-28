# AI Grader API - New Database Schema

This document describes the new API structure based on the provided database schema using SQLAlchemy ORM.

## Database Schema

The API now supports the following entities:

### Core Entities
- **Course**: Academic courses with name, code, and description
- **Assignment**: Assignments belonging to courses with title, description, and URLs
- **Rubric**: Grading rubrics for assignments with criteria and levels
- **Submission**: Student submissions for assignments
- **Assignment Problems**: Individual problems within assignments
- **Student Problem Matches**: AI-matched text segments for problems

### Relationships
- Course → Assignment (1:many)
- Assignment → Rubric (1:many)
- Assignment → Submission (1:many)
- Assignment → Assignment Problems (1:many)
- Rubric → Rubric Criteria (1:many)
- Rubric Criteria → Rubric Levels (1:many)
- Submission → Submission Scores (1:many)
- Submission → Student Problem Matches (1:many)

## API Endpoints

### Courses (`/courses`)
- `POST /` - Create a new course
- `GET /` - List all courses
- `GET /{course_id}` - Get course by ID
- `PUT /{course_id}` - Update course
- `DELETE /{course_id}` - Delete course

### Assignments (`/assignments`)
- `POST /` - Create a new assignment
- `GET /` - List all assignments
- `GET /course/{course_id}` - Get assignments by course
- `GET /{assignment_id}` - Get assignment by ID
- `PUT /{assignment_id}` - Update assignment
- `DELETE /{assignment_id}` - Delete assignment
- `POST /{assignment_id}/preprocess` - Start preprocessing
- `POST /{assignment_id}/grade` - Start grading

### Rubrics (`/rubrics`)
- `POST /` - Create a new rubric
- `GET /{rubric_id}` - Get rubric by ID
- `GET /assignment/{assignment_id}` - Get rubric by assignment
- `PUT /{rubric_id}` - Update rubric
- `DELETE /{rubric_id}` - Delete rubric

### Submissions (`/submissions`)
- `POST /` - Create a new submission
- `GET /` - List all submissions
- `GET /assignment/{assignment_id}` - Get submissions by assignment
- `GET /{submission_id}` - Get submission by ID
- `PUT /{submission_id}` - Update submission
- `POST /{submission_id}/grade` - Grade submission
- `DELETE /{submission_id}` - Delete submission

## Data Models

### Course
```python
{
    "id": "uuid",
    "name": "string",
    "code": "string", 
    "description": "string",
    "created_at": "datetime"
}
```

### Assignment
```python
{
    "id": "uuid",
    "course_id": "uuid",
    "title": "string",
    "description": "string",
    "rubric_url": "string",
    "solution_key_url": "string",
    "created_at": "datetime"
}
```

### Rubric with Criteria and Levels
```python
{
    "id": "uuid",
    "assignment_id": "uuid",
    "created_at": "datetime",
    "criteria": [
        {
            "id": "uuid",
            "name": "string",
            "description": "string",
            "max_score": "decimal",
            "order_index": "integer",
            "levels": [
                {
                    "id": "uuid",
                    "label": "string",
                    "score": "decimal",
                    "description": "string"
                }
            ]
        }
    ]
}
```

### Submission with Scores
```python
{
    "id": "uuid",
    "assignment_id": "uuid",
    "submission_url": "string",
    "graded_at": "datetime",
    "total_score": "decimal",
    "created_at": "datetime",
    "scores": [
        {
            "id": "uuid",
            "criterion_id": "uuid",
            "score": "decimal",
            "reasoning": "string",
            "human_override": "boolean"
        }
    ]
}
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd api
   uv sync
   ```

2. **Set Environment Variables**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost/ai_grader"
   ```

3. **Run Database Migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start the API**
   ```bash
   uvicorn app.main:app --reload
   ```

## Key Features

### AI Integration
- **Preprocessing**: Automatically extracts problems from assignments
- **Grading**: AI-powered scoring based on rubric criteria
- **Problem Matching**: Matches student text to specific problems

### Flexible Rubric System
- Multiple criteria per assignment
- Multiple levels per criterion
- Configurable scoring scales
- Human override capabilities

### Comprehensive Tracking
- Full audit trail of all operations
- Timestamp tracking for all entities
- Detailed scoring with reasoning
- Problem-level analysis

## Migration from Old API

The old API structure has been preserved in `app/schema.py` for backward compatibility. To migrate:

1. Update client code to use new endpoints
2. Replace old schema imports with new ones from `app/schemas/`
3. Update database connections to use the new models
4. Test all functionality with the new structure

## Development Notes

- All models use UUID primary keys
- Decimal precision is maintained for scores
- Relationships are properly configured with cascading deletes
- Background tasks are integrated for AI processing
- Comprehensive error handling and validation
