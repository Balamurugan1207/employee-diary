from datetime import datetime, timezone
from app.extensions import db
from app.models.timesheet import TimesheetEntry, TimesheetStatus
from app.models.webhook import WebhookEvent
from app.services.webhook_service import dispatch_webhook
from app.utils.errors import ValidationError, ForbiddenError, NotFoundError


def get_entry_or_404(entry_id):
    entry = TimesheetEntry.query.get(entry_id)
    if not entry:
        raise NotFoundError("Timesheet entry not found")
    return entry


def submit_entry(entry, user):
    if entry.user_id != user.id:
        raise ForbiddenError("You can only submit your own entries")
    if entry.status != TimesheetStatus.DRAFT:
        raise ValidationError("Only draft entries can be submitted")

    entry.status = TimesheetStatus.SUBMITTED
    db.session.commit()

    dispatch_webhook(
        WebhookEvent.TIMESHEET_SUBMITTED.value,
        _entry_payload(entry),
    )
    return entry


def approve_entry(entry, reviewer):
    if entry.status != TimesheetStatus.SUBMITTED:
        raise ValidationError("Only submitted entries can be approved")

    entry.status = TimesheetStatus.APPROVED
    entry.reviewed_by = reviewer.id
    entry.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()

    dispatch_webhook(
        WebhookEvent.TIMESHEET_APPROVED.value,
        _entry_payload(entry),
    )
    return entry


def reject_entry(entry, reviewer, reason):
    if entry.status != TimesheetStatus.SUBMITTED:
        raise ValidationError("Only submitted entries can be rejected")
    if not reason:
        raise ValidationError("Rejection reason is required")

    entry.status = TimesheetStatus.REJECTED
    entry.rejection_reason = reason
    entry.reviewed_by = reviewer.id
    entry.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()

    dispatch_webhook(
        WebhookEvent.TIMESHEET_REJECTED.value,
        {**_entry_payload(entry), "rejection_reason": reason},
    )
    return entry


def _entry_payload(entry):
    return {
        "entry_id": entry.id,
        "user_id": entry.user_id,
        "user_name": entry.user.full_name,
        "user_email": entry.user.email,
        "entry_date": str(entry.entry_date),
        "project": entry.project.name if entry.project else None,
        "hours_worked": float(entry.hours_worked),
        "status": entry.status.value,
        "category": entry.category.value,
        "is_billable": entry.is_billable,
    }
