from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User
from app.utils.errors import UnauthorizedError, ValidationError


def authenticate(email, password):
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        raise UnauthorizedError("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedError("Account is deactivated")
    return user


def generate_tokens(user):
    additional_claims = {
        "role": user.role.value,
        "email": user.email,
        "full_name": user.full_name,
    }
    access_token = create_access_token(
        identity=str(user.id), additional_claims=additional_claims
    )
    refresh_token = create_refresh_token(
        identity=str(user.id), additional_claims=additional_claims
    )
    return access_token, refresh_token


def change_password(user, old_password, new_password):
    if not user.check_password(old_password):
        raise ValidationError("Current password is incorrect")
    if len(new_password) < 8:
        raise ValidationError("New password must be at least 8 characters")
    user.set_password(new_password)
