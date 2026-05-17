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

    # Dictionary of landmarks that don't have a direct station
    ALIASES = {
        "n5": ["Peshawar Mor", "26 Number", "26 Number Chungi"],
        "nust": ["Air University", "IQRA University"],
        "islamic_university": ["Quaid-i-Azam University", "QAU", "IIU", "IIUI"],
        "bahria_university": ["Bahria Town", "Bahria Uni"],
        "fast_university": ["FAST NUCES", "FAST Uni"],
        "faizabad": ["Riphah International University", "Preston University"],
        "stock_exchange": ["Blue Area", "Centaurus Mall", "F-6 Markaz", "F-7 Markaz"],
        "sabzi_mandi": ["G-9 Markaz", "Karachi Company"],
        "pims": ["F-8 Markaz"],
        "g10_g11": ["G-10 Markaz", "G-11 Markaz"],
        "dha_gate_07": ["DHA Islamabad"],
        "pwd_housing_society": ["PWD Colony"]
    }

    # Get all stops and score them
    all_stops = Stop.query.all()
    scored = []
    for stop in all_stops:
        name_lower = stop.name.lower()
        name_clean = re.sub(r'[^a-z0-9]', '', name_lower)
        id_clean = stop.id.replace("_", "")

        tier = None
        similarity = 0.0
        matched_alias = None

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
            # Check Aliases from graph data + hardcoded landmarks
            graph = current_app.config.get("GRAPH_DATA", {})
            graph_node = graph.get("nodes", {}).get(stop.id, {})
            graph_aliases = graph_node.get("aliases", [])
            stop_aliases = list(set(graph_aliases + ALIASES.get(stop.id, [])))

            for alias in stop_aliases:
                alias_clean = re.sub(r'[^a-z0-9]', '', alias.lower())
                if alias_clean.startswith(query_clean) or query_clean in alias_clean:
                    tier = 1  # Treat alias match as prefix/contains match
                    similarity = 1.0
                    matched_alias = alias
                    break
            
            # If no alias matched, do a fuzzy typo check on the main name
            if tier is None:
                compare_len = min(len(name_clean), len(query_clean) + 2)
                ratio = SequenceMatcher(None, query_clean, name_clean[:compare_len]).ratio()
                if ratio > 0.75:
                    tier = 4
                    similarity = ratio

        if tier is not None:
            # If an alias matched, append it to the name so the user knows WHY it was suggested
            display_name = stop.name
            if matched_alias:
                display_name = f"{stop.name} (Near {matched_alias})"
                
            # Sorting tuple:
            # 1. match tier (0 to 4)
            # 2. -similarity (so higher similarity comes first in fuzzy tier)
            # 3. major_hub priority (0 or 1)
            # 4. alphabetical name
            sort_key = (tier, -similarity, 0 if stop.stop_type == "major_hub" else 1, stop.name)
            
            stop_dict = stop.to_dict()
            stop_dict["name"] = display_name
            scored.append((sort_key, stop_dict))

    scored.sort(key=lambda x: x[0])
    results = [s for _, s in scored[:limit]]

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
