from flask import jsonify, request
from marshmallow import ValidationError as MarshmallowValidationError

from app.api import webhooks_bp
from app.extensions import db
from app.models.user import RoleEnum
from app.models.webhook import WebhookConfig, WebhookLog
from app.schemas import WebhookConfigSchema, WebhookCreateSchema, WebhookLogSchema
from app.decorators.auth import roles_required, get_current_user
from app.services.webhook_service import send_test_webhook
from app.utils.errors import ValidationError, NotFoundError


@webhooks_bp.route("", methods=["GET"])
@roles_required(RoleEnum.ADMIN)
def list_webhooks():
    webhooks = WebhookConfig.query.order_by(WebhookConfig.created_at.desc()).all()
    return jsonify(WebhookConfigSchema(many=True).dump(webhooks))


@webhooks_bp.route("", methods=["POST"])
@roles_required(RoleEnum.ADMIN)
def create_webhook():
    schema = WebhookCreateSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    user = get_current_user()
    webhook = WebhookConfig(
        url=data["url"],
        secret=data.get("secret"),
        events=data["events"],
        is_active=data.get("is_active", True),
        created_by=user.id,
    )
    db.session.add(webhook)
    db.session.commit()
    return jsonify(WebhookConfigSchema().dump(webhook)), 201


@webhooks_bp.route("/<int:webhook_id>", methods=["PUT"])
@roles_required(RoleEnum.ADMIN)
def update_webhook(webhook_id):
    webhook = WebhookConfig.query.get(webhook_id)
    if not webhook:
        raise NotFoundError("Webhook not found")

    data = request.get_json()
    if "url" in data:
        webhook.url = data["url"]
    if "secret" in data:
        webhook.secret = data["secret"]
    if "events" in data:
        webhook.events = data["events"]
    if "is_active" in data:
        webhook.is_active = data["is_active"]

    db.session.commit()
    return jsonify(WebhookConfigSchema().dump(webhook))


@webhooks_bp.route("/<int:webhook_id>", methods=["DELETE"])
@roles_required(RoleEnum.ADMIN)
def delete_webhook(webhook_id):
    webhook = WebhookConfig.query.get(webhook_id)
    if not webhook:
        raise NotFoundError("Webhook not found")
    db.session.delete(webhook)
    db.session.commit()
    return jsonify({"message": "Webhook deleted"})


@webhooks_bp.route("/<int:webhook_id>/test", methods=["POST"])
@roles_required(RoleEnum.ADMIN)
def test_webhook(webhook_id):
    webhook = WebhookConfig.query.get(webhook_id)
    if not webhook:
        raise NotFoundError("Webhook not found")

    log = send_test_webhook(webhook)
    return jsonify({
        "success": log.success if log else False,
        "response_status": log.response_status if log else None,
        "response_body": log.response_body if log else None,
    })


@webhooks_bp.route("/<int:webhook_id>/logs", methods=["GET"])
@roles_required(RoleEnum.ADMIN)
def webhook_logs(webhook_id):
    webhook = WebhookConfig.query.get(webhook_id)
    if not webhook:
        raise NotFoundError("Webhook not found")

    logs = (
        WebhookLog.query.filter_by(webhook_id=webhook_id)
        .order_by(WebhookLog.attempted_at.desc())
        .limit(50)
        .all()
    )
    return jsonify(WebhookLogSchema(many=True).dump(logs))
