from flask import jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError as MarshmallowValidationError

from app.api import clients_bp
from app.extensions import db
from app.models.user import RoleEnum
from app.models.client import Client
from app.schemas import ClientSchema, ClientCreateSchema
from app.decorators.auth import roles_required
from app.utils.errors import ValidationError, NotFoundError, ConflictError


@clients_bp.route("", methods=["GET"])
@jwt_required()
def list_clients():
    clients = Client.query.filter_by(is_active=True).order_by(Client.name).all()
    return jsonify(ClientSchema(many=True).dump(clients))


@clients_bp.route("", methods=["POST"])
@roles_required(RoleEnum.ADMIN)
def create_client():
    schema = ClientCreateSchema()
    try:
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        raise ValidationError("Invalid input", details=e.messages)

    if Client.query.filter_by(name=data["name"]).first():
        raise ConflictError("Client name already exists")

    client = Client(**data)
    db.session.add(client)
    db.session.commit()
    return jsonify(ClientSchema().dump(client)), 201


@clients_bp.route("/<int:client_id>", methods=["PUT"])
@roles_required(RoleEnum.ADMIN)
def update_client(client_id):
    client = Client.query.get(client_id)
    if not client:
        raise NotFoundError("Client not found")

    data = request.get_json()
    if "name" in data:
        existing = Client.query.filter_by(name=data["name"]).first()
        if existing and existing.id != client_id:
            raise ConflictError("Client name already exists")
        client.name = data["name"]
    if "is_active" in data:
        client.is_active = data["is_active"]

    db.session.commit()
    return jsonify(ClientSchema().dump(client))


@clients_bp.route("/<int:client_id>", methods=["DELETE"])
@roles_required(RoleEnum.ADMIN)
def delete_client(client_id):
    client = Client.query.get(client_id)
    if not client:
        raise NotFoundError("Client not found")
    client.is_active = False
    db.session.commit()
    return jsonify({"message": "Client deactivated"})
