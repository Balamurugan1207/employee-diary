from flask import jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.api import reports_bp
from app.models.user import RoleEnum
from app.models.timesheet import TimesheetEntry, TimesheetStatus
from app.models.team import TeamMembership
from app.decorators.auth import roles_required, get_current_user
from app.services.report_service import (
    hours_by_project,
    hours_by_employee,
    hours_by_client,
    billable_summary,
)
from app.utils.errors import ValidationError
from app.extensions import db


def _parse_date_range():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    if not start_date or not end_date:
        raise ValidationError("start_date and end_date are required")
    return start_date, end_date


def _get_team_user_ids(user):
    if user.role == RoleEnum.ADMIN:
        return None
    return [m.user_id for team in user.led_teams for m in team.members]


@reports_bp.route("/hours-by-project", methods=["GET"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def report_hours_by_project():
    user = get_current_user()
    start_date, end_date = _parse_date_range()
    team_ids = _get_team_user_ids(user)
    results = hours_by_project(start_date, end_date, team_ids)
    return jsonify([
        {
            "project_name": r.project_name,
            "project_code": r.project_code,
            "total_hours": float(r.total_hours or 0),
            "entry_count": r.entry_count,
        }
        for r in results
    ])


@reports_bp.route("/hours-by-employee", methods=["GET"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def report_hours_by_employee():
    user = get_current_user()
    start_date, end_date = _parse_date_range()
    team_ids = _get_team_user_ids(user)
    results = hours_by_employee(start_date, end_date, team_ids)
    return jsonify([
        {
            "employee_name": f"{r.first_name} {r.last_name}",
            "email": r.email,
            "total_hours": float(r.total_hours or 0),
            "entry_count": r.entry_count,
        }
        for r in results
    ])


@reports_bp.route("/hours-by-client", methods=["GET"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def report_hours_by_client():
    user = get_current_user()
    start_date, end_date = _parse_date_range()
    team_ids = _get_team_user_ids(user)
    results = hours_by_client(start_date, end_date, team_ids)
    return jsonify([
        {
            "client_name": r.client_name or "N/A",
            "total_hours": float(r.total_hours or 0),
            "entry_count": r.entry_count,
        }
        for r in results
    ])


@reports_bp.route("/billable-summary", methods=["GET"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def report_billable_summary():
    user = get_current_user()
    start_date, end_date = _parse_date_range()
    team_ids = _get_team_user_ids(user)
    results = billable_summary(start_date, end_date, team_ids)
    return jsonify([
        {
            "is_billable": r.is_billable,
            "total_hours": float(r.total_hours or 0),
            "entry_count": r.entry_count,
        }
        for r in results
    ])


@reports_bp.route("/my-summary", methods=["GET"])
@jwt_required()
def my_summary():
    user = get_current_user()
    start_date, end_date = _parse_date_range()

    total = db.session.query(
        func.sum(TimesheetEntry.hours_worked),
        func.count(TimesheetEntry.id),
    ).filter(
        TimesheetEntry.user_id == user.id,
        TimesheetEntry.entry_date >= start_date,
        TimesheetEntry.entry_date <= end_date,
    ).first()

    by_status = db.session.query(
        TimesheetEntry.status,
        func.count(TimesheetEntry.id),
    ).filter(
        TimesheetEntry.user_id == user.id,
        TimesheetEntry.entry_date >= start_date,
        TimesheetEntry.entry_date <= end_date,
    ).group_by(TimesheetEntry.status).all()

    return jsonify({
        "total_hours": float(total[0] or 0),
        "total_entries": total[1],
        "by_status": {s.value: c for s, c in by_status},
    })
