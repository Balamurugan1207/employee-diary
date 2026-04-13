from marshmallow import Schema, fields, validate


class ClientSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    is_active = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)


class ClientCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
