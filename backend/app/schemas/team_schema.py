from marshmallow import Schema, fields, validate


class TeamMemberSchema(Schema):
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer()
    first_name = fields.Method("get_first_name")
    last_name = fields.Method("get_last_name")
    email = fields.Method("get_email")

    def get_first_name(self, obj):
        return obj.user.first_name if obj.user else None

    def get_last_name(self, obj):
        return obj.user.last_name if obj.user else None

    def get_email(self, obj):
        return obj.user.email if obj.user else None


class TeamSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    lead_id = fields.Integer(allow_none=True)
    lead_name = fields.Method("get_lead_name")
    members = fields.Nested(TeamMemberSchema, many=True)
    created_at = fields.DateTime(dump_only=True)

    def get_lead_name(self, obj):
        return obj.lead.full_name if obj.lead else None


class TeamCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    lead_id = fields.Integer(allow_none=True, load_default=None)
