from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ===========================================
# 🚀 INVOICE MODEL
# ===========================================
class Invoice(db.Model):
    __tablename__ = "invoice"

    id = db.Column(db.Integer, primary_key=True)   # PK
    sort_order = db.Column(db.Integer, nullable=False, default=999999)  # ⭐ 추가

    exporter = db.Column(db.String(100))
    inv_no = db.Column(db.String(100), unique=True, nullable=False)
    amount = db.Column(db.String(50))
    item_type = db.Column(db.String(50))
    cont_no = db.Column(db.String(100))
    bl_no = db.Column(db.String(100))
    etd = db.Column(db.String(20))
    eta = db.Column(db.String(20))
    delayed_date = db.Column(db.String(20))
    count_days = db.Column(db.String(10))
    needs_help = db.Column(db.String(10))
    remark = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 🔥 PACKING_LIST CASCADE DELETE 100% 적용
    packing_list = db.relationship(
        "PackingList",
        backref="invoice",
        cascade="all, delete-orphan",
        passive_deletes=True     # ← MySQL CASCADE 연동
    )


# ===========================================
# 🚀 PACKING LIST MODEL
# ===========================================
class PackingList(db.Model):
    __tablename__ = "packing_list"

    id = db.Column(db.Integer, primary_key=True)

    # 🔥 Invoice 삭제 → PackingList 자동 삭제 (DB 레벨 + SQLAlchemy)
    invoice_id = db.Column(
        db.Integer,
        db.ForeignKey("invoice.id", ondelete="CASCADE"),    # 핵심
        nullable=False
    )

    po_no = db.Column(db.String(50))
    vendor = db.Column(db.String(100))
    part_no = db.Column(db.String(100))
    part_name = db.Column(db.String(255))
    spec = db.Column(db.String(255))
    qty = db.Column(db.Integer)
    unit = db.Column(db.String(50))   # EA 등

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =============================
# STOCK SETTING (적정재고 + 날짜 + 작성자)
# =============================
class StockSetting(db.Model):
    __tablename__ = "stock_setting"

    id = db.Column(db.Integer, primary_key=True)
    target_stock = db.Column(db.Integer)
    writer = db.Column(db.String(50))
    us_date = db.Column(db.Date)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =============================
# STOCK ITEM (실사자료 + 불량 + 정상재고)
# =============================
class StockItem(db.Model):
    __tablename__ = "stock_item"

    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100))
    over_stock = db.Column(db.Integer)
    defect = db.Column(db.Integer)
    normal_stock = db.Column(db.Integer)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =============================
# SCHEDULE ROW (행추가로 입력되는 스케줄)
# =============================
class ScheduleRow(db.Model):
    __tablename__ = "schedule_row"

    id = db.Column(db.Integer, primary_key=True)
    inv_no = db.Column(db.String(50))
    no = db.Column(db.String(50))
    status = db.Column(db.String(50))
    etd = db.Column(db.String(20))
    eta = db.Column(db.String(20))
    month_depart = db.Column(db.String(20))
    month_arrive = db.Column(db.String(20))

    mq4_gear = db.Column(db.Integer, default=0)
    mq4_pinion = db.Column(db.Integer, default=0)
    nx4_gear = db.Column(db.Integer, default=0)
    nx4_pinion = db.Column(db.Integer, default=0)


    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
# ============================================================
# OIL SCHEDULE ROW (OIL SHIPMENT 전용 스케줄)
# ============================================================
class OilScheduleRow(db.Model):
    __tablename__ = "oil_schedule_row"

    id = db.Column(db.Integer, primary_key=True)
    inv_no = db.Column(db.String(100))
    po_no = db.Column(db.String(100))

    etd = db.Column(db.String(20))
    eta = db.Column(db.String(20))

    seq = db.Column(db.Integer)          # 1~38
    qty = db.Column(db.String(50))       # "1벌", "2DR", "1PL"

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "inv_no": self.inv_no,
            "po_no": self.po_no,
            "etd": self.etd,
            "eta": self.eta,
            "seq": self.seq,
            "qty": self.qty,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }