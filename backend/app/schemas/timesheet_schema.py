from marshmallow import Schema, fields, validate
from app.models.timesheet import CategoryEnum, PriorityEnum


class TimesheetEntrySchema(Schema):
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer(dump_only=True)
    user_name = fields.Method("get_user_name")
    user_email = fields.Method("get_user_email")
    entry_date = fields.Date()
    project_id = fields.Integer()
    project_name = fields.Method("get_project_name")
    task_description = fields.String()
    hours_worked = fields.Float()
    start_time = fields.Time()
    end_time = fields.Time()
    category = fields.Method("get_category")
    priority = fields.Method("get_priority")
    notes = fields.String()
    is_billable = fields.Boolean()
    client_name = fields.String()
    status = fields.Method("get_status")
    rejection_reason = fields.String()
    reviewed_by = fields.Integer()
    reviewer_name = fields.Method("get_reviewer_name")
    reviewed_at = fields.DateTime()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else None

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_category(self, obj):
        return obj.category.value if obj.category else None

    def get_priority(self, obj):
        return obj.priority.value if obj.priority else None

    def get_status(self, obj):
        return obj.status.value if obj.status else None

    def get_reviewer_name(self, obj):
        return obj.reviewer.full_name if obj.reviewer else None


class TimesheetCreateSchema(Schema):
    entry_date = fields.Date(required=True)
    project_id = fields.Integer(required=True)
    task_description = fields.String(
        required=True, validate=validate.Length(min=10)
    )
    hours_worked = fields.Float(
        required=True, validate=validate.Range(min=0.25, max=24)
    )
    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    category = fields.String(
        required=True,
        validate=validate.OneOf([c.value for c in CategoryEnum]),
    )
    priority = fields.String(
        load_default="medium",
        validate=validate.OneOf([p.value for p in PriorityEnum]),
    )
    notes = fields.String(allow_none=True)
    is_billable = fields.Boolean(load_default=True)
    client_name = fields.String(allow_none=True)


class TimesheetUpdateSchema(Schema):
    entry_date = fields.Date()
    project_id = fields.Integer()
    task_description = fields.String(validate=validate.Length(min=10))
    hours_worked = fields.Float(validate=validate.Range(min=0.25, max=24))
    start_time = fields.Time()
    end_time = fields.Time()
    category = fields.String(
        validate=validate.OneOf([c.value for c in CategoryEnum])
    )
    priority = fields.String(
        validate=validate.OneOf([p.value for p in PriorityEnum])
    )
    notes = fields.String(allow_none=True)
    is_billable = fields.Boolean()
    client_name = fields.String(allow_none=True)
