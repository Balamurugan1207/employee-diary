from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User
from app.utils.errors import ForbiddenError, UnauthorizedError


def roles_required(*allowed_roles):
    """Decorator to restrict access to specific roles.

    Usage: @roles_required(RoleEnum.ADMIN, RoleEnum.TEAM_LEAD)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            if not user or not user.is_active:
                raise UnauthorizedError("Invalid user")
            if user.role not in allowed_roles:
                raise ForbiddenError("Insufficient permissions")
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        raise UnauthorizedError("Invalid user")
    return user
