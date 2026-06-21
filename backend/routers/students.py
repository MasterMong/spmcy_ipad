from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, distinct
import csv, io
from typing import List

from database import get_db
from models import Student, DeviceAssignment
from schemas import StudentOut, StudentBase, ClassroomItem

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/classrooms", response_model=list[ClassroomItem])
def list_classrooms(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Student.grade, Student.class_room).distinct().order_by(Student.grade, Student.class_room)
    ).all()
    return [{"grade": r.grade, "class_room": r.class_room} for r in rows]


@router.post("/import-json", status_code=201)
def import_students_json(rows: List[StudentBase], db: Session = Depends(get_db)):
    count = 0
    for row in rows:
        if not db.get(Student, row.student_id):
            db.add(Student(**row.model_dump()))
            count += 1
    db.commit()
    return {"imported": count}


@router.get("", response_model=list[StudentOut])
def list_students(
    grade: int | None = None,
    class_room: str | None = None,
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Student).options(selectinload(Student.assignment))
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
