print("🔥 app.py 실행됨!")
from dotenv import load_dotenv
load_dotenv()

import os
from auth_utils import admin_required
from flask_jwt_extended import jwt_required
from models import ItemMaster
from sqlalchemy import asc


from models import OilScheduleRow
from models import OilItemList
from models import EvInventory, EvSchedule, EvSetting
from models import POManagement, POSetting
from models import POSubRow 

from models import DashboardMemo

from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db, Invoice, PackingList, StockSetting, StockItem, ScheduleRow

from models import AxleInventory, AxleSchedule
from models import AxleSetting
from datetime import datetime

from flask_jwt_extended import JWTManager
from auth import auth_bp

def to_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except:
        return None


from sqlalchemy import text
print("🔥 Flask 실제 연결 DB:", Config.SQLALCHEMY_DATABASE_URI)

app = Flask(__name__)
app.config.from_object(Config)


jwt = JWTManager(app)   # ⭐ 이 줄 필수


CORS(
    app,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"]
)

db.init_app(app)

# 🔑 auth blueprint 등록
app.register_blueprint(auth_bp, url_prefix="/api/auth")
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
@jwt_required()

def home():
    return "Flask + MySQL Connected!"


# ============================================
# 🔥 1) 모든 invoice 조회 (GET)
# ============================================
@app.route("/api/invoices", methods=["GET"])
@jwt_required()
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
@jwt_required()
@admin_required
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
@jwt_required()
@admin_required
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
@jwt_required()
@admin_required
def delete_invoice(id):
    invoice = Invoice.query.get_or_404(id)
    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔥 4-1) invoice 삭제 (DELETE by INV_NO)
# ============================================
@app.route("/api/invoices/inv/<inv_no>", methods=["DELETE"])
@jwt_required()
@admin_required
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
@jwt_required()
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
@jwt_required()

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
@jwt_required()
@admin_required
def create_packing():
    data = request.json
    row = PackingList(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id, **data}), 201

#packing 수정 (PUT)
@app.route("/api/packing/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_packing(id):
    row = PackingList.query.get_or_404(id)
    data = request.json

    for key, value in data.items():
        setattr(row, key, value)

    db.session.commit()
    return jsonify({"message": "updated"})


#packing 삭제 (DELETE)
@app.route("/api/packing/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_packing(id):
    row = PackingList.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})

@app.route("/debug/invoices")
@jwt_required()
@admin_required

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
def debug_auth():
    print("🔥 Authorization:", request.headers.get("Authorization"))
def test_db():
    try:
        db.session.execute(text("SELECT 1"))
    except Exception as e:
        print("🔥 DB 연결 실패:", e)


@app.route("/debug/raw")
@jwt_required()
@admin_required
def raw_test():
    rows = db.session.execute(db.text("SELECT * FROM invoice")).fetchall()
    return jsonify([dict(r._mapping) for r in rows])

@app.route("/debug/invoice/<inv_no>")
@jwt_required()
@admin_required

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
@jwt_required()

def get_invoice_by_inv_no(inv_no):
    invoice = Invoice.query.filter_by(inv_no=inv_no).first()

    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    # 🔥 딜레이된 날짜를 ETA처럼 처리
    eta_value = invoice.delayed_date

    # status 계산 (delayed_date 기준)
    today = datetime.today().date()
    if eta_value:
        eta_date = datetime.strptime(eta_value, "%Y-%m-%d").date()
    else:
        eta_date = None

    if not eta_date:
        status = "부산항 미입고"
    elif eta_date < today:
        status = "입고완료"
    else:
        status = "운항중"

    return jsonify({
        "id": invoice.id,
        "inv_no": invoice.inv_no,
        "exporter": invoice.exporter,
        "amount": invoice.amount,
        "item_type": invoice.item_type,
        "cont_no": invoice.cont_no,
        "bl_no": invoice.bl_no,

        # 🔥 ETA 대신 delayed_date 사용!!
        "eta": invoice.delayed_date,
        "etd": invoice.etd,

        "status": status,
        "delayed_date": invoice.delayed_date,
        "count_days": invoice.count_days,
        "needs_help": invoice.needs_help,
        "remark": invoice.remark,
    })

