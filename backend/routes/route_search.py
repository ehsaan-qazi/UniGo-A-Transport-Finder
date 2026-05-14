"""
Route Search API — finds routes between two stops using the graph data.
Uses Dijkstra's algorithm on the reliable_metro_graph and falls back
to pre-computed routes from unigo_transport_routes_full_slugged.json.
"""
import heapq
from flask import Blueprint, request, jsonify, current_app

route_search_bp = Blueprint("route_search", __name__)


# Fare per line (PKR) — charged once per unique line used in a journey
FARE_TABLE = {
    "red_line": 30,
    "orange_line": 50,
}
# All green feeders and green line default to 50 PKR


def _calculate_total_fare(merged_steps):
    """
    Calculate total fare by summing the fare for each unique line used.
    Red Line = 30 PKR, Orange Line = 50 PKR, Green/Feeders = 50 PKR.
    """
    if not merged_steps:
        return 0
    seen = set()
    total = 0
    for step in merged_steps:
        route_id = step.get("route_id", "")
        if route_id and route_id not in seen:
            seen.add(route_id)
            total += FARE_TABLE.get(route_id, 50)  # default 50 for green/feeders
    return total


def _get_graph():
    """Get the graph data loaded at app startup."""
    return current_app.config.get("GRAPH_DATA", {})


def _get_precomputed_routes():
    """Get the pre-computed routes loaded at app startup."""
    return current_app.config.get("PRECOMPUTED_ROUTES", [])


def _get_route_display_name(route_id, graph):
    """Convert route_id like 'fr_01' to display name like 'FR-01'."""
    routes = graph.get("routes", {})
    if isinstance(routes, dict) and route_id in routes:
        return routes[route_id].get("name", route_id)
    elif isinstance(routes, list):
        for r in routes:
            if r.get("id") == route_id:
                return r.get("name", route_id)
    return route_id


def _get_route_color(route_id, graph):
    """Get the color hex for a route."""
    routes = graph.get("routes", {})
    if isinstance(routes, dict) and route_id in routes:
        return routes[route_id].get("color", "#888888")
    elif isinstance(routes, list):
        for r in routes:
            if r.get("id") == route_id:
                return r.get("color", "#888888")
    return "#888888"


def _dijkstra(graph, start_id, end_id):
    """
    Dijkstra's algorithm on the metro graph with transfer penalty.
    Returns the shortest path as a list of steps.
    """
    nodes = graph.get("nodes", {})
    edges = graph.get("edges", [])

    if start_id not in nodes or end_id not in nodes:
        return None

    # Build adjacency from edges for fast lookup
    adj = {}
    edge_map = {}
    for edge in edges:
        from_id = edge["from"]
        if from_id not in adj:
            adj[from_id] = []
        adj[from_id].append(edge)
        edge_map[edge["id"]] = edge

    TRANSFER_PENALTY = 3.0  # km penalty for route switches

    # State: (node_id, route_id) — tracks which route we arrived on
    # Distance dict: state -> cost
    dist = {}
    prev = {}
    start_state = (start_id, "START")
    dist[start_state] = 0

    # Priority queue: (cost, node_id, route_id)
    pq = [(0, start_id, "START")]

    while pq:
        cost, current_id, current_route = heapq.heappop(pq)
        current_state = (current_id, current_route)

        if cost > dist.get(current_state, float("inf")):
            continue

        if current_id == end_id:
            # Reconstruct path
            path = []
            state = current_state
            while state in prev:
                prev_state, edge = prev[state]
                path.append({
                    "from_id": prev_state[0],
                    "from_name": nodes[prev_state[0]]["name"],
                    "to_id": state[0],
                    "to_name": nodes[state[0]]["name"],
                    "route_id": edge["route_id"],
                    "route_name": _get_route_display_name(edge["route_id"], graph),
                    "route_color": _get_route_color(edge["route_id"], graph),
                    "distance_km": edge.get("distance_km", 0),
                    "time_minutes": edge.get("time_minutes", 0),
                    "fare_pkr": edge.get("fare_pkr", 0),
                })
                state = prev_state

            path.reverse()

            # Merge consecutive steps on same route
            merged = _merge_steps(path)
            return {
                "path": merged,
                "total_distance_km": round(sum(s["distance_km"] for s in path), 2),
                "total_time_minutes": sum(s["time_minutes"] for s in path),
                "total_fare_pkr": _calculate_total_fare(merged),
                "transfers": len(merged) - 1,
            }

        for edge in adj.get(current_id, []):
            neighbor_id = edge["to"]
            edge_cost = edge.get("distance_km", 1)

            # Transfer penalty
            if current_route != "START" and current_route != edge["route_id"]:
                edge_cost += TRANSFER_PENALTY

            neighbor_state = (neighbor_id, edge["route_id"])
            new_cost = cost + edge_cost

            if new_cost < dist.get(neighbor_state, float("inf")):
                dist[neighbor_state] = new_cost
                prev[neighbor_state] = (current_state, edge)
                heapq.heappush(pq, (new_cost, neighbor_id, edge["route_id"]))

    return None  # No path found


