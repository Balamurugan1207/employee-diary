from flask import Flask
from app.config import Config
from app.extensions import db, migrate, jwt, cors, ma


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": "*"}})
    ma.init_app(app)

    # Import models so they are registered with SQLAlchemy
    from app import models  # noqa

    # Register blueprints
    from app.api import (
        auth_bp, users_bp, timesheets_bp, projects_bp,
        clients_bp, teams_bp, webhooks_bp, reports_bp, dashboard_bp,
    )
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(timesheets_bp, url_prefix="/api/timesheets")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(clients_bp, url_prefix="/api/clients")
    app.register_blueprint(teams_bp, url_prefix="/api/teams")
    app.register_blueprint(webhooks_bp, url_prefix="/api/webhooks")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # Register error handlers
    from app.utils.errors import register_error_handlers
    register_error_handlers(app)

    # Start scheduler (missed entry reminders)
    if not app.config.get("TESTING"):
        from app.tasks.scheduler import init_scheduler
        init_scheduler(app)

    return app
