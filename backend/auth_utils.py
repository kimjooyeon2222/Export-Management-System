from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()   # 🔥 role은 여기 있음

        if claims.get("role") != "admin":
            return jsonify({"message": "Admin only"}), 403

        return fn(*args, **kwargs)

    return wrapper
