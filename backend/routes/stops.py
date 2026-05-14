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

    import re
    from difflib import SequenceMatcher

    # Search: exact prefix match first, then contains, then fuzzy
    query_lower = query.lower()
    query_clean = re.sub(r'[^a-z0-9]', '', query_lower)

    # Get all stops and score them
    all_stops = Stop.query.all()
    scored = []
    for stop in all_stops:
        name_lower = stop.name.lower()
        name_clean = re.sub(r'[^a-z0-9]', '', name_lower)
        id_clean = stop.id.replace("_", "")

        tier = None
        similarity = 0.0

        if name_clean == query_clean:
            tier = 0
            similarity = 1.0
        elif name_clean.startswith(query_clean):
            tier = 1
            similarity = 1.0
        elif query_clean in name_clean:
            tier = 2
            similarity = 1.0
        elif id_clean.startswith(query_clean):
            tier = 3
            similarity = 1.0
        else:
            # Fuzzy match: check similarity of query against the name
            # We compare against a slice of the name of similar length to the query
            # to handle cases where query is just a prefix typo (e.g., "comasts" for "comsats university")
            compare_len = min(len(name_clean), len(query_clean) + 2)
            ratio = SequenceMatcher(None, query_clean, name_clean[:compare_len]).ratio()
            if ratio > 0.75:
                tier = 4
                similarity = ratio

        if tier is not None:
            # Sorting tuple:
            # 1. match tier (0 to 4)
            # 2. -similarity (so higher similarity comes first in fuzzy tier)
            # 3. major_hub priority (0 or 1)
            # 4. alphabetical name
            sort_key = (tier, -similarity, 0 if stop.stop_type == "major_hub" else 1, stop.name)
            scored.append((sort_key, stop))

    scored.sort(key=lambda x: x[0])
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
