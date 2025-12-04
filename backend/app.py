print("🔥 app.py 실행됨!")
import os
os.environ.pop("DATABASE_URL", None)
os.environ.pop("MYSQL_URL", None)
os.environ.pop("JAWSDB_URL", None)

from models import OilScheduleRow
from models import OilItemList

from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db, Invoice, PackingList, StockSetting, StockItem, ScheduleRow
from config import Config
from sqlalchemy import text
print("🔥 Flask 실제 연결 DB:", Config.SQLALCHEMY_DATABASE_URI)

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)

from datetime import datetime

def calc_status(etd, eta):
    today = datetime.today().date()

    # ETA 값 없음
    if not eta or eta == "일정 없음":
        return "부산항 미입고"

    try:
        etd_date = datetime.strptime(etd, "%Y-%m-%d").date() if etd else None
        eta_date = datetime.strptime(eta, "%Y-%m-%d").date() if eta else None
    except:
        return ""

    if eta_date < today:
        return "입고완료"
    if etd_date and etd_date > today:
        return "선적대기중"

    return "운항중"


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
            "sort_order":i.sort_order,
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
    status = calc_status(invoice.etd, invoice.eta)
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
        "status": status,      # ⭐⭐⭐⭐ 추가된 줄
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

@app.route("/api/invoices/sort", methods=["PUT"])
def update_sort_order():
    data = request.json  # [{id:1, sort_order:1}, ...]

    for item in data:
        db.session.query(Invoice).filter_by(id=item["id"]).update({
            "sort_order": item["sort_order"]
        })

    db.session.commit()
    return jsonify({"message": "sort_order updated"})


# ============================================
# 🔥 STOCK SETTING API
# ============================================

@app.route("/api/stock-setting", methods=["GET"])
def get_stock_setting():
    row = StockSetting.query.order_by(StockSetting.id.desc()).first()
    if not row:
        return jsonify({})

    return jsonify({
        "id": row.id,
        "target_stock": row.target_stock,
        "writer": row.writer,
        "us_date": row.us_date.strftime("%Y-%m-%d") if row.us_date else None,
        "updated_at": row.updated_at.strftime("%Y-%m-%d %H:%M:%S")
    })




@app.route("/api/stock-setting/<int:id>", methods=["PUT"])
def update_stock_setting(id):
    row = StockSetting.query.get_or_404(id)
    data = request.json
    for k, v in data.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/stock-setting/<int:id>", methods=["DELETE"])
def delete_stock_setting(id):
    row = StockSetting.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔥 STOCK ITEM API
# ============================================

@app.route("/api/stock-items", methods=["GET"])
def get_stock_items():
    rows = StockItem.query.all()
    return jsonify([
        {
            "id": r.id,
            "item_name": r.item_name,
            "over_stock": r.over_stock,
            "defect": r.defect,
            "normal_stock": r.normal_stock,
            "updated_at": r.updated_at
        }
        for r in rows
    ])


@app.route("/api/stock-items", methods=["POST"])
def create_stock_item():
    data = request.json
    row = StockItem(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201


@app.route("/api/stock-items/<int:id>", methods=["PUT"])
def update_stock_item(id):
    row = StockItem.query.get_or_404(id)
    data = request.json
    for k, v in data.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/stock-items/<int:id>", methods=["DELETE"])
def delete_stock_item(id):
    row = StockItem.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔥 SCHEDULE ROW API
# ============================================

@app.route("/api/schedule-rows", methods=["GET"])
def get_schedule_rows():
    rows = ScheduleRow.query.all()
    return jsonify([
        {
            "id": r.id,
            "inv_no": r.inv_no,
            "no": r.no,
            "status": r.status,
            "etd": r.etd,
            "eta": r.eta,
            "month_depart": r.month_depart,
            "month_arrive": r.month_arrive,
            "mq4_gear": r.mq4_gear,
            "mq4_pinion": r.mq4_pinion,
            "nx4_gear": r.nx4_gear,
            "nx4_pinion": r.nx4_pinion,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in rows
    ])


@app.route("/api/schedule-rows", methods=["POST"])
def create_schedule_row():
    data = request.json
    row = ScheduleRow(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201


@app.route("/api/schedule-rows/<int:id>", methods=["PUT"])
def update_schedule_row(id):
    row = ScheduleRow.query.get_or_404(id)
    data = request.json
    for k, v in data.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/schedule-rows/<int:id>", methods=["DELETE"])
def delete_schedule_row(id):
    row = ScheduleRow.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})



@app.route("/api/stock-setting", methods=["POST"])
def save_stock_setting():
    data = request.json

    setting = StockSetting.query.first()
    if not setting:
        setting = StockSetting()

    setting.target_stock = data.get("target_stock")
    setting.writer = data.get("writer")

    us_date_str = data.get("us_date")
    if us_date_str:
        setting.us_date = datetime.strptime(us_date_str, "%Y-%m-%d").date()

    db.session.add(setting)
    db.session.commit()

    return jsonify({"message": "saved"})


@app.route("/api/stock-item/bulk", methods=["POST"])
def save_stock_items():
    items = request.json  # 리스트

    for item in items:
        db_item = StockItem.query.filter_by(item_name=item["name"]).first()

        if not db_item:
            db_item = StockItem(item_name=item["name"])

        db_item.over_stock = item["overStock"]
        db_item.defect = item["defect"]
        db_item.normal_stock = item["normalStock"]

        db.session.add(db_item)

    db.session.commit()
    return jsonify({"message": "saved"})
@app.route("/api/schedule-row/bulk", methods=["POST"])
def save_schedule_rows():
    rows = request.json  # 리스트

    # 기존 데이터 삭제
    ScheduleRow.query.delete()

    for row in rows:
        db_row = ScheduleRow(
            inv_no=row.get("inv_no"),
            no=row.get("no"),
            status=row.get("status"),
            etd=row.get("etd"),
            eta=row.get("eta"),
            month_depart=row.get("month_depart"),
            month_arrive=row.get("month_arrive"),

            # ⭐ React가 보내는 key랑 맞춰줌
            mq4_gear = int(row.get("mq4_gear", 0)),
            mq4_pinion = int(row.get("mq4_pinion", 0)),
            nx4_gear = int(row.get("nx4_gear", 0)),
            nx4_pinion = int(row.get("nx4_pinion", 0)),
        )

        db.session.add(db_row)

    db.session.commit()
    return jsonify({"message": "saved"})

# oil_schedule_row 전체 불러오기 API
# GET /api/oil-schedule
@app.route("/api/oil-schedule", methods=["GET"])
def get_oil_schedule():
    rows = (
        OilScheduleRow.query
        .order_by(
            OilScheduleRow.inv_no.asc(),   # 🔥 invoice별 그룹
            OilScheduleRow.seq.asc()       # 🔥 seq 1~N 순서대로
        )
        .all()
    )

    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "inv_no": r.inv_no,
            "po_no": r.po_no,
            "etd": r.etd,
            "eta": r.eta,
            "seq": r.seq,
            "qty": r.qty
        })

    return jsonify(result)


