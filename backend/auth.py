from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_bcrypt import Bcrypt
from sqlalchemy import text
from models import db

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    login_id = data.get("login_id")
    password = data.get("password")

    result = db.session.execute(
        text("""
            SELECT id, login_id, password_hash, role, company
            FROM users
            WHERE login_id = :login_id
        """),
        {"login_id": login_id}
    ).fetchone()

    if not result:
        return jsonify({"message": "Invalid ID or password"}), 401

    user = dict(result._mapping)

    if not bcrypt.check_password_hash(user["password_hash"], password):
        return jsonify({"message": "Invalid ID or password"}), 401

    token = create_access_token(
        identity=str(user["id"]),
        additional_claims={
            "role": user["role"],
            "company": user.get("company")
        }
    )

    return jsonify({
        "access_token": token,
        "role": user["role"],
        "company": user.get("company")
    })
