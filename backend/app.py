print("🔥 app.py 실행됨!")
import os
os.environ.pop("DATABASE_URL", None)
os.environ.pop("MYSQL_URL", None)
os.environ.pop("JAWSDB_URL", None)

from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db, Invoice, PackingList
from config import Config
from sqlalchemy import text
print("🔥 Flask 실제 연결 DB:", Config.SQLALCHEMY_DATABASE_URI)

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)


@app.route("/")
def home():
    return "Flask + MySQL Connected!"


# ============================================
# 🔥 1) 모든 invoice 조회 (GET)
# ============================================
@app.route("/api/invoices", methods=["GET"])
def get_invoices():
    invoices = Invoice.query.all()
    return jsonify([
        {
            "id": i.id,
            "inv_no": i.inv_no,
            "exporter": i.exporter,
            "amount": i.amount,
            "item_type": i.item_type,
            "cont_no": i.cont_no,
            "bl_no": i.bl_no,
            "etd": i.etd,
            "eta": i.eta,
            "delayed_date": i.delayed_date,
            "count_days": i.count_days,
            "needs_help": i.needs_help,
            "remark": i.remark
        }
        for i in invoices
    ])


# ============================================
# 🔥 2) invoice 생성 (POST)
# ============================================
@app.route("/api/invoices", methods=["POST"])
def create_invoice():
    data = request.json
    inv = Invoice(**data)
    db.session.add(inv)
    db.session.commit()

    return jsonify({
        "id": inv.id,
        **data
    }), 201


# ============================================
# 🔥 3) invoice 수정 (PUT)
# ============================================
@app.route("/api/invoices/<int:id>", methods=["PUT"])
def update_invoice(id):
    invoice = Invoice.query.get_or_404(id)
    data = request.json

    for key, value in data.items():
        setattr(invoice, key, value)

    db.session.commit()
    return jsonify({"message": "updated"})


# ============================================
# 🔥 4) invoice 삭제 (DELETE by ID)
# ============================================
@app.route("/api/invoices/<int:id>", methods=["DELETE"])
def delete_invoice(id):
    invoice = Invoice.query.get_or_404(id)
    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔥 4-1) invoice 삭제 (DELETE by INV_NO)
# ============================================
@app.route("/api/invoices/inv/<inv_no>", methods=["DELETE"])
def delete_invoice_by_inv(inv_no):
    invoice = Invoice.query.filter_by(inv_no=inv_no).first()

    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    db.session.delete(invoice)
    db.session.commit()

    return jsonify({"message": "Deleted", "inv_no": inv_no})


# ============================================
# 🔥 5) 모든 packing_list 조회 (JOIN 포함)
# ============================================
@app.route("/api/packing", methods=["GET"])
def get_all_packing():
    rows = db.session.query(PackingList, Invoice.inv_no).join(
        Invoice, PackingList.invoice_id == Invoice.id
    ).all()

    result = []
    for p, inv_no in rows:
        result.append({
            "id": p.id,
            "invoice_id": p.invoice_id,
            "inv_no": inv_no,
            "po_no": p.po_no,
            "vendor": p.vendor,
            "part_no": p.part_no,
            "part_name": p.part_name,
            "spec": p.spec,
            "qty": p.qty,
            "unit": p.unit
        })

    return jsonify(result)


# ============================================
# 🔥 6) 특정 invoice_no 기준 packing list 조회
# ============================================
@app.route("/api/invoice/<string:inv_no>/packing", methods=["GET"])
def get_packing_by_inv(inv_no):
    print("🔥 Flask 받은 inv_no:", repr(inv_no))

    invoice = Invoice.query.filter_by(inv_no=inv_no).first_or_404()
    print("🔥 invoice 검색 결과:", invoice)

    rows = PackingList.query.filter_by(invoice_id=invoice.id).all()
    print("🔥 packing rows:", rows)

    return jsonify([
        {
            "id": r.id,
            "invoice_id": r.invoice_id,
            "po_no": r.po_no,
            "vendor": r.vendor,
            "part_no": r.part_no,
            "part_name": r.part_name,
            "spec": r.spec,
            "qty": r.qty,
            "unit": r.unit
        }
        for r in rows
    ])



# packing 추가 (POST)
@app.route("/api/packing", methods=["POST"])
def create_packing():
    data = request.json
    row = PackingList(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id, **data}), 201

#packing 수정 (PUT)
@app.route("/api/packing/<int:id>", methods=["PUT"])
def update_packing(id):
    row = PackingList.query.get_or_404(id)
    data = request.json

    for key, value in data.items():
        setattr(row, key, value)

    db.session.commit()
    return jsonify({"message": "updated"})


#packing 삭제 (DELETE)
@app.route("/api/packing/<int:id>", methods=["DELETE"])
def delete_packing(id):
    row = PackingList.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})

@app.route("/debug/invoices")
def debug_invoices():
    rows = Invoice.query.all()
    return jsonify([
        {
            "id": r.id,
            "exporter": r.exporter,
            "inv_no": r.inv_no,
            "amount": r.amount,
            "item_type": r.item_type,
            "cont_no": r.cont_no,
            "bl_no": r.bl_no,
            "etd": r.etd,
            "eta": r.eta,
            "delayed_date": r.delayed_date,
            "count_days": r.count_days,
            "needs_help": r.needs_help,
            "remark": r.remark
        }
        for r in rows
    ])




@app.before_request
def test_db():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception as e:
        print("🔥 DB 연결 실패:", e)


@app.route("/debug/raw")
def raw_test():
    rows = db.session.execute(db.text("SELECT * FROM invoice")).fetchall()
    return jsonify([dict(r._mapping) for r in rows])

@app.route("/debug/invoice/<inv_no>")
def debug_invoice(inv_no):
    invoice = Invoice.query.filter_by(inv_no=inv_no).first()
    return {
        "inv_no": inv_no,
        "invoice_id": invoice.id if invoice else None
    }
    # ============================================
# 🔥 단일 invoice 조회 (React에서 사용하는 API)
# ============================================
@app.route("/api/invoice/<string:inv_no>", methods=["GET"])
def get_invoice_by_inv_no(inv_no):
    invoice = Invoice.query.filter_by(inv_no=inv_no).first()

    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    return jsonify({
        "id": invoice.id,
        "inv_no": invoice.inv_no,
        "exporter": invoice.exporter,
        "amount": invoice.amount,
        "item_type": invoice.item_type,
        "cont_no": invoice.cont_no,
        "bl_no": invoice.bl_no,
        "etd": invoice.etd,
        "eta": invoice.eta,
        "delayed_date": invoice.delayed_date,
        "count_days": invoice.count_days,
        "needs_help": invoice.needs_help,
        "remark": invoice.remark,
    })
@app.route("/api/packing/max-id", methods=["GET"])
def get_packing_max_id():
    max_id = db.session.query(db.func.max(PackingList.id)).scalar()
    if max_id is None:
        max_id = 0
    return jsonify({"max_id": max_id})

# ============================================
# 서버 실행
# ============================================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)