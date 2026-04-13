import enum
from app.extensions import db


class WebhookEvent(enum.Enum):
    TIMESHEET_SUBMITTED = "timesheet.submitted"
    TIMESHEET_APPROVED = "timesheet.approved"
    TIMESHEET_REJECTED = "timesheet.rejected"
    MISSED_ENTRY = "missed_entry.reminder"


class WebhookConfig(db.Model):
    __tablename__ = "webhook_configs"

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    secret = db.Column(db.String(255), nullable=True)
    events = db.Column(db.ARRAY(db.String), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime, server_default=db.func.now(), onupdate=db.func.now()
    )

    logs = db.relationship("WebhookLog", back_populates="webhook")


class WebhookLog(db.Model):
    __tablename__ = "webhook_logs"

    id = db.Column(db.Integer, primary_key=True)
    webhook_id = db.Column(
        db.Integer, db.ForeignKey("webhook_configs.id"), nullable=False
    )
    event = db.Column(db.String(50), nullable=False)
    payload = db.Column(db.JSON, nullable=False)
    response_status = db.Column(db.Integer, nullable=True)
    response_body = db.Column(db.Text, nullable=True)
    success = db.Column(db.Boolean, nullable=False)
    attempted_at = db.Column(db.DateTime, server_default=db.func.now())
    retry_count = db.Column(db.Integer, default=0)

    webhook = db.relationship("WebhookConfig", back_populates="logs")
