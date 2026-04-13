from datetime import date, timedelta
from flask import jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.api import dashboard_bp
from app.extensions import db
from app.models.user import User, RoleEnum
from app.models.timesheet import TimesheetEntry, TimesheetStatus, CategoryEnum
from app.models.project import Project
from app.models.webhook import WebhookConfig, WebhookLog
from app.decorators.auth import roles_required, get_current_user


DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _week_day_series(week_start):
    return [(week_start + timedelta(days=i), DAY_NAMES[i]) for i in range(7)]


def _daily_hours(user_ids, week_start):
    """Get daily hours for a set of users over a week, returning all 7 days."""
    week_end = week_start + timedelta(days=6)
    rows = (
        db.session.query(
            TimesheetEntry.entry_date,
            func.sum(TimesheetEntry.hours_worked),
        )
        .filter(
            TimesheetEntry.user_id.in_(user_ids) if isinstance(user_ids, list)
            else TimesheetEntry.user_id == user_ids,
            TimesheetEntry.entry_date >= week_start,
            TimesheetEntry.entry_date <= week_end,
        )
        .group_by(TimesheetEntry.entry_date)
        .all()
    )
    hours_map = {r[0]: float(r[1] or 0) for r in rows}
    return [
        {"date": str(d), "day": name, "hours": hours_map.get(d, 0)}
        for d, name in _week_day_series(week_start)
    ]


