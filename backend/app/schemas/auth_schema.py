from marshmallow import Schema, fields, validate


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=1))


class ChangePasswordSchema(Schema):
    old_password = fields.String(required=True)
    new_password = fields.String(required=True, validate=validate.Length(min=8))
