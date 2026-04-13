from flask import Blueprint

auth_bp = Blueprint("auth", __name__)
users_bp = Blueprint("users", __name__)
timesheets_bp = Blueprint("timesheets", __name__)
projects_bp = Blueprint("projects", __name__)
clients_bp = Blueprint("clients", __name__)
teams_bp = Blueprint("teams", __name__)
webhooks_bp = Blueprint("webhooks", __name__)
reports_bp = Blueprint("reports", __name__)
dashboard_bp = Blueprint("dashboard", __name__)

from app.api import auth, users, timesheets, projects, clients, teams, webhooks, reports, dashboard  # noqa