@dashboard_bp.route("/employee", methods=["GET"])
@jwt_required()
def employee_dashboard():
    user = get_current_user()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    today_entries = TimesheetEntry.query.filter_by(
        user_id=user.id, entry_date=today
    ).all()

    week_hours = db.session.query(
        func.sum(TimesheetEntry.hours_worked)
    ).filter(
        TimesheetEntry.user_id == user.id,
        TimesheetEntry.entry_date >= week_start,
        TimesheetEntry.entry_date <= today,
    ).scalar() or 0

    pending = TimesheetEntry.query.filter_by(
        user_id=user.id, status=TimesheetStatus.DRAFT
    ).count()

    rejected = TimesheetEntry.query.filter_by(
        user_id=user.id, status=TimesheetStatus.REJECTED
    ).count()

    # --- New: daily hours this week ---
    daily_hours = _daily_hours(user.id, week_start)

    # --- New: hours by category (this week) ---
    cat_rows = (
        db.session.query(
            TimesheetEntry.category,
            func.sum(TimesheetEntry.hours_worked),
        )
        .filter(
            TimesheetEntry.user_id == user.id,
            TimesheetEntry.entry_date >= week_start,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(TimesheetEntry.category)
        .all()
    )
    hours_by_category = {r[0].value: float(r[1] or 0) for r in cat_rows}

    # --- New: hours by project (this month, top 5) ---
    proj_rows = (
        db.session.query(
            Project.name,
            func.sum(TimesheetEntry.hours_worked).label("hrs"),
        )
        .join(Project, TimesheetEntry.project_id == Project.id)
        .filter(
            TimesheetEntry.user_id == user.id,
            TimesheetEntry.entry_date >= month_start,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(Project.name)
        .order_by(func.sum(TimesheetEntry.hours_worked).desc())
        .limit(5)
        .all()
    )
    hours_by_project = [
        {"project_name": r[0], "hours": float(r[1] or 0)} for r in proj_rows
    ]

    # --- New: approval rate ---
    approved_count = TimesheetEntry.query.filter_by(
        user_id=user.id, status=TimesheetStatus.APPROVED
    ).count()
    rejected_count = TimesheetEntry.query.filter_by(
        user_id=user.id, status=TimesheetStatus.REJECTED
    ).count()
    reviewed_total = approved_count + rejected_count
    approval_rate = round((approved_count / reviewed_total) * 100, 1) if reviewed_total else 100.0

    from app.schemas import TimesheetEntrySchema

    return jsonify({
        "today_entries": TimesheetEntrySchema(many=True).dump(today_entries),
        "week_hours": float(week_hours),
        "pending_drafts": pending,
        "rejected_entries": rejected,
        "daily_hours_this_week": daily_hours,
        "hours_by_category": hours_by_category,
        "hours_by_project": hours_by_project,
        "approval_rate": approval_rate,
    })


@dashboard_bp.route("/team-lead", methods=["GET"])
@roles_required(RoleEnum.TEAM_LEAD, RoleEnum.ADMIN)
def team_lead_dashboard():
    user = get_current_user()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    if user.role == RoleEnum.ADMIN:
        team_user_ids = [u.id for u in User.query.filter_by(is_active=True).all()]
    else:
        team_user_ids = [m.user_id for team in user.led_teams for m in team.members]

    pending_approvals = TimesheetEntry.query.filter(
        TimesheetEntry.user_id.in_(team_user_ids),
        TimesheetEntry.status == TimesheetStatus.SUBMITTED,
    ).count() if team_user_ids else 0

    team_week_hours = db.session.query(
        func.sum(TimesheetEntry.hours_worked)
    ).filter(
        TimesheetEntry.user_id.in_(team_user_ids),
        TimesheetEntry.entry_date >= week_start,
        TimesheetEntry.entry_date <= today,
    ).scalar() if team_user_ids else 0

    team_size = len(team_user_ids)

    today_submitted = TimesheetEntry.query.filter(
        TimesheetEntry.user_id.in_(team_user_ids),
        TimesheetEntry.entry_date == today,
    ).distinct(TimesheetEntry.user_id).count() if team_user_ids else 0

    # --- New: member hours this week ---
    member_rows = (
        db.session.query(
            User.id,
            User.first_name,
            User.last_name,
            func.sum(TimesheetEntry.hours_worked),
        )
        .join(TimesheetEntry, TimesheetEntry.user_id == User.id)
        .filter(
            User.id.in_(team_user_ids),
            TimesheetEntry.entry_date >= week_start,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(User.id, User.first_name, User.last_name)
        .order_by(func.sum(TimesheetEntry.hours_worked).desc())
        .all()
    ) if team_user_ids else []
    member_hours = [
        {"user_id": r[0], "name": f"{r[1]} {r[2]}", "hours": float(r[3] or 0)}
        for r in member_rows
    ]

    # --- New: daily team hours ---
    daily_hours = _daily_hours(team_user_ids, week_start) if team_user_ids else [
        {"date": str(d), "day": name, "hours": 0}
        for d, name in _week_day_series(week_start)
    ]

    # --- New: entries by status (this week) ---
    status_rows = (
        db.session.query(
            TimesheetEntry.status,
            func.count(TimesheetEntry.id),
        )
        .filter(
            TimesheetEntry.user_id.in_(team_user_ids),
            TimesheetEntry.entry_date >= week_start,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(TimesheetEntry.status)
        .all()
    ) if team_user_ids else []
    entries_by_status = {r[0].value: r[1] for r in status_rows}

    # --- New: top projects (this week) ---
    proj_rows = (
        db.session.query(
            Project.name,
            func.sum(TimesheetEntry.hours_worked).label("hrs"),
        )
        .join(Project, TimesheetEntry.project_id == Project.id)
        .filter(
            TimesheetEntry.user_id.in_(team_user_ids),
            TimesheetEntry.entry_date >= week_start,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(Project.name)
        .order_by(func.sum(TimesheetEntry.hours_worked).desc())
        .limit(5)
        .all()
    ) if team_user_ids else []
    top_projects = [
        {"project_name": r[0], "hours": float(r[1] or 0)} for r in proj_rows
    ]

    # --- New: members not submitted today ---
    submitted_today_ids = set()
    if team_user_ids:
        submitted_rows = (
            db.session.query(TimesheetEntry.user_id)
            .filter(
                TimesheetEntry.user_id.in_(team_user_ids),
                TimesheetEntry.entry_date == today,
            )
            .distinct()
            .all()
        )
        submitted_today_ids = {r[0] for r in submitted_rows}
    missing_ids = [uid for uid in team_user_ids if uid not in submitted_today_ids]
    missing_members = []
    if missing_ids:
        missing_users = User.query.filter(User.id.in_(missing_ids)).all()
        missing_members = [
            {"user_id": u.id, "name": u.full_name} for u in missing_users
        ]

    return jsonify({
        "pending_approvals": pending_approvals,
        "team_week_hours": float(team_week_hours or 0),
        "team_size": team_size,
        "today_submitted_count": today_submitted,
        "member_hours_this_week": member_hours,
        "daily_team_hours": daily_hours,
        "entries_by_status": entries_by_status,
        "top_projects": top_projects,
        "members_not_submitted_today": missing_members,
    })


@dashboard_bp.route("/admin", methods=["GET"])
@roles_required(RoleEnum.ADMIN)
def admin_dashboard():
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    four_weeks_ago = week_start - timedelta(weeks=3)

    total_users = User.query.filter_by(is_active=True).count()
    total_entries_today = TimesheetEntry.query.filter_by(entry_date=today).count()

    active_webhooks = WebhookConfig.query.filter_by(is_active=True).count()
    recent_failures = WebhookLog.query.filter_by(success=False).order_by(
        WebhookLog.attempted_at.desc()
    ).limit(5).count()

    by_role = db.session.query(
        User.role, func.count(User.id)
    ).filter_by(is_active=True).group_by(User.role).all()

    # --- New: weekly hours trend (last 4 weeks) ---
    weekly_trend = []
    for i in range(4):
        ws = four_weeks_ago + timedelta(weeks=i)
        we = ws + timedelta(days=6)
        hrs = db.session.query(
            func.sum(TimesheetEntry.hours_worked)
        ).filter(
            TimesheetEntry.entry_date >= ws,
            TimesheetEntry.entry_date <= we,
        ).scalar() or 0
        weekly_trend.append({
            "week_label": ws.strftime("%b %d"),
            "hours": float(hrs),
        })

    # --- New: entries by status (last 4 weeks) ---
    status_rows = (
        db.session.query(
            TimesheetEntry.status,
            func.count(TimesheetEntry.id),
        )
        .filter(
            TimesheetEntry.entry_date >= four_weeks_ago,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(TimesheetEntry.status)
        .all()
    )
    entries_by_status = {r[0].value: r[1] for r in status_rows}

    # --- New: top projects (last 4 weeks) ---
    proj_rows = (
        db.session.query(
            Project.name,
            Project.code,
            func.sum(TimesheetEntry.hours_worked).label("hrs"),
        )
        .join(Project, TimesheetEntry.project_id == Project.id)
        .filter(
            TimesheetEntry.entry_date >= four_weeks_ago,
            TimesheetEntry.entry_date <= today,
        )
        .group_by(Project.name, Project.code)
        .order_by(func.sum(TimesheetEntry.hours_worked).desc())
        .limit(5)
        .all()
    )
    top_projects = [
        {"project_name": r[0], "project_code": r[1], "hours": float(r[2] or 0)}
        for r in proj_rows
    ]

    # --- New: this week vs last week entry counts ---
    entries_this_week = TimesheetEntry.query.filter(
        TimesheetEntry.entry_date >= week_start,
        TimesheetEntry.entry_date <= today,
    ).count()
    last_week_start = week_start - timedelta(weeks=1)
    last_week_end = week_start - timedelta(days=1)
    entries_last_week = TimesheetEntry.query.filter(
        TimesheetEntry.entry_date >= last_week_start,
        TimesheetEntry.entry_date <= last_week_end,
    ).count()

    return jsonify({
        "total_users": total_users,
        "entries_today": total_entries_today,
        "active_webhooks": active_webhooks,
        "recent_webhook_failures": recent_failures,
        "users_by_role": {r.value: c for r, c in by_role},
        "weekly_hours_trend": weekly_trend,
        "entries_by_status": entries_by_status,
        "top_projects": top_projects,
        "entries_this_week": entries_this_week,
        "entries_last_week": entries_last_week,
    })
