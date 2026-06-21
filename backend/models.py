import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Enum, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

def now_utc():
    return datetime.now(timezone.utc)

class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    national_id: Mapped[str] = mapped_column(String(13), unique=True, nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    class_room: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    assignment: Mapped["DeviceAssignment | None"] = relationship(back_populates="student", uselist=False)


class Teacher(Base):
    __tablename__ = "teachers"

    email: Mapped[str] = mapped_column(String(150), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    subject_group: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    assignment: Mapped["DeviceAssignment | None"] = relationship(back_populates="teacher", uselist=False)


class DeviceAssignment(Base):
    __tablename__ = "device_assignments"
    __table_args__ = (
        CheckConstraint(
            "(assignee_type = 'student' AND student_id IS NOT NULL AND teacher_email IS NULL) OR "
            "(assignee_type = 'teacher' AND teacher_email IS NOT NULL AND student_id IS NULL)",
            name="ck_assignee_exclusive",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    serial_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    mac_address: Mapped[str | None] = mapped_column(String(17), nullable=True)
    assignee_type: Mapped[str] = mapped_column(Enum("student", "teacher", name="assignee_type_enum"), nullable=False)
    student_id: Mapped[str | None] = mapped_column(String(20), ForeignKey("students.student_id"), nullable=True)
    teacher_email: Mapped[str | None] = mapped_column(String(150), ForeignKey("teachers.email"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    assigned_by: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("assigned", "delivered", "returned", name="status_enum"),
        default="assigned",
        nullable=False,
    )
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_by: Mapped[str | None] = mapped_column(String(150), nullable=True)

    student: Mapped["Student | None"] = relationship(back_populates="assignment")
    teacher: Mapped["Teacher | None"] = relationship(back_populates="assignment")
    photos: Mapped[list["DeliveryPhoto"]] = relationship(back_populates="assignment", cascade="all, delete-orphan")


class DeliveryPhoto(Base):
    __tablename__ = "delivery_photos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assignment_id: Mapped[str] = mapped_column(String(36), ForeignKey("device_assignments.id"), nullable=False)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    taken_by: Mapped[str] = mapped_column(String(150), nullable=False)

    assignment: Mapped["DeviceAssignment"] = relationship(back_populates="photos")
