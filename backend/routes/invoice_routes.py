from flask import Blueprint, jsonify
from models import Invoice

invoice_bp = Blueprint("invoice", __name__)

@invoice_bp.route("/", methods=["GET"])
def get_invoices():
    invoices = Invoice.query.all()
    return jsonify([{
        "invoice_id": inv.invoice_id,
        "inv_no": inv.inv_no,
        "exporter": inv.exporter,
        "amount": inv.amount,
        "cont": inv.cont,
        "bl": inv.bl,
        "etd": inv.etd,
        "eta": inv.eta
    } for inv in invoices])
