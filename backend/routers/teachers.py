from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from typing import List

from database import get_db
from models import Teacher, DeviceAssignment
from schemas import TeacherCreate, TeacherOut

router = APIRouter(prefix="/api/teachers", tags=["teachers"])


@router.post("/import-json", status_code=201)
def import_teachers_json(rows: List[TeacherCreate], db: Session = Depends(get_db)):
    from sqlalchemy.exc import IntegrityError
    count = 0
    for row in rows:
        if db.get(Teacher, row.email):
            continue
        try:
            db.add(Teacher(**row.model_dump()))
            db.flush()
            count += 1
        except IntegrityError:
            db.rollback()
    db.commit()
    return {"imported": count}


@router.get("/subject-groups", response_model=list[str])
def list_subject_groups(db: Session = Depends(get_db)):
    rows = db.execute(select(Teacher.subject_group).distinct().order_by(Teacher.subject_group)).scalars().all()
    return list(rows)


@router.get("", response_model=list[TeacherOut])
def list_teachers(
    subject_group: str | None = None,
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(Teacher).options(selectinload(Teacher.assignment))
    if subject_group:
        stmt = stmt.where(Teacher.subject_group == subject_group)
    if q:
        stmt = stmt.outerjoin(DeviceAssignment, DeviceAssignment.teacher_email == Teacher.email).where(
            Teacher.name.contains(q) | Teacher.email.contains(q) | DeviceAssignment.serial_number.contains(q)
        )
    teachers = db.scalars(stmt).all()

    if status:
        teachers = [
            t for t in teachers
            if (t.assignment and t.assignment.status == status) or (status == "pending" and not t.assignment)
        ]
    return teachers


@router.post("", response_model=TeacherOut, status_code=201)
def create_teacher(body: TeacherCreate, db: Session = Depends(get_db)):
    if db.get(Teacher, body.email):
        raise HTTPException(409, "Email already exists")
    teacher = Teacher(**body.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.get("/{email}", response_model=TeacherOut)
def get_teacher(email: str, db: Session = Depends(get_db)):
    t = db.get(Teacher, email)
    if not t:
        raise HTTPException(404, "Teacher not found")
    return t


@router.delete("/{email}", status_code=204)
def delete_teacher(email: str, db: Session = Depends(get_db)):
    t = db.get(Teacher, email)
    if not t:
        raise HTTPException(404, "Teacher not found")
    db.delete(t)
    db.commit()
