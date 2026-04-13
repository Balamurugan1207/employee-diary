from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api import auth_bp
from app.extensions import db
from app.schemas import LoginSchema, ChangePasswordSchema, UserSchema
from app.services.auth_service import authenticate, generate_tokens, change_password
from app.decorators.auth import get_current_user
from app.utils.errors import ValidationError
from marshmallow import ValidationError as MarshmallowValidationError


@auth_bp.route("/login", methods=["POST"])
def login():
    schema = LoginSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    user = authenticate(data["email"], data["password"])
    access_token, refresh_token = generate_tokens(user)

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": UserSchema().dump(user),
    })


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    from app.models.user import User

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        raise ValidationError("Invalid user")

    access_token, refresh_token = generate_tokens(user)
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    return jsonify(UserSchema().dump(user))


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password_route():
    schema = ChangePasswordSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    user = get_current_user()
    change_password(user, data["old_password"], data["new_password"])
    db.session.commit()
    return jsonify({"message": "Password changed successfully"})
