"""
Community Stop Reports API — submit and view reports about stops.
"""
from flask import Blueprint, request, jsonify
from models import db, StopReport, Stop

reports_bp = Blueprint("reports", __name__)

VALID_ISSUE_TYPES = ["crowded", "broken", "unsafe", "dirty", "no_shelter", "other"]


@reports_bp.route("/api/reports", methods=["GET"])
def list_reports():
    """
    List reports, optionally filtered by stop_id.
    Query params:
        stop_id (str): filter by stop
        limit (int): max results (default 20)
    """
    stop_id = request.args.get("stop_id", "").strip()
    limit = request.args.get("limit", 20, type=int)

    query = StopReport.query.filter_by(is_resolved=False)
    if stop_id:
        query = query.filter_by(stop_id=stop_id)

    reports = query.order_by(StopReport.reported_at.desc()).limit(limit).all()
    return jsonify({"reports": [r.to_dict() for r in reports], "total": len(reports)})


@reports_bp.route("/api/reports", methods=["POST"])
def submit_report():
    """Submit a community stop report."""
    data = request.get_json(silent=True) or {}
    stop_id = data.get("stop_id", "").strip()
    issue_type = data.get("issue_type", "").strip()
    description = data.get("description", "").strip()
    reporter_name = data.get("reporter_name", "Anonymous").strip()

    if not stop_id:
        return jsonify({"error": "stop_id is required"}), 400

    if issue_type not in VALID_ISSUE_TYPES:
        return jsonify({
            "error": f"issue_type must be one of: {', '.join(VALID_ISSUE_TYPES)}"
        }), 400

    # Verify stop exists
    stop = Stop.query.get(stop_id)
    if not stop:
        return jsonify({"error": f"Stop '{stop_id}' not found"}), 404

    report = StopReport(
        stop_id=stop_id,
        issue_type=issue_type,
        description=description,
        reporter_name=reporter_name or "Anonymous",
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({"message": "Report submitted", "report": report.to_dict()}), 201
