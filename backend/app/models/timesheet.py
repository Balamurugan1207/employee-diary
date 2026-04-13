import enum
from app.extensions import db


class TimesheetStatus(enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class CategoryEnum(enum.Enum):
    DEV = "dev"
    MEETING = "meeting"
    REVIEW = "review"
    TESTING = "testing"
    DEPLOYMENT = "deployment"
    OTHER = "other"


class PriorityEnum(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TimesheetEntry(db.Model):
    __tablename__ = "timesheet_entries"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    entry_date = db.Column(db.Date, nullable=False, index=True)
    project_id = db.Column(
        db.Integer, db.ForeignKey("projects.id"), nullable=False
    )
    task_description = db.Column(db.Text, nullable=False)
    hours_worked = db.Column(db.Numeric(4, 2), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    category = db.Column(db.Enum(CategoryEnum), nullable=False)
    priority = db.Column(
        db.Enum(PriorityEnum), nullable=False, default=PriorityEnum.MEDIUM
    )
    notes = db.Column(db.Text, nullable=True)
    is_billable = db.Column(db.Boolean, default=True, nullable=False)
    client_name = db.Column(db.String(200), nullable=True)
    status = db.Column(
        db.Enum(TimesheetStatus),
        default=TimesheetStatus.DRAFT,
        nullable=False,
        index=True,
    )
    rejection_reason = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    __table_args__ = (db.Index("ix_user_date", "user_id", "entry_date"),)

    user = db.relationship(
        "User", back_populates="timesheet_entries", foreign_keys=[user_id]
    )
    project = db.relationship("Project", back_populates="timesheet_entries")
    reviewer = db.relationship("User", foreign_keys=[reviewed_by])