#oil_schedule_row 저장 (bulk 저장) API

# POST /api/oil-schedule/bulk
@app.route("/api/oil-schedule/bulk", methods=["POST"])
def save_oil_schedule_bulk():
    data = request.get_json()

    # 기존 전체 삭제 후 새로 저장
    OilScheduleRow.query.delete()

    for r in data:
        row = OilScheduleRow(
            inv_no=r.get("inv_no"),
            po_no=r.get("po_no"),
            etd=r.get("etd"),
            eta=r.get("eta"),
            seq=r.get("seq"),
            qty=r.get("qty")
        )
        db.session.add(row)

    db.session.commit()
    return jsonify({"message": "saved"})

#특정 INV 입력 시 자동로드 API 

# GET /api/oil-invoice/<inv_no>
@app.route("/api/oil-invoice/<inv_no>", methods=["GET"])
def get_oil_invoice(inv_no):
    # 1) invoice 테이블에서 inv_no 조회
    inv = Invoice.query.filter_by(inv_no=inv_no).first()

    if not inv:
        return jsonify({"error": "Invoice not found"}), 404

    # 2) packing_list에서 invoice_id 로 PO 번호 조회
    packing = PackingList.query.filter_by(invoice_id=inv.id).first()

    po_no = packing.po_no if packing else None

    # 3) invoice + packing_list 데이터 함께 반환
    return jsonify({
        "inv_no": inv.inv_no,
        "po_no": po_no,
        "etd": inv.etd,
        "eta": inv.eta
    })


# GET /api/oil-items
@app.route("/api/oil-items", methods=["GET"])
def get_oil_items():
    rows = OilItemList.query.order_by(OilItemList.no.asc()).all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/oil-items/bulk", methods=["POST"])
def save_oil_items():
    data = request.json  # 리스트 형태

    OilItemList.query.delete()

    for row in data:
        item = OilItemList(
            no=row["no"],
            code=row["code"],
            name=row["name"],
            spec=row["spec"],
        )
        db.session.add(item)

    db.session.commit()
    return jsonify({"message": "saved"})

@app.route("/api/axle", methods=["GET"])
def get_axle_inventory():
    rows = AxleInventory.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/axle/<int:id>", methods=["PUT"])
def update_axle_item(id):
    row = AxleInventory.query.get_or_404(id)
    data = request.json

    for k, v in data.items():
        setattr(row, k, v)

    db.session.commit()
    return jsonify({"message": "updated"})

@app.route("/api/axle", methods=["POST"])
def create_axle_item():
    data = request.json
    row = AxleInventory(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201

@app.route("/api/axle-schedule", methods=["GET"])
def get_axle_schedule():
    rows = AxleSchedule.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/axle-schedule", methods=["POST"])
def create_axle_schedule():
    data = request.json
    row = AxleSchedule(inv_no=data["inv_no"])
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201


@app.route("/api/axle-schedule/<int:id>", methods=["DELETE"])
def delete_axle_schedule(id):
    row = AxleSchedule.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 서버 실행
# ============================================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)