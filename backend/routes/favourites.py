"""
Favourites API — save and manage favourite routes.
Uses device_id (from header or query param) for identification in Phase 1.
"""
from flask import Blueprint, request, jsonify
from models import db, FavouriteRoute, Stop

favourites_bp = Blueprint("favourites", __name__)


def _get_device_id():
    """Get device ID from header or query param."""
    return (
        request.headers.get("X-Device-ID")
        or request.args.get("device_id", "")
    ).strip()


@favourites_bp.route("/api/favourites", methods=["GET"])
def list_favourites():
    """List all favourites for a device."""
    device_id = _get_device_id()
    if not device_id:
        return jsonify({"error": "X-Device-ID header or device_id param required"}), 400

    favs = (
        FavouriteRoute.query
        .filter_by(device_id=device_id)
        .order_by(FavouriteRoute.created_at.desc())
        .all()
    )
    return jsonify({"favourites": [f.to_dict() for f in favs], "total": len(favs)})


@favourites_bp.route("/api/favourites", methods=["POST"])
def add_favourite():
    """Add a favourite route."""
    device_id = _get_device_id()
    if not device_id:
        return jsonify({"error": "X-Device-ID header or device_id param required"}), 400

    data = request.get_json(silent=True) or {}
    from_stop_id = data.get("from_stop_id", "").strip()
    to_stop_id = data.get("to_stop_id", "").strip()
    route_label = data.get("route_label", "")

    if not from_stop_id or not to_stop_id:
        return jsonify({"error": "from_stop_id and to_stop_id are required"}), 400

    # Check if already exists
    existing = FavouriteRoute.query.filter_by(
        device_id=device_id,
        from_stop_id=from_stop_id,
        to_stop_id=to_stop_id,
    ).first()

    if existing:
        return jsonify({"message": "Already saved", "favourite": existing.to_dict()})

    fav = FavouriteRoute(
        device_id=device_id,
        from_stop_id=from_stop_id,
        to_stop_id=to_stop_id,
        route_label=route_label,
    )
    db.session.add(fav)
    db.session.commit()

    return jsonify({"message": "Saved", "favourite": fav.to_dict()}), 201


@favourites_bp.route("/api/favourites/<int:fav_id>", methods=["DELETE"])
def remove_favourite(fav_id):
    """Remove a favourite route."""
    device_id = _get_device_id()
    if not device_id:
        return jsonify({"error": "X-Device-ID header or device_id param required"}), 400

    fav = FavouriteRoute.query.filter_by(id=fav_id, device_id=device_id).first()
    if not fav:
        return jsonify({"error": "Favourite not found"}), 404

    db.session.delete(fav)
    db.session.commit()
    return jsonify({"message": "Removed"})
