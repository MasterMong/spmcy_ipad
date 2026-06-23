from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base
from routers import students, teachers, assignments, dashboard, reports, student_portal

Base.metadata.create_all(bind=engine)

# Add source column to existing delivery_photos tables (safe no-op if already present)
with engine.connect() as _conn:
    existing = [r[1] for r in _conn.execute(__import__('sqlalchemy').text("PRAGMA table_info(delivery_photos)")).fetchall()]
    if "source" not in existing:
        _conn.execute(__import__('sqlalchemy').text("ALTER TABLE delivery_photos ADD COLUMN source TEXT NOT NULL DEFAULT 'staff'"))
        _conn.commit()

app = FastAPI(title="iPad Distribution API", version="0.1.0")

# CORS origins configurable via env (comma-separated). Behind nginx the frontend
# is same-origin so CORS isn't strictly needed, but kept for direct access.
_default_origins = "http://localhost:5173,http://localhost:4173"
_cors = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(assignments.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(student_portal.router)

_upload_dir = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(_upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}
