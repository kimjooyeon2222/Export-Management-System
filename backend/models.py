from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ===========================================
# 🚀 INVOICE MODEL
# ===========================================
class Invoice(db.Model):
    __tablename__ = "invoice"

    id = db.Column(db.Integer, primary_key=True)   # PK
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
