import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import DeliveryPhoto, DeviceAssignment, Student

router = APIRouter(prefix="/api/student-portal", tags=["student-portal"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class VerifyBody(BaseModel):
    student_id: str
    national_id: str


@router.post("/verify")
def verify_student(body: VerifyBody, db: Session = Depends(get_db)):
    student = db.get(Student, body.student_id)
    if not student or student.national_id != body.national_id.strip():
        raise HTTPException(401, "รหัสนักเรียนหรือเลขประจำตัวประชาชนไม่ถูกต้อง")

    assignment = db.scalar(
        select(DeviceAssignment).where(DeviceAssignment.student_id == body.student_id)
    )

    return {
        "student": {
            "student_id": student.student_id,
            "name": student.name,
            "grade": student.grade,
            "class_room": student.class_room,
        },
        "assignment": {
            "id": assignment.id,
            "serial_number": assignment.serial_number,
            "status": assignment.status,
            "assigned_at": assignment.assigned_at.isoformat(),
        } if assignment else None,
    }


@router.post("/upload-photos", status_code=201)
async def upload_student_photos(
    student_id: str,
    national_id: str,
    assignment_id: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    student = db.get(Student, student_id)
    if not student or student.national_id != national_id.strip():
        raise HTTPException(401, "ไม่มีสิทธิ์เข้าถึง")

    assignment = db.get(DeviceAssignment, assignment_id)
    if not assignment or assignment.student_id != student_id:
        raise HTTPException(403, "ไม่มีสิทธิ์เข้าถึงการจับคู่นี้")

    if not (1 <= len(files) <= 3):
        raise HTTPException(422, "ต้องส่งภาพ 1–3 ภาพ")

    photo_urls = []
    for file in files:
        ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        filename = f"student_{student_id}_{uuid.uuid4().hex[:8]}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(path, "wb") as f:
            await f.write(await file.read())
        photo = DeliveryPhoto(
            assignment_id=assignment_id,
            photo_url=f"/uploads/{filename}",
            taken_by=student.name,
            source="student_portal",
        )
        db.add(photo)
        photo_urls.append(f"/uploads/{filename}")

    db.commit()
    return {"uploaded": len(photo_urls), "photos": photo_urls}
