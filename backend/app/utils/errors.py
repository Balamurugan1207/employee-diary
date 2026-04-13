from flask import jsonify


class AppError(Exception):
    def __init__(self, message, status_code, error_type="error"):
        self.message = message
        self.status_code = status_code
        self.error_type = error_type


class ValidationError(AppError):
    def __init__(self, message="Validation failed", details=None):
        super().__init__(message, 400, "validation_error")
        self.details = details or {}


class UnauthorizedError(AppError):
    def __init__(self, message="Unauthorized"):
        super().__init__(message, 401, "unauthorized")


class ForbiddenError(AppError):
    def __init__(self, message="Forbidden"):
        super().__init__(message, 403, "forbidden")


class NotFoundError(AppError):
    def __init__(self, message="Resource not found"):
        super().__init__(message, 404, "not_found")


class ConflictError(AppError):
    def __init__(self, message="Conflict"):
        super().__init__(message, 409, "conflict")


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = {
            "error": {
                "code": error.status_code,
                "type": error.error_type,
                "message": error.message,
            }
        }
        if hasattr(error, "details") and error.details:
            response["error"]["details"] = error.details
        return jsonify(response), error.status_code

    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({"error": {"code": 404, "type": "not_found", "message": "Not found"}}), 404

    @app.errorhandler(500)
    def handle_500(error):
        return jsonify({"error": {"code": 500, "type": "server_error", "message": "Internal server error"}}), 500
