from sqlalchemy import func
from app.extensions import db
from app.models.timesheet import TimesheetEntry, TimesheetStatus
from app.models.project import Project
from app.models.user import User


def hours_by_project(start_date, end_date, team_user_ids=None):
    query = (
        db.session.query(
            Project.name.label("project_name"),
            Project.code.label("project_code"),
            func.sum(TimesheetEntry.hours_worked).label("total_hours"),
            func.count(TimesheetEntry.id).label("entry_count"),
        )
        .join(Project, TimesheetEntry.project_id == Project.id)
        .filter(
            TimesheetEntry.status == TimesheetStatus.APPROVED,
            TimesheetEntry.entry_date >= start_date,
            TimesheetEntry.entry_date <= end_date,
        )
    )
    if team_user_ids:
        query = query.filter(TimesheetEntry.user_id.in_(team_user_ids))
    return query.group_by(Project.name, Project.code).all()


def hours_by_employee(start_date, end_date, team_user_ids=None):
    query = (
        db.session.query(
            User.first_name,
            User.last_name,
            User.email,
            func.sum(TimesheetEntry.hours_worked).label("total_hours"),
            func.count(TimesheetEntry.id).label("entry_count"),
        )
        .join(User, TimesheetEntry.user_id == User.id)
        .filter(
            TimesheetEntry.status == TimesheetStatus.APPROVED,
            TimesheetEntry.entry_date >= start_date,
            TimesheetEntry.entry_date <= end_date,
        )
    )
    if team_user_ids:
        query = query.filter(TimesheetEntry.user_id.in_(team_user_ids))
    return query.group_by(User.first_name, User.last_name, User.email).all()


def hours_by_client(start_date, end_date, team_user_ids=None):
    query = (
        db.session.query(
            TimesheetEntry.client_name,
            func.sum(TimesheetEntry.hours_worked).label("total_hours"),
            func.count(TimesheetEntry.id).label("entry_count"),
        )
        .filter(
            TimesheetEntry.status == TimesheetStatus.APPROVED,
            TimesheetEntry.entry_date >= start_date,
            TimesheetEntry.entry_date <= end_date,
            TimesheetEntry.client_name.isnot(None),
        )
    )
    if team_user_ids:
        query = query.filter(TimesheetEntry.user_id.in_(team_user_ids))
    return query.group_by(TimesheetEntry.client_name).all()


def billable_summary(start_date, end_date, team_user_ids=None):
    query = (
        db.session.query(
            TimesheetEntry.is_billable,
            func.sum(TimesheetEntry.hours_worked).label("total_hours"),
            func.count(TimesheetEntry.id).label("entry_count"),
        )
        .filter(
            TimesheetEntry.status == TimesheetStatus.APPROVED,
            TimesheetEntry.entry_date >= start_date,
            TimesheetEntry.entry_date <= end_date,
        )
    )
    if team_user_ids:
        query = query.filter(TimesheetEntry.user_id.in_(team_user_ids))
    return query.group_by(TimesheetEntry.is_billable).all()
