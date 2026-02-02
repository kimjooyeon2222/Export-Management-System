from flask_sqlalchemy import SQLAlchemy
from datetime import datetime


db = SQLAlchemy()

# ===========================================
# 🚀 INVOICE MODEL
# ===========================================
class Invoice(db.Model):
    __tablename__ = "invoice"

    id = db.Column(db.Integer, primary_key=True)
    sort_order = db.Column(db.Integer, nullable=False, default=999999)

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

    packing_list = db.relationship(
        "PackingList",
        backref="invoice",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    # ⭐⭐⭐ 이거 추가
    def to_dict(self):
        return {
            "id": self.id,
            "sort_order": self.sort_order,
            "exporter": self.exporter,
            "inv_no": self.inv_no,
            "amount": self.amount,
            "item_type": self.item_type,
            "cont_no": self.cont_no,
            "bl_no": self.bl_no,
            "etd": self.etd,
            "eta": self.eta,
            "delayed_date": self.delayed_date,
            "count_days": self.count_days,
            "needs_help": self.needs_help,
            "remark": self.remark,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
        }

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

    audit_id = db.Column(
        db.BigInteger,
        db.ForeignKey("forging_audit.id", ondelete="CASCADE"),
        nullable=False
    )

    inv_no = db.Column(db.String(50))
    no = db.Column(db.String(50))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

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
    unit = db.Column(db.String(20))  
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "no": self.no,
            "code": self.code,
            "name": self.name,
            "spec": self.spec,
            "unit": self.unit,
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


    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "company": self.company,
            "item_name": self.item_name,
            "item_code": self.item_code,
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
            "target_stock": self.target_stock,   
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

    id = db.Column(db.Integer, primary_key=True)
    order_date = db.Column(db.Date)
    request_date = db.Column(db.String(20))
    ototek_date = db.Column(db.Date)
    manager = db.Column(db.String(50))
    company = db.Column(db.String(100))
    subject = db.Column(db.String(255))
    method = db.Column(db.String(50))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subrows = db.relationship(
        "POSubRow",
        backref="parent",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


    # ⭐⭐⭐ 반드시 클래스 안으로 들여쓰기!!
    def to_dict(self):
        return {
            "id": self.id,
            "order_date": self.order_date.strftime("%Y-%m-%d") if self.order_date else None,
            "request_date": self.request_date,
            "ototek_date": self.ototek_date.strftime("%Y-%m-%d") if self.ototek_date else None,
            "company": self.company,
            "manager": self.manager,
            "subject": self.subject,
            "method": self.method,

            # ⭐ 반드시 포함해야 React가 subRow UI를 그림
            "subrows": [s.to_dict() for s in self.subrows]
        }



class DashboardMemo(db.Model):
    __tablename__ = "dashboard_memo"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    user_date = db.Column(db.String(20), nullable=True)  

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "user_date": self.user_date,
            "updated_at": self.updated_at
        }

class POSubRow(db.Model):
    __tablename__ = "po_subrow"

    id = db.Column(db.Integer, primary_key=True)
    
    # 부모 Row FK
    po_id = db.Column(
        db.Integer,
        db.ForeignKey("po_management.id", ondelete="CASCADE"),
        nullable=False
    )

    request_date = db.Column(db.String(20))
    ototek_date = db.Column(db.Date)
    order_date = db.Column(db.String(20))
    work_days = db.Column(db.String(20)) 
    method = db.Column(db.String(50))
    company = db.Column(db.String(100))
    editor_company = db.Column(db.String(100)) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "po_id": self.po_id,
            
            "request_date": self.request_date,
            "ototek_date": self.ototek_date.strftime("%Y-%m-%d") if self.ototek_date else None,
            "order_date": self.order_date,
            "work_days": self.work_days,
            "method": self.method,
            "company": self.company,
            "editor_company": self.editor_company,
        }


