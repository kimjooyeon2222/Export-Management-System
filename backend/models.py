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
    po_no = db.Column(db.String(255))

    etd = db.Column(db.String(20))
    eta = db.Column(db.String(20))

    seq = db.Column(db.Integer, nullable=False, default=1)  # ★ 개선 1
    qty = db.Column(db.String(50))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ★ 개선 2: inv_no + seq 조합은 유니크하게 유지
    __table_args__ = (
        db.UniqueConstraint("inv_no", "seq", name="uix_inv_seq"),
    )

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


class OilItemList(db.Model):
    __tablename__ = "oil_item_list"

    id = db.Column(db.Integer, primary_key=True)
    no = db.Column(db.Integer, nullable=False)
    code = db.Column(db.String(100))
    name = db.Column(db.String(255))
    spec = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "no": self.no,
            "code": self.code,
            "name": self.name,
            "spec": self.spec,
            "updated_at": self.updated_at,
        }
# ===========================================
# 🚗 AXLE INVENTORY MODEL
# ===========================================
class AxleInventory(db.Model):
    __tablename__ = "axle_inventory"

    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    item_code = db.Column(db.String(100), nullable=False)
    box_qty = db.Column(db.Integer, nullable=False)

    actual_stock = db.Column(db.Integer, default=0)

    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "company": self.company,
            "item_name": self.item_name,
            "item_code": self.item_code,
            "box_qty": self.box_qty,
            "actual_stock": self.actual_stock,

            "updated_at": self.updated_at,
        }


# ===========================================
# 🚗 AXLE SCHEDULE MODEL
# ===========================================
class AxleSchedule(db.Model):
    __tablename__ = "axle_schedule"

    id = db.Column(db.Integer, primary_key=True)
    inv_no = db.Column(db.String(50), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "inv_no": self.inv_no,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

class AxleSetting(db.Model):
    __tablename__ = "axle_setting"

    id = db.Column(db.Integer, primary_key=True)
    target_stock = db.Column(db.Integer)
    writer = db.Column(db.String(50))
    us_date = db.Column(db.Date)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
# ===========================================
# 🚗 EV SETTING MODEL
# ===========================================
class EvSetting(db.Model):
    __tablename__ = "ev_setting"

    id = db.Column(db.Integer, primary_key=True)
    writer = db.Column(db.String(50))
    us_date = db.Column(db.Date)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "target_stock": self.target_stock,
            "writer": self.writer,
            "us_date": self.us_date,
            "updated_at": self.updated_at,
        }
# ===========================================
# 🚗 EV INVENTORY MODEL
# ===========================================
class EvInventory(db.Model):
    __tablename__ = "ev_inventory"

    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    item_code = db.Column(db.String(100), nullable=False)
    box_qty = db.Column(db.Integer, nullable=False)

    actual_stock = db.Column(db.Integer, default=0)
    target_stock= db.Column(db.Integer, default=0)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "company": self.company,
            "item_name": self.item_name,
            "item_code": self.item_code,
            "box_qty": self.box_qty,
            "actual_stock": self.actual_stock,
            "target_stock": self.target_stock,   # ⭐ 필수 추가
            "updated_at": self.updated_at,
        }
# ===========================================
# 🚗 EV SCHEDULE MODEL
# ===========================================
class EvSchedule(db.Model):
    __tablename__ = "ev_schedule"

    id = db.Column(db.Integer, primary_key=True)
    inv_no = db.Column(db.String(50), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "inv_no": self.inv_no,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
# ===========================================
# 🟦 BRACKET INVENTORY MODEL
# ===========================================
class BrInventory(db.Model):
    __tablename__ = "br_inventory"

    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    item_code = db.Column(db.String(100), nullable=False)

    actual_stock = db.Column(db.Integer, default=0)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "company": self.company,
            "item_name": self.item_name,
            "item_code": self.item_code,
            "actual_stock": self.actual_stock,
            "updated_at": self.updated_at,
        }
# ===========================================
# 🟦 BRACKET SCHEDULE MODEL
# ===========================================
class BrSchedule(db.Model):
    __tablename__ = "br_schedule"

    id = db.Column(db.Integer, primary_key=True)
    inv_no = db.Column(db.String(50), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "inv_no": self.inv_no,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
# ===========================================
# 🟦 BRACKET SETTING MODEL
# ===========================================
class BrSetting(db.Model):
    __tablename__ = "br_setting"

    id = db.Column(db.Integer, primary_key=True)
    target_stock = db.Column(db.Integer, nullable=False)

    writer = db.Column(db.String(50))
    us_date = db.Column(db.Date)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "target_stock": self.target_stock,
            "writer": self.writer,
            "us_date": self.us_date,
            "updated_at": self.updated_at,
        }

# ------------------------------
#  POSetting : 북미 기준 날짜 저장 테이블
# ------------------------------
class POSetting(db.Model):
    __tablename__ = "po_setting"

    # primary key
    id = db.Column(db.Integer, primary_key=True)

    # 북미 기준 날짜 (YYYY-MM-DD)
    us_date = db.Column(db.Date)

    # 프론트로 보낼 때 JSON 형태 변환
    def to_dict(self):
        return {
            "id": self.id,
            "us_date": self.us_date.strftime("%Y-%m-%d") if self.us_date else None
        }


# ------------------------------
#  POManagement : PO 정보 테이블
# ------------------------------
class POManagement(db.Model):
    __tablename__ = "po_management"

    # 기본 키
    id = db.Column(db.Integer, primary_key=True)

    # PO 번호
    po_no = db.Column(db.String(50))

    # 날짜들
    order_date = db.Column(db.Date)      # 북미 발주일자
    request_date = db.Column(db.Date)    # 북미 도착 요청일자
    ototek_date = db.Column(db.Date)     # 오토텍 발주일자

    # 담당자 · 업체 · 내용
    manager = db.Column(db.String(50))
    company = db.Column(db.String(100))
    subject = db.Column(db.String(255))

    # 운송방법
    method = db.Column(db.String(50))

    # 생성/수정 시간 — MySQL TIMESTAMP와 동일하게 동작
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # JSON 변환 — 날짜는 YYYY-MM-DD로 변환해 React가 문제 없이 읽도록 처리
    def to_dict(self):
        return {
            "id": self.id,
            "po_no": self.po_no,
            "order_date": self.order_date.strftime("%Y-%m-%d") if self.order_date else None,
            "request_date": self.request_date.strftime("%Y-%m-%d") if self.request_date else None,
            "ototek_date": self.ototek_date.strftime("%Y-%m-%d") if self.ototek_date else None,
            "manager": self.manager,
            "company": self.company,
            "subject": self.subject,
            "method": self.method,
            # created / updated는 프론트에서 표시 안 해도 되면 삭제 가능
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class DashboardMemo(db.Model):
    __tablename__ = "dashboard_memo"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "updated_at": self.updated_at
        }
