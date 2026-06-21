from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from database import get_db
from models import Student, Teacher, DeviceAssignment
from schemas import StudentOut, TeacherOut

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/class/{grade}/{class_room}")
def report_class(grade: int, class_room: str, format: str = "preview", db: Session = Depends(get_db)):
    students = db.scalars(
        select(Student).where(Student.grade == grade, Student.class_room == class_room)
    ).all()
    if format == "pdf":
        # TODO: generate PDF with reportlab or weasyprint
        raise HTTPException(501, "PDF generation not yet implemented — use format=preview")
    return [
        {
            "student_id": s.student_id,
            "name": s.name,
            "grade": s.grade,
            "class_room": s.class_room,
            "serial_number": s.assignment.serial_number if s.assignment else None,
            "status": s.assignment.status if s.assignment else "pending",
        }
        for s in students
    ]


@router.get("/subject/{subject_group}")
def report_subject(subject_group: str, format: str = "preview", db: Session = Depends(get_db)):
    teachers = db.scalars(
        select(Teacher).where(Teacher.subject_group == subject_group)
    ).all()
    if format == "pdf":
        raise HTTPException(501, "PDF generation not yet implemented — use format=preview")
    return [
        {
            "email": t.email,
            "name": t.name,
            "subject_group": t.subject_group,
            "serial_number": t.assignment.serial_number if t.assignment else None,
            "status": t.assignment.status if t.assignment else "pending",
        }
        for t in teachers
    ]
