from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_bcrypt import Bcrypt
import pymysql

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

import os

def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    login_id = data.get("login_id")
    password = data.get("password")

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM users WHERE login_id=%s", (login_id,))
    user = cur.fetchone()
    db.close()

    if not user or not bcrypt.check_password_hash(user["password_hash"], password):
        return jsonify({"message": "Invalid ID or password"}), 401

    token = create_access_token(
    identity=str(user["id"]),        # 🔥 문자열로
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
