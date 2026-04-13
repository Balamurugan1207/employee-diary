from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.api import teams_bp
from app.extensions import db
from app.models.user import User, RoleEnum
from app.models.team import Team, TeamMembership
from app.schemas import TeamSchema, TeamCreateSchema, TeamMemberSchema
from app.decorators.auth import roles_required, get_current_user
from app.utils.errors import ValidationError, NotFoundError, ConflictError, ForbiddenError


@teams_bp.route("", methods=["GET"])
@roles_required(RoleEnum.ADMIN, RoleEnum.TEAM_LEAD)
def list_teams():
    user = get_current_user()
    if user.role == RoleEnum.ADMIN:
        teams = Team.query.order_by(Team.name).all()
    else:
        teams = Team.query.filter_by(lead_id=user.id).all()
    return jsonify(TeamSchema(many=True).dump(teams))


@teams_bp.route("", methods=["POST"])
@roles_required(RoleEnum.ADMIN)
def create_team():
    data = request.get_json()
    if not data.get("name"):
        raise ValidationError("Team name is required")

    lead_id = data.get("lead_id")
    if lead_id:
        lead = User.query.get(lead_id)
        if not lead:
            raise NotFoundError("Lead user not found")

    if Team.query.filter_by(name=data["name"]).first():
        raise ConflictError("Team name already exists")

    team = Team(name=data["name"], lead_id=lead_id)
    db.session.add(team)
    db.session.commit()
    return jsonify(TeamSchema().dump(team)), 201


@teams_bp.route("/<int:team_id>", methods=["PUT"])
@roles_required(RoleEnum.ADMIN)
def update_team(team_id):
    team = Team.query.get(team_id)
    if not team:
        raise NotFoundError("Team not found")

    data = request.get_json()
    if "name" in data:
        team.name = data["name"]
    if "lead_id" in data:
        team.lead_id = data["lead_id"]

    db.session.commit()
    return jsonify(TeamSchema().dump(team))


@teams_bp.route("/<int:team_id>/members", methods=["GET"])
@roles_required(RoleEnum.ADMIN, RoleEnum.TEAM_LEAD)
def list_members(team_id):
    user = get_current_user()
    team = Team.query.get(team_id)
    if not team:
        raise NotFoundError("Team not found")

    if user.role == RoleEnum.TEAM_LEAD and team.lead_id != user.id:
        raise ForbiddenError("You can only view your own team")

    return jsonify(TeamMemberSchema(many=True).dump(team.members))


@teams_bp.route("/<int:team_id>/members", methods=["POST"])
@roles_required(RoleEnum.ADMIN, RoleEnum.TEAM_LEAD)
def add_member(team_id):
    user = get_current_user()
    team = Team.query.get(team_id)
    if not team:
        raise NotFoundError("Team not found")

    if user.role == RoleEnum.TEAM_LEAD and team.lead_id != user.id:
        raise ForbiddenError("You can only manage your own team")

    data = request.get_json()
    user_id = data.get("user_id")
    if not user_id:
        raise ValidationError("user_id is required")

    member_user = User.query.get(user_id)
    if not member_user:
        raise NotFoundError("User not found")

    existing = TeamMembership.query.filter_by(
        team_id=team_id, user_id=user_id
    ).first()
    if existing:
        raise ConflictError("User is already a member of this team")

    membership = TeamMembership(team_id=team_id, user_id=user_id)
    db.session.add(membership)
    db.session.commit()
    return jsonify(TeamMemberSchema().dump(membership)), 201


@teams_bp.route("/<int:team_id>", methods=["DELETE"])
@roles_required(RoleEnum.ADMIN)
def delete_team(team_id):
    team = Team.query.get(team_id)
    if not team:
        raise NotFoundError("Team not found")

    TeamMembership.query.filter_by(team_id=team_id).delete()
    db.session.delete(team)
    db.session.commit()
    return jsonify({"message": "Team deleted"})


@teams_bp.route("/<int:team_id>/members/<int:user_id>", methods=["DELETE"])
@roles_required(RoleEnum.ADMIN, RoleEnum.TEAM_LEAD)
def remove_member(team_id, user_id):
    user = get_current_user()
    team = Team.query.get(team_id)
    if not team:
        raise NotFoundError("Team not found")

    if user.role == RoleEnum.TEAM_LEAD and team.lead_id != user.id:
        raise ForbiddenError("You can only manage your own team")

    membership = TeamMembership.query.filter_by(
        team_id=team_id, user_id=user_id
    ).first()
    if not membership:
        raise NotFoundError("Membership not found")

    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "Member removed"})