def _merge_steps(path):
    """Merge consecutive steps on the same route into single legs."""
    if not path:
        return []

    merged = []
    current = {
        "route_id": path[0]["route_id"],
        "route_name": path[0]["route_name"],
        "route_color": path[0]["route_color"],
        "from_id": path[0]["from_id"],
        "from_name": path[0]["from_name"],
        "to_id": path[0]["to_id"],
        "to_name": path[0]["to_name"],
        "distance_km": path[0]["distance_km"],
        "time_minutes": path[0]["time_minutes"],
        "fare_pkr": path[0]["fare_pkr"],
        "stops_count": 2,  # from + to
    }

    for step in path[1:]:
        if step["route_id"] == current["route_id"]:
            # Extend current leg
            current["to_id"] = step["to_id"]
            current["to_name"] = step["to_name"]
            current["distance_km"] += step["distance_km"]
            current["time_minutes"] += step["time_minutes"]
            current["stops_count"] += 1
        else:
            # Finalize current leg and start new one
            current["distance_km"] = round(current["distance_km"], 2)
            merged.append(current)
            current = {
                "route_id": step["route_id"],
                "route_name": step["route_name"],
                "route_color": step["route_color"],
                "from_id": step["from_id"],
                "from_name": step["from_name"],
                "to_id": step["to_id"],
                "to_name": step["to_name"],
                "distance_km": step["distance_km"],
                "time_minutes": step["time_minutes"],
                "fare_pkr": step["fare_pkr"],
                "stops_count": 2,
            }

    current["distance_km"] = round(current["distance_km"], 2)
    merged.append(current)
    return merged


def _try_precomputed(from_slug, to_slug, precomputed, graph):
    """
    Try to find a route in the pre-computed routes JSON.
    Returns a formatted result or None.
    """
    for route in precomputed:
        if route.get("from") == from_slug and route.get("to") == to_slug:
            options = route.get("options", [])
            if options:
                steps = options[0].get("steps", [])
                label = options[0].get("label", "Recommended Route")
                return {
                    "path": _parse_precomputed_steps(steps, graph),
                    "total_distance_km": None,  # Not available in precomputed
                    "total_time_minutes": None,
                    "total_fare_pkr": None,
                    "transfers": len(steps) - 1 if steps else 0,
                    "label": label,
                    "source": "precomputed",
                }
    return None


def _parse_precomputed_steps(steps, graph):
    """Parse text steps like 'Green Feeder FR-08C from COMSATS University → Faizabad'."""
    parsed = []
    for step_text in steps:
        # Try to parse "Route from StopA → StopB"
        parts = step_text.split(" from ", 1)
        route_name = parts[0].strip() if len(parts) > 1 else "Unknown"
        stops_part = parts[1] if len(parts) > 1 else step_text

        from_to = stops_part.split("→")
        from_name = from_to[0].strip() if from_to else ""
        to_name = from_to[1].strip() if len(from_to) > 1 else ""

        # Detect color from route name
        color = "#888888"
        if "Red" in route_name:
            color = "#FF0000"
        elif "Orange" in route_name:
            color = "#FF8C00"
        elif "Green" in route_name or "FR-" in route_name:
            color = "#008000"

        parsed.append({
            "route_name": route_name,
            "route_color": color,
            "from_name": from_name,
            "to_name": to_name,
            "step_text": step_text,
            "distance_km": None,
            "time_minutes": None,
            "fare_pkr": None,
            "stops_count": None,
        })
    return parsed


@route_search_bp.route("/api/routes", methods=["GET"])
def find_route():
    """
    Find a route between two stops.
    Query params:
        from (str): departure stop ID
        to (str): destination stop ID
    Strategy:
        1. Try Dijkstra on the reliable_metro_graph
        2. Fall back to pre-computed routes if Dijkstra fails
    """
    from_id = request.args.get("from", "").strip()
    to_id = request.args.get("to", "").strip()

    if not from_id or not to_id:
        return jsonify({"error": "Both 'from' and 'to' params are required"}), 400

    if from_id == to_id:
        return jsonify({"error": "Departure and destination cannot be the same"}), 400

    graph = _get_graph()
    precomputed = _get_precomputed_routes()

    # Strategy 1: Dijkstra on graph
    result = _dijkstra(graph, from_id, to_id)
    if result:
        result["source"] = "graph"
        result["from_id"] = from_id
        result["to_id"] = to_id
        result["from_name"] = graph["nodes"].get(from_id, {}).get("name", from_id)
        result["to_name"] = graph["nodes"].get(to_id, {}).get("name", to_id)
        return jsonify(result)

    # Strategy 2: Pre-computed routes
    pc = _try_precomputed(from_id, to_id, precomputed, graph)
    if pc:
        pc["from_id"] = from_id
        pc["to_id"] = to_id
        return jsonify(pc)

    # Strategy 3: Try reverse in pre-computed
    pc_rev = _try_precomputed(to_id, from_id, precomputed, graph)
    if pc_rev:
        pc_rev["from_id"] = from_id
        pc_rev["to_id"] = to_id
        pc_rev["note"] = "Route shown in reverse direction"
        return jsonify(pc_rev)

    return jsonify({
        "error": "No route found",
        "from_id": from_id,
        "to_id": to_id,
    }), 404


@route_search_bp.route("/api/routes/info", methods=["GET"])
def route_info():
    """Return metadata about all available metro lines/routes."""
    graph = _get_graph()
    routes = graph.get("routes", {})

    if isinstance(routes, dict):
        result = [{"id": k, **v} for k, v in routes.items()]
    else:
        result = routes

    return jsonify({"routes": result, "total": len(result)})