# ===========================================
# 📦 ITEM MASTER (품목관리)
# ===========================================
class ItemMaster(db.Model):
    __tablename__ = "item_master"

    id = db.Column(db.BigInteger, primary_key=True)

    item_no = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(100))  

    spec = db.Column(db.String(200))
    material = db.Column(db.String(100))

    item_form = db.Column(db.String(5))     # 품목형태
    item_kind = db.Column(db.String(10))    # 품목유형


    unit = db.Column(db.String(20))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
            return {
             "id": self.id,
             "item_no": self.item_no,
             "item_name": self.item_name,
             "company_name": self.company_name,   
             "spec": self.spec,
              "material": self.material,
             "item_form": self.item_form,
              "item_kind": self.item_kind,
              "unit": self.unit,
              "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
             "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else ""
         }
# ===========================================
# 📦 STOCK AUDIT (재고실사 헤더)
# ===========================================
class StockAudit(db.Model):
    __tablename__ = "stock_audit"

    id = db.Column(db.BigInteger, primary_key=True)

    audit_date = db.Column(db.Date, nullable=False, unique=True)
    audit_year = db.Column(db.Integer, nullable=False)
    audit_month = db.Column(db.Integer, nullable=False)

    item_count = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # 🔥 실사 삭제 시 상세 자동 삭제
    items = db.relationship(
        "StockAuditItem",
        backref="audit",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "audit_date": self.audit_date.strftime("%Y-%m-%d"),
            "audit_year": self.audit_year,
            "audit_month": self.audit_month,
            "item_count": self.item_count,
        }

# ===========================================
# 📦 STOCK AUDIT ITEM (재고실사 상세)
# ===========================================
class StockAuditItem(db.Model):
    __tablename__ = "stock_audit_item"

    id = db.Column(db.BigInteger, primary_key=True)

    audit_id = db.Column(
        db.BigInteger,
        db.ForeignKey("stock_audit.id", ondelete="CASCADE"),
        nullable=False
    )

    item_no = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(200))
    company_name = db.Column(db.String(200))

    audit_qty = db.Column(db.Integer, default=0)
    defect_qty = db.Column(db.Integer, default=0)
    shortage_qty = db.Column(db.Integer, default=0)
    optimal_qty = db.Column(db.Integer, default=0)
    box_qty = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint(
            "audit_id", "item_no", "company_name",
            name="uk_audit_item_vendor"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "audit_id": self.audit_id,
            "item_no": self.item_no,
            "item_name": self.item_name,
            "company_name": self.company_name,
            "audit_qty": self.audit_qty,
            "defect_qty": self.defect_qty,
            "shortage_qty": self.shortage_qty,
            "optimal_qty": self.optimal_qty,
            "box_qty": self.box_qty,
        }


# ===========================================
# 🔨 FORGING AUDIT (단조 실사 헤더)
# ===========================================
class ForgingAudit(db.Model):
    __tablename__ = "forging_audit"

    id = db.Column(db.BigInteger, primary_key=True)

    audit_date = db.Column(db.Date, nullable=False, unique=True)
    audit_year = db.Column(db.Integer, nullable=False)
    audit_month = db.Column(db.Integer, nullable=False)

    writer = db.Column(db.String(50))
    us_date = db.Column(db.Date)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "audit_date": self.audit_date.strftime("%Y-%m-%d"),
            "audit_year": self.audit_year,
            "audit_month": self.audit_month,
        }
# ===========================================
# 🔨 FORGING ITEM (단조 실사 선택 품목)
# ===========================================
class ForgingItem(db.Model):
    __tablename__ = "forging_item"

    id = db.Column(db.BigInteger, primary_key=True)

    audit_id = db.Column(
        db.BigInteger,
        db.ForeignKey("forging_audit.id", ondelete="CASCADE"),
        nullable=False
    )

    item_no = db.Column(db.String(50), nullable=False)
    item_name = db.Column(db.String(200), nullable=False)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
