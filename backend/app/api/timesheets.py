from datetime import date, datetime
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError as MarshmallowValidationError

from app.api import timesheets_bp
from app.extensions import db
from app.models.user import RoleEnum
from app.models.timesheet import TimesheetEntry, TimesheetStatus, CategoryEnum, PriorityEnum
from app.schemas import TimesheetEntrySchema, TimesheetCreateSchema, TimesheetUpdateSchema
from app.decorators.auth import roles_required, get_current_user
from app.services.timesheet_service import (
    get_entry_or_404,
    submit_entry,
    approve_entry,
    reject_entry,
)
from app.utils.errors import ValidationError, ForbiddenError
from app.utils.pagination import paginate


def _parse_entry_date(date_str: str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValidationError("Invalid date format. Expected YYYY-MM-DD")


@timesheets_bp.route("", methods=["GET"])
@jwt_required()
def list_entries():
    user = get_current_user()

    if user.role == RoleEnum.ADMIN and request.args.get("all") == "true":
        query = TimesheetEntry.query
    else:
        query = TimesheetEntry.query.filter_by(user_id=user.id)

    user_id_filter = request.args.get("user_id")
    if user_id_filter and user.role == RoleEnum.ADMIN:
        query = query.filter(TimesheetEntry.user_id == int(user_id_filter))

    status = request.args.get("status")
    if status:
        query = query.filter(TimesheetEntry.status == TimesheetStatus(status))

    project_id = request.args.get("project_id")
    if project_id:
        query = query.filter(TimesheetEntry.project_id == int(project_id))

    start_date = request.args.get("start_date")
    if start_date:
        query = query.filter(TimesheetEntry.entry_date >= start_date)

    end_date = request.args.get("end_date")
    if end_date:
        query = query.filter(TimesheetEntry.entry_date <= end_date)

    query = query.order_by(TimesheetEntry.entry_date.desc(), TimesheetEntry.start_time.asc())
    return jsonify(paginate(query, TimesheetEntrySchema(many=True)))


@timesheets_bp.route("/by-date/<string:entry_date>", methods=["GET"])
@jwt_required()
def get_entries_by_date(entry_date):
    try:
        user = get_current_user()
        parsed_date = _parse_entry_date(entry_date)
    except Exception as e:
        return jsonify({"error": f"Invalid date: {str(e)}"}), 400

    entries = (
        TimesheetEntry.query
        .filter_by(user_id=user.id, entry_date=parsed_date)
        .order_by(TimesheetEntry.start_time.asc(), TimesheetEntry.id.asc())
        .all()
    )

    return jsonify(TimesheetEntrySchema(many=True).dump(entries)), 200


@timesheets_bp.route("", methods=["POST"])
@jwt_required()
def create_entry():
    user = get_current_user()
    schema = TimesheetCreateSchema()

    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    existing = TimesheetEntry.query.filter_by(
        user_id=user.id,
        entry_date=data["entry_date"],
        status=TimesheetStatus.APPROVED
    ).first()

    if existing:
        raise ValidationError(
            f"You already have entries for {data['entry_date']}. "
            "Use the existing entries for that date instead of creating a new daily submission."
        )

    entry = TimesheetEntry(
        user_id=user.id,
        entry_date=data["entry_date"],
        project_id=data["project_id"],
        task_description=data["task_description"],
        hours_worked=data["hours_worked"],
        start_time=data["start_time"],
        end_time=data["end_time"],
        category=CategoryEnum(data["category"]),
        priority=PriorityEnum(data["priority"]),
        notes=data.get("notes"),
        is_billable=data.get("is_billable", True),
        client_name=data.get("client_name"),
        status=TimesheetStatus.DRAFT,
    )

    db.session.add(entry)
    db.session.commit()
    return jsonify(TimesheetEntrySchema().dump(entry)), 201


@timesheets_bp.route("/bulk", methods=["POST"])
@jwt_required()
def create_bulk_entries():
    user = get_current_user()
    payload = request.get_json() or {}
    entries_data = payload.get("entries")
    submit = payload.get("submit", True)

    if not entries_data or not isinstance(entries_data, list):
        raise ValidationError("entries array is required")

    schema = TimesheetCreateSchema()

    try:
        first_data = schema.load(entries_data[0])
    except MarshmallowValidationError as e:
        raise ValidationError("Entry 1: invalid input", details=e.messages)

    entry_date = first_data["entry_date"]

    existing = TimesheetEntry.query.filter_by(
        user_id=user.id,
        entry_date=entry_date,
        status=TimesheetStatus.APPROVED
    ).first()

    if existing:
        raise ValidationError(
            f"You already have entries for {entry_date}. "
)

    created = []

    for i, raw in enumerate(entries_data):
        try:
            data = schema.load(raw)
        except MarshmallowValidationError as e:
            raise ValidationError(f"Entry {i + 1}: invalid input", details=e.messages)

        if data["entry_date"] != entry_date:
            raise ValidationError("All entries in bulk request must belong to the same date")

        entry = TimesheetEntry(
            user_id=user.id,
            entry_date=data["entry_date"],
            project_id=data["project_id"],
            task_description=data["task_description"],
            hours_worked=data["hours_worked"],
            start_time=data["start_time"],
            end_time=data["end_time"],
            category=CategoryEnum(data["category"]),
            priority=PriorityEnum(data["priority"]),
            notes=data.get("notes"),
            is_billable=data.get("is_billable", True),
            client_name=data.get("client_name"),
            status=TimesheetStatus.SUBMITTED if submit else TimesheetStatus.DRAFT,
        )
        db.session.add(entry)
        created.append(entry)

    db.session.commit()
    return jsonify(TimesheetEntrySchema(many=True).dump(created)), 201


@timesheets_bp.route("/<int:entry_id>", methods=["GET"])
@jwt_required()
def get_entry(entry_id):
    user = get_current_user()
    entry = get_entry_or_404(entry_id)

    if entry.user_id != user.id and user.role == RoleEnum.EMPLOYEE:
        raise ForbiddenError("Access denied")

    return jsonify(TimesheetEntrySchema().dump(entry))


@timesheets_bp.route("/<int:entry_id>", methods=["PUT"])
@jwt_required()
def update_entry(entry_id):
    user = get_current_user()
    entry = get_entry_or_404(entry_id)

    if entry.user_id != user.id:
        raise ForbiddenError("You can only edit your own entries")

    if entry.status not in (TimesheetStatus.DRAFT, TimesheetStatus.REJECTED):
        raise ValidationError("Only draft or rejected entries can be edited")

    schema = TimesheetUpdateSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    for field in [
        "entry_date", "project_id", "task_description", "hours_worked",
        "start_time", "end_time", "notes", "is_billable", "client_name",
    ]:
        if field in data:
            setattr(entry, field, data[field])

    if "category" in data:
        entry.category = CategoryEnum(data["category"])

    if "priority" in data:
        entry.priority = PriorityEnum(data["priority"])

    if entry.status == TimesheetStatus.REJECTED:
        entry.status = TimesheetStatus.DRAFT
        entry.rejection_reason = None

    db.session.commit()
    return jsonify(TimesheetEntrySchema().dump(entry))


@timesheets_bp.route("/<int:entry_id>", methods=["DELETE"])
@jwt_required()
def delete_entry(entry_id):
    user = get_current_user()
    entry = get_entry_or_404(entry_id)

    is_team_lead_of_entry = False
    if user.role == RoleEnum.TEAM_LEAD:
        team_user_ids = [m.user_id for team in user.led_teams for m in team.members]
        is_team_lead_of_entry = entry.user_id in team_user_ids

    if entry.user_id != user.id and user.role != RoleEnum.ADMIN and not is_team_lead_of_entry:
        raise ForbiddenError("You don't have permission to delete this entry")

    if entry.user_id == user.id and entry.status != TimesheetStatus.DRAFT:
        raise ValidationError("Only draft entries can be deleted")

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Entry deleted"})


@timesheets_bp.route("/<int:entry_id>/submit", methods=["POST"])
@jwt_required()
def submit_entry_route(entry_id):
    user = get_current_user()
    entry = get_entry_or_404(entry_id)
    entry.status = TimesheetStatus.DRAFT
    print(entry.status)
    entry = submit_entry(entry, user)
    return jsonify(TimesheetEntrySchema().dump(entry))


@timesheets_bp.route("/<int:entry_id>/approve", methods=["POST"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def approve_entry_route(entry_id):
    reviewer = get_current_user()
    entry = get_entry_or_404(entry_id)
    entry = approve_entry(entry, reviewer)
    return jsonify(TimesheetEntrySchema().dump(entry))


@timesheets_bp.route("/<int:entry_id>/reject", methods=["POST"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def reject_entry_route(entry_id):
    reviewer = get_current_user()
    entry = get_entry_or_404(entry_id)
    data = request.get_json() or {}
    entry = reject_entry(entry, reviewer, data.get("reason", ""))
    return jsonify(TimesheetEntrySchema().dump(entry))


@timesheets_bp.route("/team", methods=["GET"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def list_team_entries():
    user = get_current_user()

    if user.role == RoleEnum.ADMIN:
        query = TimesheetEntry.query
    else:
        team_user_ids = [
            m.user_id
            for team in user.led_teams
            for m in team.members
        ]
        if not team_user_ids:
            return jsonify({"items": [], "total": 0, "page": 1, "pages": 0, "per_page": 20})

        query = query.filter(TimesheetEntry.user_id.in_(team_user_ids))

    status = request.args.get("status")
    if status:
        query = query.filter(TimesheetEntry.status == TimesheetStatus(status))

    start_date = request.args.get("start_date")
    if start_date:
        query = query.filter(TimesheetEntry.entry_date >= start_date)

    end_date = request.args.get("end_date")
    if end_date:
        query = query.filter(TimesheetEntry.entry_date <= end_date)

    query = query.order_by(TimesheetEntry.entry_date.desc(), TimesheetEntry.start_time.asc())
    return jsonify(paginate(query, TimesheetEntrySchema(many=True)))


@timesheets_bp.route("/calendar", methods=["GET"])
@jwt_required()
def calendar_entries():
    user = get_current_user()
    year = request.args.get("year", date.today().year, type=int)
    month = request.args.get("month", date.today().month, type=int)

    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    entries = TimesheetEntry.query.filter(
        TimesheetEntry.user_id == user.id,
        TimesheetEntry.entry_date >= start,
        TimesheetEntry.entry_date < end,
    ).order_by(TimesheetEntry.entry_date, TimesheetEntry.start_time).all()

    grouped = {}
    schema = TimesheetEntrySchema()

    for entry in entries:
        day = str(entry.entry_date)
        if day not in grouped:
            grouped[day] = []
        grouped[day].append(schema.dump(entry))

    return jsonify({"year": year, "month": month, "entries": grouped})