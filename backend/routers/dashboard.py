import asyncio, json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from database import get_db
from models import Student, Teacher, DeviceAssignment
from schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)):
    total_students = db.scalar(func.count(Student.student_id)) or 0
    total_teachers = db.scalar(func.count(Teacher.email)) or 0

    def count_assignments(assignee_type: str, status: str) -> int:
        return db.scalar(
            select(func.count(DeviceAssignment.id))
            .where(DeviceAssignment.assignee_type == assignee_type)
            .where(DeviceAssignment.status == status)
        ) or 0

    assigned_student_ids = db.scalar(
        select(func.count(DeviceAssignment.student_id))
        .where(DeviceAssignment.assignee_type == "student")
    ) or 0
    assigned_teacher_emails = db.scalar(
        select(func.count(DeviceAssignment.teacher_email))
        .where(DeviceAssignment.assignee_type == "teacher")
    ) or 0

    return DashboardSummary(
        total_students=total_students,
        total_teachers=total_teachers,
        assigned_students=count_assignments("student", "assigned"),
        delivered_students=count_assignments("student", "delivered"),
        returned_students=count_assignments("student", "returned"),
        pending_students=total_students - assigned_student_ids,
        assigned_teachers=count_assignments("teacher", "assigned"),
        delivered_teachers=count_assignments("teacher", "delivered"),
        returned_teachers=count_assignments("teacher", "returned"),
        pending_teachers=total_teachers - assigned_teacher_emails,
    )


@router.get("/stream")
async def stream_dashboard():
    async def event_generator():
        while True:
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            await asyncio.sleep(5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
