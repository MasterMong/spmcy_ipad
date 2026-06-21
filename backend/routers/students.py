from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
import csv, io

from database import get_db
from models import Student, DeviceAssignment
from schemas import StudentOut

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(
    grade: int | None = None,
    class_room: str | None = None,
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Student)
    if grade:
        stmt = stmt.where(Student.grade == grade)
    if class_room:
        stmt = stmt.where(Student.class_room == class_room)
    if q:
        stmt = stmt.where(Student.name.contains(q) | Student.student_id.contains(q))
    students = db.scalars(stmt).all()

    if status:
        students = [
            s for s in students
            if (s.assignment and s.assignment.status == status) or (status == "pending" and not s.assignment)
        ]
    return students


@router.post("/import", status_code=201)
async def import_students(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    count = 0
    for row in reader:
        existing = db.get(Student, row["student_id"])
        if not existing:
            db.add(Student(
                student_id=row["student_id"],
                name=row["name"],
                national_id=row["national_id"],
                grade=int(row["grade"]),
                class_room=row["class_room"],
            ))
            count += 1
    db.commit()
    return {"imported": count}


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: str, db: Session = Depends(get_db)):
    s = db.get(Student, student_id)
    if not s:
        raise HTTPException(404, "Student not found")
    return s


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    s = db.get(Student, student_id)
    if not s:
        raise HTTPException(404, "Student not found")
    db.delete(s)
    db.commit()
