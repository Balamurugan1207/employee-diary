import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone

import requests
from app.extensions import db
from app.models.webhook import WebhookConfig, WebhookLog

logger = logging.getLogger(__name__)


def dispatch_webhook(event_name, data):
    """Dispatch webhook to all active configs subscribed to this event."""
    configs = WebhookConfig.query.filter(
        WebhookConfig.is_active.is_(True),
        WebhookConfig.events.any(event_name),
    ).all()

    for config in configs:
        _send_webhook(config, event_name, data)


def _send_webhook(config, event_name, data, retry_count=0):
    """Send a single webhook request and log the result."""
    payload = {
        "event": event_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    json_body = json.dumps(payload, default=str)
    headers = {"Content-Type": "application/json"}

    if config.secret:
        signature = hmac.new(
            config.secret.encode("utf-8"),
            json_body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        headers["X-Webhook-Signature"] = signature

    log_entry = WebhookLog(
        webhook_id=config.id,
        event=event_name,
        payload=payload,
        retry_count=retry_count,
        success=False,
    )

    try:
        response = requests.post(
            config.url, data=json_body, headers=headers, timeout=10
        )
        log_entry.response_status = response.status_code
        log_entry.response_body = response.text[:2000]
        log_entry.success = 200 <= response.status_code < 300
    except requests.RequestException as e:
        log_entry.response_body = str(e)[:2000]
        log_entry.success = False
        logger.warning(f"Webhook delivery failed for {config.url}: {e}")

    db.session.add(log_entry)
    db.session.commit()

    if not log_entry.success and retry_count < 3:
        _schedule_retry(config, event_name, data, retry_count + 1)


def _schedule_retry(config, event_name, data, retry_count):
    """Schedule a retry with exponential backoff."""
    from app.tasks.scheduler import scheduler

    delay_seconds = 30 * (4 ** (retry_count - 1))  # 30s, 120s, 480s
    run_time = datetime.now(timezone.utc).timestamp() + delay_seconds

    try:
        scheduler.add_job(
            _send_webhook,
            "date",
            run_date=datetime.fromtimestamp(run_time, tz=timezone.utc),
            args=[config, event_name, data, retry_count],
            id=f"webhook_retry_{config.id}_{event_name}_{retry_count}",
            replace_existing=True,
        )
    except Exception as e:
        logger.error(f"Failed to schedule webhook retry: {e}")


def send_test_webhook(config):
    """Send a test payload to verify webhook configuration."""
    test_data = {
        "message": "This is a test webhook from Employee Diary",
        "webhook_id": config.id,
    }
    _send_webhook(config, "test", test_data)
    log = (
        WebhookLog.query.filter_by(webhook_id=config.id, event="test")
        .order_by(WebhookLog.id.desc())
        .first()
    )
    return log
