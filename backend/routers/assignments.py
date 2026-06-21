from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
import aiofiles, os

from database import get_db
from models import DeviceAssignment, DeliveryPhoto
from schemas import AssignmentCreate, AssignmentOut, DeliverBody

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=list[AssignmentOut])
def list_assignments(
    status: str | None = None,
    assignee_type: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(DeviceAssignment)
    if status:
        stmt = stmt.where(DeviceAssignment.status == status)
    if assignee_type:
        stmt = stmt.where(DeviceAssignment.assignee_type == assignee_type)
    return db.scalars(stmt).all()


@router.post("", response_model=AssignmentOut, status_code=201)
def create_assignment(body: AssignmentCreate, db: Session = Depends(get_db)):
    if body.assignee_type == "student" and not body.student_id:
        raise HTTPException(422, "student_id required")
    if body.assignee_type == "teacher" and not body.teacher_email:
        raise HTTPException(422, "teacher_email required")

    existing = db.scalar(select(DeviceAssignment).where(DeviceAssignment.serial_number == body.serial_number))
    if existing:
        raise HTTPException(409, "Serial number already assigned")

    a = DeviceAssignment(**body.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.get("/{assignment_id}", response_model=AssignmentOut)
def get_assignment(assignment_id: str, db: Session = Depends(get_db)):
    a = db.get(DeviceAssignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")
    return a


@router.patch("/{assignment_id}", response_model=AssignmentOut)
def update_serial(assignment_id: str, serial_number: str, db: Session = Depends(get_db)):
    a = db.get(DeviceAssignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")
    a.serial_number = serial_number
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: str, db: Session = Depends(get_db)):
    a = db.get(DeviceAssignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")
    db.delete(a)
    db.commit()


@router.post("/{assignment_id}/deliver", response_model=AssignmentOut)
def deliver_assignment(assignment_id: str, body: DeliverBody, db: Session = Depends(get_db)):
    a = db.get(DeviceAssignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")
    if a.status == "delivered":
        raise HTTPException(409, "Already delivered")
    a.status = "delivered"
    a.delivered_at = datetime.now(timezone.utc)
    a.delivered_by = body.delivered_by
    db.commit()
    db.refresh(a)
    return a


@router.post("/{assignment_id}/photo", status_code=201)
async def upload_photo(
    assignment_id: str,
    taken_by: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    a = db.get(DeviceAssignment, assignment_id)
    if not a:
        raise HTTPException(404, "Assignment not found")

    filename = f"{assignment_id}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())

    photo = DeliveryPhoto(assignment_id=assignment_id, photo_url=f"/uploads/{filename}", taken_by=taken_by)
    db.add(photo)
    db.commit()
    return {"photo_url": photo.photo_url}
