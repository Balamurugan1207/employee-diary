from marshmallow import Schema, fields, validate
from app.models.user import RoleEnum


class UserSchema(Schema):
    id = fields.Integer(dump_only=True)
    email = fields.Email(dump_only=True)
    first_name = fields.String()
    last_name = fields.String()
    role = fields.Method("get_role")
    is_active = fields.Boolean()
    team_id = fields.Method("get_team_id")
    team_name = fields.Method("get_team_name")
    lead_name = fields.Method("get_lead_name")
    created_at = fields.DateTime(dump_only=True)

    def get_role(self, obj):
        return obj.role.value if obj.role else None

    def get_team_id(self, obj):
        if obj.team_memberships:
            return obj.team_memberships[0].team_id
        return None

    def get_team_name(self, obj):
        if obj.team_memberships:
            return obj.team_memberships[0].team.name
        return None

    def get_lead_name(self, obj):
        if obj.team_memberships:
            team = obj.team_memberships[0].team
            return team.lead.full_name if team.lead else None
        return None


class UserCreateSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    role = fields.String(
        required=True,
        validate=validate.OneOf([r.value for r in RoleEnum]),
    )
    team_id = fields.Integer(allow_none=True, load_default=None)


class UserUpdateSchema(Schema):
    first_name = fields.String(validate=validate.Length(min=1, max=100))
    last_name = fields.String(validate=validate.Length(min=1, max=100))
    role = fields.String(validate=validate.OneOf([r.value for r in RoleEnum]))
    is_active = fields.Boolean()
    team_id = fields.Integer(allow_none=True)
