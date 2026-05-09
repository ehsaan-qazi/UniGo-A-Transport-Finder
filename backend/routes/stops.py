"""
Stops API — autocomplete search and nearest stop (GPS).
"""
import math
from flask import Blueprint, request, jsonify, current_app
from models import db, Stop

stops_bp = Blueprint("stops", __name__)


@stops_bp.route("/api/stops/search", methods=["GET"])
def search_stops():
    """
    Autocomplete search for stops.
    Query params:
        q (str): search term (min 1 char)
        limit (int): max results (default 10)
    Returns matching stops ordered by relevance.
    """
    query = request.args.get("q", "").strip()
    limit = request.args.get("limit", 10, type=int)

    if not query:
        return jsonify({"stops": [], "query": query})

    # Search: exact prefix match first, then contains
    query_lower = query.lower()

    # Get all stops and score them
    all_stops = Stop.query.all()
    scored = []
    for stop in all_stops:
        name_lower = stop.name.lower()
        if name_lower == query_lower:
            scored.append((0, stop))  # Exact match — highest priority
        elif name_lower.startswith(query_lower):
            scored.append((1, stop))  # Prefix match
        elif query_lower in name_lower:
            scored.append((2, stop))  # Contains match
        elif stop.id.replace("_", " ").startswith(query_lower.replace(" ", "_")):
            scored.append((3, stop))  # ID match

    scored.sort(key=lambda x: (x[0], x[1].name))
    results = [s.to_dict() for _, s in scored[:limit]]

    return jsonify({"stops": results, "query": query})


@stops_bp.route("/api/stops/nearest", methods=["GET"])
def nearest_stop():
    """
    Find the nearest stop to given GPS coordinates.
    Query params:
        lat (float): latitude
        lng (float): longitude
        limit (int): number of nearest stops to return (default 3)
    Uses Haversine formula for distance calculation.
    """
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    limit = request.args.get("limit", 3, type=int)

    if lat is None or lng is None:
        return jsonify({"error": "lat and lng query params are required"}), 400

    all_stops = Stop.query.all()

    # Calculate Haversine distance for each stop
    results = []
    for stop in all_stops:
        dist = _haversine(lat, lng, stop.latitude, stop.longitude)
        results.append({
            **stop.to_dict(),
            "distance_km": round(dist, 3),
        })

    results.sort(key=lambda x: x["distance_km"])
    return jsonify({"nearest": results[:limit], "lat": lat, "lng": lng})


@stops_bp.route("/api/stops", methods=["GET"])
def list_all_stops():
    """Return all stops (for frontend caching / offline use)."""
    stops = Stop.query.order_by(Stop.name).all()
    return jsonify({"stops": [s.to_dict() for s in stops], "total": len(stops)})


def _haversine(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance in km between two points."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
