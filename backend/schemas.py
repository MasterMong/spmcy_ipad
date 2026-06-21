from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class StudentBase(BaseModel):
    student_id: str
    name: str
    national_id: str
    grade: int
    class_room: str


class AssignmentBrief(BaseModel):
    """Flat assignment — nested inside StudentOut/TeacherOut to avoid circular ref."""
    id: str
    serial_number: str
    mac_address: str | None
    assignee_type: str
    student_id: str | None
    teacher_email: str | None
    assigned_at: datetime
    assigned_by: str
    status: str
    delivered_at: datetime | None
    delivered_by: str | None
    model_config = {"from_attributes": True}


class StudentOut(StudentBase):
    created_at: datetime
    assignment: AssignmentBrief | None = None
    model_config = {"from_attributes": True}


class TeacherBase(BaseModel):
    email: str
    name: str
    subject_group: str


class TeacherCreate(TeacherBase):
    pass


class TeacherOut(TeacherBase):
    created_at: datetime
    assignment: AssignmentBrief | None = None
    model_config = {"from_attributes": True}


class AssignmentCreate(BaseModel):
    serial_number: str
    assignee_type: Literal["student", "teacher"]
    student_id: str | None = None
    teacher_email: str | None = None
    assigned_by: str


class AssignmentOut(BaseModel):
    id: str
    serial_number: str
    mac_address: str | None
    assignee_type: str
    student_id: str | None
    teacher_email: str | None
    assigned_at: datetime
    assigned_by: str
    status: str
    delivered_at: datetime | None
    delivered_by: str | None
    student: StudentBase | None = None
    teacher: TeacherBase | None = None
    model_config = {"from_attributes": True}


class DeliverBody(BaseModel):
    delivered_by: str


class DashboardSummary(BaseModel):
    total_students: int
    total_teachers: int
    assigned_students: int
    delivered_students: int
    returned_students: int
    pending_students: int
    assigned_teachers: int
    delivered_teachers: int
    returned_teachers: int
    pending_teachers: int


class ClassroomItem(BaseModel):
    grade: int
    class_room: str


class StudentListOut(BaseModel):
    items: list[StudentOut]
    total: int
    page: int
    page_size: int
    pages: int
