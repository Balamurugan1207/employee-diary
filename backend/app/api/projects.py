from flask import jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError as MarshmallowValidationError

from app.api import projects_bp
from app.extensions import db
from app.models.user import RoleEnum
from app.models.project import Project
from app.schemas import ProjectSchema, ProjectCreateSchema
from app.decorators.auth import roles_required
from app.utils.errors import ValidationError, NotFoundError, ConflictError


@projects_bp.route("", methods=["GET"])
@jwt_required()
def list_projects():
    projects = Project.query.filter_by(is_active=True).order_by(Project.name).all()
    return jsonify(ProjectSchema(many=True).dump(projects))


@projects_bp.route("", methods=["POST"])
@roles_required(RoleEnum.ADMIN)
def create_project():
    schema = ProjectCreateSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    if Project.query.filter_by(code=data["code"]).first():
        raise ConflictError("Project code already exists")

    project = Project(**data)
    db.session.add(project)
    db.session.commit()
    return jsonify(ProjectSchema().dump(project)), 201


@projects_bp.route("/<int:project_id>", methods=["PUT"])
@roles_required(RoleEnum.ADMIN)
def update_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        raise NotFoundError("Project not found")

    data = request.get_json()
    if "name" in data:
        project.name = data["name"]
    if "code" in data:
        existing = Project.query.filter_by(code=data["code"]).first()
        if existing and existing.id != project_id:
            raise ConflictError("Project code already exists")
        project.code = data["code"]
    if "client_id" in data:
        project.client_id = data["client_id"]

    db.session.commit()
    return jsonify(ProjectSchema().dump(project))


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@roles_required(RoleEnum.ADMIN)
def delete_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        raise NotFoundError("Project not found")
    project.is_active = False
    db.session.commit()
    return jsonify({"message": "Project deactivated"})
