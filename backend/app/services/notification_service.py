import logging
from datetime import date, timedelta
from app.models.user import User, RoleEnum
from app.models.timesheet import TimesheetEntry
from app.models.webhook import WebhookEvent
from app.services.webhook_service import dispatch_webhook

logger = logging.getLogger(__name__)


def check_missed_entries():
    """Check for employees who didn't submit a timesheet yesterday."""
    yesterday = date.today() - timedelta(days=1)

    # Skip weekends
    if yesterday.weekday() >= 5:
        return

    active_employees = User.query.filter_by(
        role=RoleEnum.EMPLOYEE, is_active=True
    ).all()

    for employee in active_employees:
        has_entry = TimesheetEntry.query.filter_by(
            user_id=employee.id, entry_date=yesterday
        ).first()

        if not has_entry:
            logger.info(f"Missed entry detected for {employee.email} on {yesterday}")
            dispatch_webhook(
                WebhookEvent.MISSED_ENTRY.value,
                {
                    "user_id": employee.id,
                    "user_name": employee.full_name,
                    "user_email": employee.email,
                    "missed_date": str(yesterday),
                },
            )