@app.route("/api/packing/max-id", methods=["GET"])
@jwt_required()

def get_packing_max_id():
    max_id = db.session.query(db.func.max(PackingList.id)).scalar()
    if max_id is None:
        max_id = 0
    return jsonify({"max_id": max_id})

@app.route("/api/invoices/sort", methods=["PUT"])
@jwt_required()
@admin_required
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
@jwt_required()

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
@jwt_required()
@admin_required
def update_stock_setting(id):
    row = StockSetting.query.get_or_404(id)
    data = request.json
    for k, v in data.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/stock-setting/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_stock_setting(id):
    row = StockSetting.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔥 STOCK ITEM API
# ============================================

@app.route("/api/stock-items", methods=["GET"])
@jwt_required()

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
@jwt_required()
@admin_required
def create_stock_item():
    data = request.json
    row = StockItem(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201


@app.route("/api/stock-items/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_stock_item(id):
    row = StockItem.query.get_or_404(id)
    data = request.json
    for k, v in data.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/stock-items/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_stock_item(id):
    row = StockItem.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔥 SCHEDULE ROW API
# ============================================

@app.route("/api/schedule-rows", methods=["GET"])
@jwt_required()

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
@jwt_required()
@admin_required
def create_schedule_row():
    data = request.json
    row = ScheduleRow(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201


@app.route("/api/schedule-rows/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_schedule_row(id):
    row = ScheduleRow.query.get_or_404(id)
    data = request.json
    for k, v in data.items():
        setattr(row, k, v)
    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/schedule-rows/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_schedule_row(id):
    row = ScheduleRow.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})



@app.route("/api/stock-setting", methods=["POST"])
@jwt_required()
@admin_required
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
@jwt_required()
@admin_required
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
@jwt_required()
@admin_required
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
@jwt_required()

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
@jwt_required()
@admin_required
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
@jwt_required()

def get_oil_invoice(inv_no):
    inv = Invoice.query.filter_by(inv_no=inv_no).first()
    if not inv:
        return jsonify({"error": "Invoice not found"}), 404

    packings = PackingList.query.filter_by(invoice_id=inv.id).all()

    po_unique = []
    seen = set()
    for p in packings:
        if p.po_no not in seen:
            seen.add(p.po_no)
            po_unique.append(p.po_no)

    return jsonify({
        "inv_no": inv.inv_no,
        "po_no": po_unique,
        "etd": inv.etd,
        "eta": inv.delayed_date   # ⭐ 자동으로 딜레이 날짜 적용
    })



# GET /api/oil-items
@app.route("/api/oil-items", methods=["GET"])
@jwt_required()

def get_oil_items():
    rows = OilItemList.query.order_by(OilItemList.no.asc()).all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/oil-items/bulk", methods=["POST"])
@jwt_required()
@admin_required
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
@jwt_required()

def get_axle_inventory():
    rows = AxleInventory.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/axle/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_axle_item(id):
    row = AxleInventory.query.get_or_404(id)
    data = request.json

    for k, v in data.items():
        setattr(row, k, v)

    db.session.commit()
    return jsonify({"message": "updated"})

@app.route("/api/axle", methods=["POST"])
@jwt_required()
@admin_required
def create_axle_item():
    data = request.json
    row = AxleInventory(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201

@app.route("/api/axle-schedule", methods=["GET"])
@jwt_required()

def get_axle_schedule():
    rows = AxleSchedule.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/axle-schedule", methods=["POST"])
@jwt_required()
@admin_required
def create_axle_schedule():
    data = request.json
    row = AxleSchedule(inv_no=data["inv_no"])
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201


@app.route("/api/axle-schedule/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_axle_schedule(id):
    row = AxleSchedule.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})

@app.route("/api/axle-setting", methods=["GET"])
@jwt_required()

def get_axle_setting():
    setting = AxleSetting.query.first()
    if not setting:
        return jsonify({
            "target_stock": 0,
            "writer": "",
            "us_date": None
        })

    return jsonify({
        "target_stock": setting.target_stock,
        "writer": setting.writer,
        "us_date": setting.us_date.strftime("%Y-%m-%d") if setting.us_date else None
    })


@app.route("/api/axle-setting", methods=["PUT"])
@jwt_required()
@admin_required
def update_axle_setting():
    data = request.json

    setting = AxleSetting.query.first()
    if not setting:
        setting = AxleSetting()

    setting.target_stock = data.get("target_stock")
    setting.writer = data.get("writer")

    # 날짜는 안전하게 처리
    us_date = data.get("us_date")
    if us_date and us_date not in ["", None]:
        setting.us_date = datetime.strptime(us_date, "%Y-%m-%d").date()

    db.session.add(setting)
    db.session.commit()

    return jsonify({"message": "updated"})

@app.route("/api/packing-list/by-inv/<inv_no>")
@jwt_required()

def get_packing_list_by_inv(inv_no):
    try:
        # 1) invoice.id 찾기
        invoice = Invoice.query.filter_by(inv_no=inv_no).first()
        if not invoice:
            return jsonify([])   # 없으면 빈 배열 반환

        # 2) 해당 invoice_id의 packing_list 데이터 조회
        rows = PackingList.query.filter_by(invoice_id=invoice.id).all()

        result = [
            {
                "part_no": row.part_no,
                "part_name": row.part_name,
                "qty": row.qty
            }
            for row in rows
        ]

        return jsonify(result)

    except Exception as e:
        print("packing_list 조회 오류:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/axle-schedule/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_axle_schedule(id):
    row = AxleSchedule.query.get_or_404(id)
    data = request.json

    # React에서 보내는 모든 필드 업데이트
    for key in ["inv_no", "etd", "eta", "plug", "gasket", "dowel_pin", "plate"]:
        if key in data:
            setattr(row, key, data[key])

    db.session.commit()
    return jsonify({"message": "updated"})

# ============================================
# 🔥 AXLE SCHEDULE BULK SAVE API
# ============================================
@app.route("/api/axle-schedule/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_axle_schedule_bulk():
    rows = request.json  # React에서 보낸 배열

    # 기존 데이터 전부 삭제
    AxleSchedule.query.delete()

    # 새로운 데이터 삽입
    for r in rows:
        row = AxleSchedule(
            inv_no=r.get("inv_no"),

        )
        db.session.add(row)

    db.session.commit()
    return jsonify({"message": "saved"})



@app.route("/api/ev-inventory", methods=["GET"])
@jwt_required()

def get_ev_inventory():
    rows = EvInventory.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/ev-inventory/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_ev_inventory(id):
    row = EvInventory.query.get_or_404(id)
    data = request.json

    for k, v in data.items():
        setattr(row, k, v)

    db.session.commit()
    return jsonify({"message": "updated"})

@app.route("/api/ev-inventory", methods=["POST"])
@jwt_required()
@admin_required
def create_ev_inventory():
    data = request.json
    row = EvInventory(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201

@app.route("/api/ev-setting", methods=["GET"])
@jwt_required()

def get_ev_setting():
    setting = EvSetting.query.first()

    if not setting:
        return jsonify({
            "writer": "",
            "us_date": None
        })

    return jsonify({
        "writer": setting.writer,
        "us_date": setting.us_date.strftime("%Y-%m-%d") if setting.us_date else None
    })


@app.route("/api/ev-setting", methods=["PUT"])
@jwt_required()
@admin_required
def update_ev_setting():
    data = request.json

    setting = EvSetting.query.first()
    if not setting:
        setting = EvSetting()

    setting.writer = data.get("writer")

    us_date = data.get("us_date")
    if us_date and us_date not in ["", None]:
        setting.us_date = datetime.strptime(us_date, "%Y-%m-%d").date()

    db.session.add(setting)
    db.session.commit()

    return jsonify({"message": "updated"})

@app.route("/api/ev-schedule", methods=["GET"])
@jwt_required()

def get_ev_schedule():
    rows = EvSchedule.query.all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/ev-schedule", methods=["POST"])
@jwt_required()
@admin_required
def create_ev_schedule():
    data = request.json
    row = EvSchedule(inv_no=data["inv_no"])
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201

@app.route("/api/ev-schedule/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_ev_schedule(id):
    row = EvSchedule.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})


@app.route("/api/ev-schedule/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_ev_schedule_bulk():
    rows = request.json

    # 기존 전체 삭제
    EvSchedule.query.delete()

    # 새로 저장
    for r in rows:
        row = EvSchedule(inv_no=r.get("inv_no"))
        db.session.add(row)

    db.session.commit()
    return jsonify({"message": "saved"})

@app.route("/packing/find", methods=["POST"])
@jwt_required()
@admin_required
def find_item():
    data = request.json
    part_no = data.get("part_no")
    part_name = data.get("part_name")
    inv = data.get("invoice_id")

    item = PackingList.query.filter(
        PackingList.invoice_id == inv,
        PackingList.part_no == part_no
    ).first()

    return jsonify(item.to_dict() if item else {})


@app.route("/api/ev/packing-full/<inv_no>", methods=["GET"])
@jwt_required()

def get_ev_packing_full(inv_no):
    try:
        # 1) invoice 조회
        invoice = Invoice.query.filter_by(inv_no=inv_no).first()
        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        # 2) 상태 계산
        today = datetime.today().date()

        eta_value = invoice.delayed_date or invoice.eta
        eta_date = None
        if eta_value:
            try:
                eta_date = datetime.strptime(eta_value, "%Y-%m-%d").date()
            except:
                pass

        etd_date = None
        if invoice.etd:
            try:
                etd_date = datetime.strptime(invoice.etd, "%Y-%m-%d").date()
            except:
                pass

        # 상태 계산 로직
        if not eta_date:
            status = "부산항 미입고"
        elif eta_date < today:
            status = "입고완료"
        elif etd_date and etd_date > today:
            status = "선적대기중"
        else:
            status = "운항중"

        # 3) packing_list → qty 딕셔너리 생성
        pack_rows = PackingList.query.filter_by(invoice_id=invoice.id).all()

        qty_map = {}
        for r in pack_rows:
            qty_map[r.part_no] = int(r.qty) if r.qty else 0

        # 4) 최종 응답
        return jsonify({
            "inv_no": invoice.inv_no,
            "etd": invoice.etd,
            "eta": eta_value,
            "status": status,
            "qty_map": qty_map
        })

    except Exception as e:
        print("EV packing full API 오류:", e)
        return jsonify({"error": str(e)}), 500


# ============================================
# 🔵 BRACKET INVENTORY API
# ============================================

from models import BrInventory, BrSchedule, BrSetting


@app.route("/api/br-inventory", methods=["GET"])
@jwt_required()

def get_br_inventory():
    rows = BrInventory.query.all()
    return jsonify([r.to_dict() for r in rows])


@app.route("/api/br-inventory/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_br_inventory(id):
    row = BrInventory.query.get_or_404(id)
    data = request.json

    for k, v in data.items():
        setattr(row, k, v)

    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/br-inventory", methods=["POST"])
@jwt_required()
@admin_required
def create_br_inventory():
    data = request.json
    row = BrInventory(**data)
    db.session.add(row)
    db.session.commit()
    return jsonify({"id": row.id}), 201

# ============================================
# 🔵 BRACKET SETTING API
# ============================================

@app.route("/api/br-setting", methods=["GET"])
@jwt_required()

def get_br_setting():
    setting = BrSetting.query.first()

    if not setting:
        return jsonify({
            "target_stock": 0,
            "writer": "",
            "us_date": None
        })

    return jsonify({
        "target_stock": setting.target_stock,
        "writer": setting.writer,
        "us_date": setting.us_date.strftime("%Y-%m-%d") if setting.us_date else None
    })


@app.route("/api/br-setting", methods=["PUT"])
@jwt_required()
@admin_required
def update_br_setting():
    data = request.json

    setting = BrSetting.query.first()
    if not setting:
        setting = BrSetting()

    setting.target_stock = data.get("target_stock")
    setting.writer = data.get("writer")

    us_date = data.get("us_date")
    if us_date and us_date not in ["", None]:
        setting.us_date = datetime.strptime(us_date, "%Y-%m-%d").date()

    db.session.add(setting)
    db.session.commit()

    return jsonify({"message": "updated"})

# ============================================
# 🔵 BRACKET SCHEDULE API
# ============================================

@app.route("/api/br-schedule", methods=["GET"])
@jwt_required()

def get_br_schedule():
    rows = BrSchedule.query.all()
    return jsonify([r.to_dict() for r in rows])


@app.route("/api/br-schedule/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_br_schedule_bulk():
    rows = request.json  # React에서 보낸 배열

    # 기존 전체 삭제 후
    BrSchedule.query.delete()

    # 새로 저장
    for r in rows:
        row = BrSchedule(inv_no=r.get("inv_no"))
        db.session.add(row)

    db.session.commit()
    return jsonify({"message": "saved"})

@app.route("/api/br/auto-load/<inv_no>", methods=["GET"])
@jwt_required()

def br_auto_load(inv_no):
    try:
        # 1) invoice 조회
        invoice = Invoice.query.filter_by(inv_no=inv_no).first()
        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        today = datetime.today().date()

        # ETA = delayed_date 우선 사용
        eta_value = invoice.delayed_date or invoice.eta
        eta_date = None
        if eta_value:
            eta_date = datetime.strptime(eta_value, "%Y-%m-%d").date()

        # ETD
        etd_date = None
        if invoice.etd:
            etd_date = datetime.strptime(invoice.etd, "%Y-%m-%d").date()

        # 상태 계산
        if not eta_date:
            status = "부산항 미입고"
        elif eta_date < today:
            status = "입고완료"
        elif etd_date and etd_date > today:
            status = "선적대기중"
        else:
            status = "운항중"

        # 2) packing_list에서 qty 합산
        pack_rows = PackingList.query.filter_by(invoice_id=invoice.id).all()

        qty_map = {}
        for r in pack_rows:
            qty_map[r.part_no] = qty_map.get(r.part_no, 0) + int(r.qty or 0)

        # 3) 응답 반환
        return jsonify({
            "inv_no": invoice.inv_no,
            "etd": invoice.etd,
            "eta": eta_value,
            "status": status,
            "qty_map": qty_map
        })

    except Exception as e:
        print("BRACKET auto-load API 오류:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/po/setting", methods=["GET"])
@jwt_required()

def get_po_setting():
    setting = POSetting.query.first()
    if not setting:
        return jsonify({"us_date": None})

    return jsonify(setting.to_dict())


@app.route("/api/po/setting", methods=["PUT"])
@jwt_required()
@admin_required
def update_po_setting():
    data = request.json

    setting = POSetting.query.first()
    if not setting:
        setting = POSetting()

    us_date = data.get("us_date")
    if us_date:
        setting.us_date = datetime.strptime(us_date, "%Y-%m-%d").date()

    db.session.add(setting)
    db.session.commit()

    return jsonify({"message": "updated"})


@app.route("/api/po", methods=["GET"])
@jwt_required()

def get_po():
    rows = POManagement.query.order_by(POManagement.id.asc()).all()
    return jsonify([r.to_dict() for r in rows])


@app.route("/api/po/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_po_bulk():
    rows = request.json

    POManagement.query.delete()
    POSubRow.query.delete()

    for r in rows:
        row = POManagement(
            po_no=r.get("po_no"),
            order_date=to_date(r.get("order_date")),
            request_date=to_date(r.get("request_date")),
            ototek_date=to_date(r.get("ototek_date")),
            manager=r.get("manager"),
            company=r.get("company"),
            subject=r.get("subject"),
            method=r.get("method"),
        )
        db.session.add(row)
        db.session.flush()   # ⭐ PK(id)를 즉시 생성해 줌

        # ★ subrows 저장
        for s in r.get("subrows", []):
            sub = POSubRow(
                po_id=row.id,
                request_date=to_date(s.get("request_date")),
                ototek_date=to_date(s.get("ototek_date")),
                company=s.get("company"),
            )
            db.session.add(sub)

    db.session.commit()
    return jsonify({"message": "saved"})



@app.route("/memo", methods=["GET"])
@jwt_required()

def get_dashboard_memo():
    memo = DashboardMemo.query.first()

    if memo:
        return jsonify(memo.to_dict())   # user_date 자동 포함
    else:
        return jsonify({"id": None, "text": "", "user_date": ""})



@app.route("/memo", methods=["POST"])
@jwt_required()
@admin_required
def update_dashboard_memo():
    data = request.json

    new_text = data.get("text", "")
    new_user_date = data.get("user_date", "")

    memo = DashboardMemo.query.first()

    if not memo:
        memo = DashboardMemo(text=new_text, user_date=new_user_date)
        db.session.add(memo)
    else:
        memo.text = new_text
        memo.user_date = new_user_date

    db.session.commit()

    return jsonify({"status": "success"})


# ===========================================
# 📦 ITEM MASTER 조회
# ===========================================
@app.route("/api/items", methods=["GET"])
@jwt_required()
def get_items():
    q = ItemMaster.query

    # 🔎 검색 조건
    if request.args.get("itemNo"):
        q = q.filter(ItemMaster.item_no.like(f"%{request.args['itemNo']}%"))

    if request.args.get("itemName"):
        q = q.filter(ItemMaster.item_name.like(f"%{request.args['itemName']}%"))

    if request.args.get("spec"):
        q = q.filter(ItemMaster.spec.like(f"%{request.args['spec']}%"))

    if request.args.get("material"):
        q = q.filter(ItemMaster.material.like(f"%{request.args['material']}%"))

    if request.args.get("itemType"):
        q = q.filter(ItemMaster.item_type == request.args["itemType"])

    if request.args.get("unit"):
        q = q.filter(ItemMaster.unit == request.args["unit"])

    # 🔃 정렬
    order_by = request.args.get("orderBy", "itemNo")

    if order_by == "createdAtDesc":
        q = q.order_by(ItemMaster.created_at.desc())
    else:
        order_map = {
            "itemNo": ItemMaster.item_no,
            "itemName": ItemMaster.item_name,
            "material": ItemMaster.material,
            "spec": ItemMaster.spec
        }
        q = q.order_by(asc(order_map.get(order_by, ItemMaster.item_no)))

    # 🔢 limit
    limit = int(request.args.get("limit", 200))
    rows = q.limit(limit).all()

    return jsonify([r.to_dict() for r in rows])


@app.route("/api/items", methods=["POST"])
@jwt_required()
@admin_required
def create_item():
    data = request.json

    item = ItemMaster(
        item_no=data["item_no"],
        item_name=data["item_name"],
        spec=data.get("spec"),
        material=data.get("material"),
        item_type=data.get("item_type"),
        unit=data.get("unit"),
    )

    db.session.add(item)
    db.session.commit()

    return jsonify(item.to_dict()), 201

@app.route("/api/items/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_item(id):
    item = ItemMaster.query.get_or_404(id)
    data = request.json

    for k, v in data.items():
        setattr(item, k, v)

    db.session.commit()
    return jsonify({"message": "updated"})


@app.route("/api/items/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_item(id):
    item = ItemMaster.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "deleted"})



# ============================================
# 서버 실행
# ============================================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)