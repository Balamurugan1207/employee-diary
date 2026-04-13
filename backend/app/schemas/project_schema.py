from marshmallow import Schema, fields, validate


class ProjectSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    code = fields.String()
    client_id = fields.Integer(allow_none=True)
    client_name = fields.Method("get_client_name")
    is_active = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)

    def get_client_name(self, obj):
        return obj.client.name if obj.client else None


class ProjectCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    code = fields.String(required=True, validate=validate.Length(min=1, max=20))
    client_id = fields.Integer(allow_none=True)
