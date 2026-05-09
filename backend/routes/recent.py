"""
Recent Searches API — tracks and returns recent searches per device.
"""
from flask import Blueprint, request, jsonify
from models import db, RecentSearch

recent_bp = Blueprint("recent", __name__)

MAX_RECENT = 10  # Keep last 10 searches per device


def _get_device_id():
    return (
        request.headers.get("X-Device-ID")
        or request.args.get("device_id", "")
    ).strip()


@recent_bp.route("/api/recent", methods=["GET"])
def list_recent():
    """List recent searches for a device."""
    device_id = _get_device_id()
    if not device_id:
        return jsonify({"error": "X-Device-ID header or device_id param required"}), 400

    searches = (
        RecentSearch.query
        .filter_by(device_id=device_id)
        .order_by(RecentSearch.searched_at.desc())
        .limit(MAX_RECENT)
        .all()
    )
    return jsonify({"recent": [s.to_dict() for s in searches]})


@recent_bp.route("/api/recent", methods=["POST"])
def log_search():
    """Log a new search. Auto-trims to MAX_RECENT per device."""
    device_id = _get_device_id()
    if not device_id:
        return jsonify({"error": "X-Device-ID header or device_id param required"}), 400

    data = request.get_json(silent=True) or {}
    from_stop_id = data.get("from_stop_id", "").strip()
    to_stop_id = data.get("to_stop_id", "").strip()

    if not from_stop_id or not to_stop_id:
        return jsonify({"error": "from_stop_id and to_stop_id are required"}), 400

    search = RecentSearch(
        device_id=device_id,
        from_stop_id=from_stop_id,
        to_stop_id=to_stop_id,
    )
    db.session.add(search)
    db.session.commit()

    # Trim old searches beyond MAX_RECENT
    all_searches = (
        RecentSearch.query
        .filter_by(device_id=device_id)
        .order_by(RecentSearch.searched_at.desc())
        .all()
    )
    if len(all_searches) > MAX_RECENT:
        for old in all_searches[MAX_RECENT:]:
            db.session.delete(old)
        db.session.commit()

    return jsonify({"message": "Logged", "search": search.to_dict()}), 201


@recent_bp.route("/api/recent", methods=["DELETE"])
def clear_recent():
    """Clear all recent searches for a device."""
    device_id = _get_device_id()
    if not device_id:
        return jsonify({"error": "X-Device-ID header or device_id param required"}), 400

    RecentSearch.query.filter_by(device_id=device_id).delete()
    db.session.commit()
    return jsonify({"message": "Cleared"})
