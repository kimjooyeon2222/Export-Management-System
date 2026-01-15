print("🔥 app.py 실행됨!")
from dotenv import load_dotenv
load_dotenv(override=True)


from sqlalchemy import or_
import os
print("🔥 CWD:", os.getcwd())
print("🔥 ENV DB_USER:", os.getenv("DB_USER"))
print("🔥 ENV DB_HOST:", os.getenv("DB_HOST"))

from auth_utils import admin_required
from flask_jwt_extended import jwt_required
from models import ItemMaster
from sqlalchemy import asc

from models import ForgingAudit
from models import OilScheduleRow
from models import OilItemList
from models import EvInventory, EvSchedule, EvSetting
from models import POManagement, POSetting
from models import POSubRow 
from models import StockAudit, StockAuditItem
from models import ForgingItem

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
print("🔥 Flask 실제 연결 DB:", Config.get_db_uri())


app = Flask(__name__)
app.config.from_object(Config)
app.config["SQLALCHEMY_DATABASE_URI"] = Config.get_db_uri()


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
            "audit_id": r.audit_id,
            "inv_no": r.inv_no,
            "no": r.no,
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
    data = request.json

    audit_id = data["audit_id"]
    rows = data["rows"]

    # ⭐ 이 audit 데이터만 삭제
    ScheduleRow.query.filter_by(audit_id=audit_id).delete()

    for r in rows:
        db_row = ScheduleRow(
            audit_id=audit_id,  
            inv_no=r.get("inv_no"),
            no=r.get("no")
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
            unit=row.get("unit"),
        )
        db.session.add(item)

    db.session.commit()
    return jsonify({"message": "saved"})

@app.route("/api/axle", methods=["GET"])
@jwt_required()
def get_axle_inventory():
    rows = (
        db.session.query(
            AxleInventory,
            ItemMaster.unit
        )
        .outerjoin(
            ItemMaster,
            AxleInventory.item_code == ItemMaster.item_no
        )
        .all()
    )

    return jsonify([
        {
            **axle.to_dict(),
            "unit": unit   # ⭐ 여기서 unit 붙임
        }
        for axle, unit in rows
    ])

