from flask import jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError as MarshmallowValidationError

from app.api import users_bp
from app.extensions import db
from app.models.user import User, RoleEnum
from app.models.team import Team, TeamMembership
from app.models.timesheet import TimesheetEntry
from app.schemas import UserSchema, UserCreateSchema, UserUpdateSchema
from app.decorators.auth import roles_required
from app.utils.errors import ValidationError, NotFoundError, ConflictError
from app.utils.pagination import paginate


def _sync_team_membership(user, team_id):
    """Assign user to a team (remove from old team first)."""
    TeamMembership.query.filter_by(user_id=user.id).delete()

    if team_id:
        team = Team.query.get(team_id)
        if not team:
            raise NotFoundError("Team not found")
        db.session.add(TeamMembership(team_id=team_id, user_id=user.id))


@users_bp.route("", methods=["GET"])
@roles_required(RoleEnum.ADMIN)
def list_users():
    query = User.query
    role = request.args.get("role")
    if role:
        query = query.filter(User.role == RoleEnum(role))
    is_active = request.args.get("is_active")
    if is_active is not None:
        query = query.filter(User.is_active == (is_active.lower() == "true"))
    query = query.order_by(User.created_at.desc())
    return jsonify(paginate(query, UserSchema(many=True)))


@users_bp.route("", methods=["POST"])
@roles_required(RoleEnum.ADMIN)
def create_user():
    schema = UserCreateSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    if User.query.filter_by(email=data["email"]).first():
        raise ConflictError("Email already exists")

    user = User(
        email=data["email"],
        first_name=data["first_name"],
        last_name=data["last_name"],
        role=RoleEnum(data["role"]),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    team_id = data.get("team_id")
    if team_id:
        _sync_team_membership(user, team_id)

    db.session.commit()
    return jsonify(UserSchema().dump(user)), 201


@users_bp.route("/<int:user_id>", methods=["GET"])
@roles_required(RoleEnum.ADMIN)
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found")
    return jsonify(UserSchema().dump(user))


@users_bp.route("/<int:user_id>", methods=["PUT"])
@roles_required(RoleEnum.ADMIN)
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found")

    schema = UserUpdateSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    if "first_name" in data:
        user.first_name = data["first_name"]
    if "last_name" in data:
        user.last_name = data["last_name"]
    if "role" in data:
        user.role = RoleEnum(data["role"])
    if "is_active" in data:
        user.is_active = data["is_active"]

    if "team_id" in data:
        _sync_team_membership(user, data["team_id"])

    db.session.commit()
    return jsonify(UserSchema().dump(user))


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@roles_required(RoleEnum.ADMIN)
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found")

    # Remove related records
    TimesheetEntry.query.filter_by(user_id=user.id).delete()
    TimesheetEntry.query.filter_by(reviewed_by=user.id).update({"reviewed_by": None})
    TeamMembership.query.filter_by(user_id=user.id).delete()
    Team.query.filter_by(lead_id=user.id).update({"lead_id": None})

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})
