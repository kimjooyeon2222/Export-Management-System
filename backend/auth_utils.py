from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
    get_jwt_identity
)
from sqlalchemy import text
from models import db


# =====================================================
# 🔐 ADMIN ONLY (최상위 권한)
# =====================================================
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):

        # 🔥 CORS preflight 요청은 무조건 통과
        if request.method == "OPTIONS":
            return "", 200

        # 🔐 JWT 검증
        verify_jwt_in_request()
        claims = get_jwt()

        if claims.get("role") != "admin":
            return jsonify({"message": "Admin only"}), 403

        return fn(*args, **kwargs)

    return wrapper


# =====================================================
# 🔐 PAGE + ACTION 권한 (RBAC)
# =====================================================
def permission_required(page_code, action="read", company_check=False):
    """
    page_code: 'INVOICE', 'PO', 'STOCK_AUDIT', ...
    action: 'read' | 'write' | 'delete'
    company_check: True면 회사(company) 일치 여부까지 검사
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):

            # 🔥 CORS preflight 요청은 무조건 통과
            if request.method == "OPTIONS":
                return "", 200

            # 🔐 JWT 검증
            verify_jwt_in_request()
            claims = get_jwt()
            user_id = get_jwt_identity()

            # 🔥 1) admin은 모든 권한 통과
            if claims.get("role") == "admin":
                return fn(*args, **kwargs)

            # 🔥 2) action → 컬럼 매핑
            col_map = {
                "read": "can_read",
                "write": "can_write",
                "delete": "can_delete",
            }

            if action not in col_map:
                return jsonify({"message": "Invalid permission action"}), 400

            col = col_map[action]

            # 🔥 3) user_permissions 테이블 조회
            row = db.session.execute(
                text(f"""
                    SELECT {col}
                    FROM user_permissions
                    WHERE user_id = :uid
                      AND page_code = :page
                """),
                {
                    "uid": user_id,
                    "page": page_code
                }
            ).fetchone()

            if not row or row[0] != 1:
                return jsonify({"message": "Permission denied"}), 403

            # 🔥 4) 회사(company) 체크 (선택)
            if company_check:
                token_company = claims.get("company")

                target_company = (
                    kwargs.get("company")
                    or kwargs.get("company_name")
                    or (request.json or {}).get("company")
                    or request.args.get("company")
                )

                if target_company and token_company != target_company:
                    return jsonify({"message": "Company mismatch"}), 403

            return fn(*args, **kwargs)

        return wrapper
    return decorator