@app.route("/api/axle/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_axle_item(id):
    row = AxleInventory.query.get_or_404(id)
    db.session.delete(row)
    db.session.commit()
    return jsonify({"message": "deleted"})

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
    for key in ["inv_no"]:
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

    # ✅ 품목명: 공백 무시 검색 (여기만 수정됨)
    if request.args.get("itemName"):
        keyword = request.args.get("itemName").replace(" ", "")
        q = q.filter(
            func.replace(ItemMaster.item_name, " ", "").like(f"%{keyword}%")
        )

    if request.args.get("companyName"):
        q = q.filter(ItemMaster.company_name.like(f"%{request.args['companyName']}%"))

    if request.args.get("spec"):
        q = q.filter(ItemMaster.spec.like(f"%{request.args['spec']}%"))

    if request.args.get("material"):
        q = q.filter(ItemMaster.material.like(f"%{request.args['material']}%"))

    if request.args.get("itemForm"):
        q = q.filter(ItemMaster.item_form == request.args["itemForm"])

    if request.args.get("itemKind"):
        q = q.filter(ItemMaster.item_kind == request.args["itemKind"])

    if request.args.get("unit"):
        q = q.filter(ItemMaster.unit == request.args["unit"])

    # 🔃 정렬
    order_by = request.args.get("orderBy", "itemNo")

    if order_by == "created_at_desc":
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
    company_name=data.get("company_name"),   
    spec=data.get("spec"),
    material=data.get("material"),
    item_form=data.get("item_form"),
    item_kind=data.get("item_kind"),
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

from sqlalchemy import or_, and_, func

@app.route("/api/items/search", methods=["GET"])
@jwt_required()
def search_items():
    keyword = request.args.get("keyword", "").strip()

    q = ItemMaster.query

    if keyword:
        # 🔥 1) 공백 기준 토큰화
        tokens = keyword.split()

        for t in tokens:
            like = f"%{t}%"

            q = q.filter(
                or_(
                    # 🔥 공백 제거 후 비교 (핵심)
                    func.replace(ItemMaster.item_no, " ", "").ilike(like.replace(" ", "")),
                    func.replace(ItemMaster.item_name, " ", "").ilike(like.replace(" ", "")),
                    func.replace(ItemMaster.company_name, " ", "").ilike(like.replace(" ", "")),
                    func.replace(ItemMaster.spec, " ", "").ilike(like.replace(" ", "")),
                    func.replace(ItemMaster.unit, " ", "").ilike(like.replace(" ", "")),
                )
            )

    rows = (
        q.order_by(ItemMaster.item_no.asc())
         .limit(200)
         .all()
    )

    return jsonify([r.to_dict() for r in rows])


@app.route("/api/stock-audits", methods=["GET"])
@jwt_required()
def get_stock_audits():
    rows = StockAudit.query.order_by(StockAudit.audit_date.desc()).all()
    return jsonify([r.to_dict() for r in rows])

@app.route("/api/stock-audits", methods=["POST"])
@jwt_required()
@admin_required
def create_stock_audit():
    data = request.json
    audit_date = datetime.strptime(data["audit_date"], "%Y-%m-%d").date()

    # 중복 방지
    exists = StockAudit.query.filter_by(audit_date=audit_date).first()
    if exists:
        return jsonify({"error": "이미 존재하는 실사 날짜입니다."}), 400

    audit = StockAudit(
        audit_date=audit_date,
        audit_year=audit_date.year,
        audit_month=audit_date.month
    )

    db.session.add(audit)
    db.session.commit()

    return jsonify(audit.to_dict()), 201

@app.route("/api/stock-audits/<int:audit_id>", methods=["GET"])
@jwt_required()
def get_stock_audit_detail(audit_id):
    audit = StockAudit.query.get_or_404(audit_id)

    return jsonify({
        **audit.to_dict(),
        "items": [i.to_dict() for i in audit.items]
    })

@app.route("/api/stock-audit-items/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_stock_audit_items():
    data = request.json
    audit_id = data["audit_id"]
    items = data["items"]

    audit = StockAudit.query.get_or_404(audit_id)

    for item in items:
        if item.get("id"):
            row = StockAuditItem.query.get(item["id"])
        else:
            row = StockAuditItem.query.filter_by(
                audit_id=audit_id,
                item_no=item["item_no"],
                company_name=item.get("company_name")
            ).first()

        if not row:
            row = StockAuditItem(
                audit_id=audit_id,
                item_no=item["item_no"],
                company_name=item.get("company_name")
            )

        row.item_name = item.get("item_name")
        row.audit_qty = item.get("audit_qty", 0)
        row.defect_qty = item.get("defect_qty", 0)
        row.shortage_qty = item.get("shortage_qty", 0)
        row.optimal_qty = item.get("optimal_qty", 0)
        row.box_qty = item.get("box_qty", 0)

        db.session.add(row)

    # 🔥 품목 수 자동 업데이트
    audit.item_count = StockAuditItem.query.filter_by(
        audit_id=audit_id
    ).count()

    db.session.commit()
    return jsonify({"message": "saved"})


@app.route("/api/stock-audits/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_stock_audit(id):
    audit = StockAudit.query.get_or_404(id)
    db.session.delete(audit)
    db.session.commit()
    return jsonify({"message": "deleted"})


# ============================================
# 🔨 FORGING AUDIT LIST (GET)
# ============================================
@app.route("/api/forging-audits", methods=["GET"])
@jwt_required()
def get_forging_audits():
    rows = ForgingAudit.query.order_by(
        ForgingAudit.audit_date.desc()
    ).all()

    return jsonify([r.to_dict() for r in rows])

# ============================================
# 🔨 FORGING AUDIT CREATE (POST)
# ============================================
@app.route("/api/forging-audits", methods=["POST"])
@jwt_required()
@admin_required
def create_forging_audit():
    data = request.json
    audit_date = datetime.strptime(
        data["audit_date"], "%Y-%m-%d"
    ).date()

    # 중복 방지
    exists = ForgingAudit.query.filter_by(
        audit_date=audit_date
    ).first()
    if exists:
        return jsonify({"error": "이미 존재하는 실사 날짜입니다."}), 400

    audit = ForgingAudit(
        audit_date=audit_date,
        audit_year=audit_date.year,
        audit_month=audit_date.month
    )

    db.session.add(audit)
    db.session.commit()

    return jsonify(audit.to_dict()), 201

# ============================================
# 🔨 FORGING AUDIT DELETE
# ============================================
@app.route("/api/forging-audits/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_forging_audit(id):
    audit = ForgingAudit.query.get_or_404(id)
    db.session.delete(audit)
    db.session.commit()
    return jsonify({"message": "deleted"})

# ============================================
# 🔨 FORGING AUDIT DETAIL (GET by ID)
# ============================================
@app.route("/api/forging-audits/<int:id>", methods=["GET"])
@jwt_required()
def get_forging_audit_detail(id):
    audit = ForgingAudit.query.get_or_404(id)
    return jsonify(audit.to_dict())

@app.route("/api/forging-audits/<int:audit_id>/detail", methods=["GET"])
@jwt_required()
def forging_detail(audit_id):
    audit = ForgingAudit.query.get_or_404(audit_id)

    rows = ScheduleRow.query.filter_by(audit_id=audit_id).all()
    forging_items = ForgingItem.query.filter_by(audit_id=audit_id).all()

    return jsonify({
        "audit_date": audit.audit_date.strftime("%Y-%m-%d"),
        "us_date": audit.us_date.strftime("%Y-%m-%d") if audit.us_date else None,
        "writer": audit.writer,

        # ✅ forging_item 기준
        "forging_items": [
            {
                "itemCode": i.item_no,
                "itemName": i.item_name
            }
            for i in forging_items
        ],

        "rows": [
            {
                "id": r.id,
                "inv_no": r.inv_no,
                "no": r.no
            }
            for r in rows
        ]
    })


# ============================================
# 🔨 FORGING AUDIT UPDATE (PUT)
# ============================================
@app.route("/api/forging-audits/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_forging_audit(id):
    audit = ForgingAudit.query.get_or_404(id)
    data = request.json

    audit.writer = data.get("writer")

    us_date = data.get("us_date")
    if us_date:
        audit.us_date = datetime.strptime(us_date, "%Y-%m-%d").date()

    db.session.commit()
    return jsonify({"message": "updated"})

# GET /api/forging/inv-item-qty
@app.route("/api/forging/inv-item-qty", methods=["POST"])
@jwt_required()
def get_forging_inv_item_qty():
    try:
        data = request.json
        inv_no = data.get("inv_no")
        item_code = data.get("item_code")


        print("🔥 qty API input:", inv_no, item_code)

        if not inv_no or not item_code:
            print("❌ missing param")
            return jsonify({"qty": 0})

        invoice = Invoice.query.filter_by(inv_no=inv_no).first()
        if not invoice:
            print("❌ invoice not found")
            return jsonify({"qty": 0})

        rows = PackingList.query.filter(
            PackingList.invoice_id == invoice.id,
            PackingList.part_no == item_code,
        ).all()

        print("🔥 qty rows:", [(r.part_no, r.part_name, r.qty) for r in rows])

        total_qty = sum(int(r.qty or 0) for r in rows)

        return jsonify({"qty": total_qty})

    except Exception as e:
        print("💥 qty API error:", e)
        return jsonify({"qty": 0})

# GET /api/stock-audit/by-date/<audit_date>
@app.route("/api/stock-audit/by-date/<audit_date>", methods=["GET"])
@jwt_required()
def get_stock_audit_by_date(audit_date):
    try:
        audit_date_obj = datetime.strptime(audit_date, "%Y-%m-%d").date()

        audit = StockAudit.query.filter_by(
            audit_date=audit_date_obj
        ).first()

        if not audit:
            return jsonify([])   # 실사 없으면 빈 배열

        return jsonify([
            {
                "item_no": i.item_no,
                "item_name": i.item_name,
                "audit_qty": i.audit_qty,
                "defect_total": (i.defect_qty or 0) + (i.shortage_qty or 0),
                "optimal_qty": i.optimal_qty
            }
            for i in audit.items
        ])

    except Exception as e:
        print("🔥 stock audit fetch error:", e)
        return jsonify([]), 500

@app.route("/api/forging-items/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_forging_items():
    data = request.json
    audit_id = data["audit_id"]
    items = data["items"]

    # 기존 품목 삭제
    ForgingItem.query.filter_by(audit_id=audit_id).delete()

    for it in items:
        if not it.get("itemCode") or not it.get("itemName"):
            continue

        db.session.add(ForgingItem(
            audit_id=audit_id,
            item_no=it["itemCode"],
            item_name=it["itemName"]
        ))

    db.session.commit()
    return jsonify({"message": "saved"})


# ============================================
# 🔥 FORGING 전용 실사 집계 API (업체명 무시)
# ============================================
@app.route("/api/stock-audit/forging/by-date/<audit_date>", methods=["GET"])
@jwt_required()
def get_stock_audit_for_forging(audit_date):
    try:
        audit_date_obj = datetime.strptime(audit_date, "%Y-%m-%d").date()

        audit = StockAudit.query.filter_by(
            audit_date=audit_date_obj
        ).first()

        if not audit:
            return jsonify([])

        from collections import defaultdict

        result = defaultdict(lambda: {
            "item_no": "",
            "audit_qty": 0,
            "defect_total": 0,
            "optimal_qty": 0,
        })

        for i in audit.items:
            r = result[i.item_no]
            r["item_no"] = i.item_no
            r["audit_qty"] += int(i.audit_qty or 0)
            r["defect_total"] += int((i.defect_qty or 0) + (i.shortage_qty or 0))
            r["optimal_qty"] = max(r["optimal_qty"], int(i.optimal_qty or 0))

        return jsonify(list(result.values()))

    except Exception as e:
        print("🔥 forging stock audit error:", e)
        return jsonify([]), 500


# ⭐ INV 단위로 한 번에 qty 다 주는 API
@app.route("/api/forging/inv-quantities/<inv_no>", methods=["GET"])
@jwt_required()
def get_forging_inv_quantities(inv_no):
    invoice = Invoice.query.filter_by(inv_no=inv_no).first()
    if not invoice:
        return jsonify({})

    rows = PackingList.query.filter_by(invoice_id=invoice.id).all()

    qty_map = {}
    for r in rows:
        qty_map[r.part_no] = qty_map.get(r.part_no, 0) + int(r.qty or 0)

    return jsonify(qty_map)

# ============================================
# 🔩 AXLE 전용 실사 집계 API
# ============================================
@app.route("/api/stock-audit/axle/by-date/<audit_date>", methods=["GET"])
@jwt_required()
def get_stock_audit_for_axle(audit_date):
    try:
        audit_date_obj = datetime.strptime(audit_date, "%Y-%m-%d").date()

        audit = StockAudit.query.filter_by(
            audit_date=audit_date_obj
        ).first()

        if not audit:
            return jsonify([])

        result = []

        for i in audit.items:
            result.append({
                "item_no": i.item_no,
                "item_name": i.item_name,
                "audit_qty": i.audit_qty,
                "defect_total": (i.defect_qty or 0) + (i.shortage_qty or 0),
                "optimal_qty": i.optimal_qty,
                "box_qty": i.box_qty,
            })

        return jsonify(result)

    except Exception as e:
        print("🔥 axle stock audit error:", e)
        return jsonify([]), 500

# GET /api/forging-audits/latest
@app.route("/api/forging-audits/latest", methods=["GET"])
@jwt_required()
def get_latest_forging_audit():
    audit = (
        ForgingAudit.query
        .order_by(ForgingAudit.audit_date.desc())
        .first()
    )

    if not audit:
        return jsonify(None)

    return jsonify(audit.to_dict())

@app.route("/api/oil/auto-load", methods=["GET"])
@jwt_required()
def oil_auto_load():
    inv_no = request.args.get("inv_no")
    # 1️⃣ invoice 찾기
    invoice = Invoice.query.filter_by(inv_no=inv_no).first()
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404

    # 2️⃣ packing_list 조회
    pack_rows = PackingList.query.filter_by(invoice_id=invoice.id).all()

    # part_no → qty 합산
    pack_qty = {}
    for r in pack_rows:
        pack_qty[r.part_no] = pack_qty.get(r.part_no, 0) + int(r.qty or 0)

    # 3️⃣ oil_item_list 전체 조회
    oil_items = OilItemList.query.all()

    # 4️⃣ code 기준 JOIN → seq 매핑
    result = []
    for oil in oil_items:
        qty = pack_qty.get(oil.code, 0)
        result.append({
            "seq": oil.no,
            "code": oil.code,
            "name": oil.name,
            "qty": qty
        })

    return jsonify(result)

@app.route("/api/stock-audit/ev/by-date/<audit_date>", methods=["GET"])
@jwt_required()
def get_stock_audit_for_ev(audit_date):
    from datetime import datetime

    audit_date_obj = datetime.strptime(audit_date, "%Y-%m-%d").date()

    audit = StockAudit.query.filter_by(
        audit_date=audit_date_obj
    ).first()

    if not audit:
        return jsonify([])

    result = []

    for i in audit.items:
        result.append({
            "item_no": i.item_no,
            "audit_qty": i.audit_qty,
            "optimal_qty": i.optimal_qty,
            "box_qty": i.box_qty,   # ⭐ 이게 핵심
        })

    return jsonify(result)


@app.route("/api/ev-inventory/bulk", methods=["POST"])
@jwt_required()
@admin_required
def save_ev_inventory_bulk():
    rows = request.json
    EvInventory.query.delete()

    for r in rows:
        db.session.add(EvInventory(
            company=r.get("company"),
            item_code=r.get("item_code"),
            item_name=r.get("item_name"),
            box_qty=r.get("box_qty", 0),
            actual_stock=r.get("actual_stock", 0),
            target_stock=r.get("target_stock", 0),
        ))

    db.session.commit()
    return jsonify({"message": "saved"})

# ============================================
# 🔩 BRACKET 전용 실사 집계 API
# ============================================
@app.route("/api/stock-audit/bracket/by-date/<audit_date>", methods=["GET"])
@jwt_required()
def get_stock_audit_for_bracket(audit_date):
    try:
        audit_date_obj = datetime.strptime(audit_date, "%Y-%m-%d").date()

        audit = StockAudit.query.filter_by(
            audit_date=audit_date_obj
        ).first()

        if not audit:
            return jsonify([])

        result = []

        for i in audit.items:
            result.append({
                "item_no": i.item_no,
                "item_name": i.item_name,
                "audit_qty": i.audit_qty,
                "optimal_qty": i.optimal_qty,
                "box_qty": i.box_qty,
            })

        return jsonify(result)

    except Exception as e:
        print("🔥 bracket stock audit error:", e)
        return jsonify([]), 500

# ============================================
# 서버 실행
# ============================================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",   # ⭐ 핵심
        port=5001,
        debug=True
    )