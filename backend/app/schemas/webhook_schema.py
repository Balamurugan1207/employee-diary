from marshmallow import Schema, fields, validate
from app.models.webhook import WebhookEvent


class WebhookConfigSchema(Schema):
    id = fields.Integer(dump_only=True)
    url = fields.String()
    secret = fields.String(load_only=True)
    has_secret = fields.Method("get_has_secret")
    events = fields.List(fields.String())
    is_active = fields.Boolean()
    created_by = fields.Integer(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

    def get_has_secret(self, obj):
        return bool(obj.secret)


class WebhookCreateSchema(Schema):
    url = fields.Url(required=True)
    secret = fields.String(allow_none=True)
    events = fields.List(
        fields.String(validate=validate.OneOf([e.value for e in WebhookEvent])),
        required=True,
        validate=validate.Length(min=1),
    )
    is_active = fields.Boolean(load_default=True)


class WebhookLogSchema(Schema):
    id = fields.Integer(dump_only=True)
    webhook_id = fields.Integer()
    event = fields.String()
    payload = fields.Dict()
    response_status = fields.Integer()
    response_body = fields.String()
    success = fields.Boolean()
    attempted_at = fields.DateTime()
    retry_count = fields.Integer()


class ReportQuerySchema(Schema):
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
