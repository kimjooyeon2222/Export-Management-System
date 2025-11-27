from flask import Blueprint, jsonify
from models import PackingList

packing_bp = Blueprint("packing", __name__)

@packing_bp.route("/<invoice_id>", methods=["GET"])
def get_packing(invoice_id):
    rows = PackingList.query.filter_by(invoice_id=invoice_id).all()
    return jsonify([{
        "id": r.id,
        "invoice_id": r.invoice_id,
        "po_no": r.po_no,
        "vendor": r.vendor,
        "part_no": r.part_no,
        "part_name": r.part_name,
        "spec": r.spec,
        "qty": r.qty
    } for r in rows])
