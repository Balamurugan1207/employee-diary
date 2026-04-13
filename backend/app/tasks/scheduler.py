import logging
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def init_scheduler(app):
    from app.services.notification_service import check_missed_entries

    check_hour = app.config.get("MISSED_ENTRY_CHECK_HOUR", 10)

    def run_with_context():
        with app.app_context():
            check_missed_entries()

    scheduler.add_job(
        run_with_context,
        "cron",
        hour=check_hour,
        minute=0,
        id="missed_entry_check",
        replace_existing=True,
    )

    if not scheduler.running:
        scheduler.start()
        logger.info(f"Scheduler started - missed entry check at {check_hour}:00 daily")