# ===========================================
# 🚢 SHIPMENT HEADER (노선 / 북미기준날짜 / 환율)
# ===========================================
class ShipmentHeader(db.Model):
    __tablename__ = "shipment_header"

    id = db.Column(db.BigInteger, primary_key=True,autoincrement=True)

    route = db.Column(
        db.Enum("SAVANNAH", "MOBILE", "LA", name="shipment_route_enum"),
        nullable=False
    )

    year = db.Column(db.SmallInteger, nullable=False)
    month = db.Column(db.SmallInteger, nullable=False)

    exchange_rate = db.Column(db.Integer, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    __table_args__ = (
        db.UniqueConstraint(
            "route", "year", "month",
            name="uk_shipment_route_month"
        ),
    )

    # 🔥 관계
    domestic_costs = db.relationship(
        "ShipmentDomesticCost",
        backref="shipment",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    ocean_cost = db.relationship(
        "ShipmentOceanCost",
        uselist=False,
        backref="shipment",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    us_costs = db.relationship(
        "ShipmentUSCost",
        backref="shipment",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "route": self.route,
            "year": self.year,
            "month": self.month,
            "exchange_rate": self.exchange_rate,
        }


# ===========================================
# 🇰🇷 SHIPMENT DOMESTIC COST (국내비용)
# ===========================================
class ShipmentDomesticCost(db.Model):
    __tablename__ = "shipment_domestic_cost"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    shipment_id = db.Column(
        db.BigInteger,
        db.ForeignKey("shipment_header.id", ondelete="CASCADE"),
        nullable=False
    )

    item_name = db.Column(db.String(100), nullable=False)

    qty = db.Column(db.Integer, nullable=False, default=1)
    cost_20 = db.Column(db.Integer, nullable=False, default=0)
    cost_40 = db.Column(db.Integer, nullable=False, default=0)

    sort_order = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "shipment_id": self.shipment_id,
            "item_name": self.item_name,
            "qty": self.qty,
            "cost_20": self.cost_20,
            "cost_40": self.cost_40,
            "sort_order": self.sort_order,
        }


# ===========================================
# 🌊 SHIPMENT OCEAN COST (해상운임 / USD)
# ===========================================
class ShipmentOceanCost(db.Model):
    __tablename__ = "shipment_ocean_cost"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    shipment_id = db.Column(
        db.BigInteger,
        db.ForeignKey("shipment_header.id", ondelete="CASCADE"),
        nullable=False,
        unique=True      # 🔥 shipment 당 1개
    )

    qty = db.Column(db.Integer, nullable=False, default=1)

    cost_20_usd = db.Column(db.Integer, nullable=False, default=0)
    cost_40_usd = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "shipment_id": self.shipment_id,
            "qty": self.qty,
            "cost_20_usd": self.cost_20_usd,
            "cost_40_usd": self.cost_40_usd,
        }


# ===========================================
# 🇺🇸 SHIPMENT US COST (미국비용 / USD)
# ===========================================
class ShipmentUSCost(db.Model):
    __tablename__ = "shipment_us_cost"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    shipment_id = db.Column(
        db.BigInteger,
        db.ForeignKey("shipment_header.id", ondelete="CASCADE"),
        nullable=False
    )

    item_name = db.Column(db.String(100), nullable=False)

    qty = db.Column(db.Integer, nullable=False, default=1)
    cost_20_usd = db.Column(db.Integer, nullable=False, default=0)
    cost_40_usd = db.Column(db.Integer, nullable=False, default=0)

    sort_order = db.Column(db.Integer, nullable=False, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "shipment_id": self.shipment_id,
            "item_name": self.item_name,
            "qty": self.qty,
            "cost_20_usd": self.cost_20_usd,
            "cost_40_usd": self.cost_40_usd,
            "sort_order": self.sort_order,
        }
        
class ShipmentSetting(db.Model):
    __tablename__ = "shipment_setting"

    id = db.Column(db.Integer, primary_key=True)

    default_year = db.Column(db.SmallInteger, nullable=False)
    default_month = db.Column(db.SmallInteger, nullable=False)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "default_year": self.default_year,
            "default_month": self.default_month
        }
