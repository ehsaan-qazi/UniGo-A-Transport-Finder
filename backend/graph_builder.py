"""
UniGo Dynamic Graph Builder
Reads stops.json and lines.json and builds an in-memory graph
with auto-calculated distances (Haversine) and travel times.
No more hand-maintained graph files!
"""
import json
import math
import os
from pathlib import Path


# ── Haversine formula ──────────────────────────────────────
def haversine_km(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two GPS points in kilometers.
    """
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Fare table (per line, charged once per unique line used) ──
FARE_TABLE = {
    "red_line": 30,
    "orange_line": 50,
}
DEFAULT_FARE = 50  # Green feeders and others

# Average speed for routes with no schedule data (km/h)
FALLBACK_SPEED_KMH = 35.0


def build_graph(stops_path, lines_path):
    """
    Build a complete routing graph from stops.json and lines.json.

    Returns a dict with:
        nodes:  {stop_id: {name, lat, lon, routes_serving, is_transfer_point, aliases}}
        edges:  [list of edge dicts]
        routes: {route_id: {name, short_name, color, fare}}
        adj:    {node_id: [list of edge dicts]}  (prebuilt adjacency)
    """
    with open(stops_path, "r", encoding="utf-8") as f:
        stops_raw = json.load(f)
    with open(lines_path, "r", encoding="utf-8") as f:
        lines_raw = json.load(f)

    # ── Build nodes ──
    nodes = {}
    for stop_id, data in stops_raw.items():
        nodes[stop_id] = {
            "id": stop_id,
            "name": data["name"],
            "lat": data.get("lat"),
            "lon": data.get("lon"),
            "routes_serving": data.get("routes_serving", []),
            "is_transfer_point": data.get("is_transfer_point", False),
            "aliases": data.get("aliases", []),
        }

    # ── Build routes metadata + edges ──
    routes_meta = {}
    edges = []
    edge_counter = 0

    for line in lines_raw:
        route_id = line["route_id"]
        routes_meta[route_id] = {
            "id": route_id,
            "name": line.get("short_name", route_id),
            "long_name": line.get("route_name", ""),
            "color": line.get("color", "#888888"),
            "fare": FARE_TABLE.get(route_id, DEFAULT_FARE),
            "headway_min": line.get("average_headway_min"),
            "total_trips": line.get("total_trips"),
        }

        stop_list = line["stops"]
        has_schedule = any(
            s.get("time_from_start_sec") is not None for s in stop_list
        )

        for i in range(len(stop_list) - 1):
            from_entry = stop_list[i]
            to_entry = stop_list[i + 1]
            from_id = from_entry["stop_id"]
            to_id = to_entry["stop_id"]

            # Skip if nodes are missing (safety)
            if from_id not in nodes or to_id not in nodes:
                continue

            from_node = nodes[from_id]
            to_node = nodes[to_id]

            # ── Distance (Haversine) ──
            if (
                from_node["lat"] is not None
                and from_node["lon"] is not None
                and to_node["lat"] is not None
                and to_node["lon"] is not None
            ):
                dist_km = haversine_km(
                    from_node["lat"], from_node["lon"],
                    to_node["lat"], to_node["lon"],
                )
            else:
                dist_km = 1.0  # Fallback if coordinates missing

            dist_km = round(dist_km, 3)

            # ── Time ──
            if (
                has_schedule
                and from_entry.get("time_from_start_sec") is not None
                and to_entry.get("time_from_start_sec") is not None
            ):
                # Real schedule data: exact travel time
                time_sec = to_entry["time_from_start_sec"] - from_entry["time_from_start_sec"]
                time_min = round(max(time_sec, 0) / 60.0, 1)
            else:
                # Estimate from distance and fallback speed
                time_min = round((dist_km / FALLBACK_SPEED_KMH) * 60.0, 1)

            edge_id = f"e_{edge_counter}"
            edge_counter += 1

            # Forward edge
            edges.append({
                "id": edge_id,
                "from": from_id,
                "to": to_id,
                "route_id": route_id,
                "distance_km": dist_km,
                "time_minutes": time_min,
            })

            # Reverse edge (buses run both directions)
            edge_counter += 1
            edges.append({
                "id": f"e_{edge_counter}",
                "from": to_id,
                "to": from_id,
                "route_id": route_id,
                "distance_km": dist_km,
                "time_minutes": time_min,
            })

    # ── Build adjacency list for fast Dijkstra lookup ──
    adj = {}
    for edge in edges:
        from_id = edge["from"]
        if from_id not in adj:
            adj[from_id] = []
        adj[from_id].append(edge)

    graph = {
        "nodes": nodes,
        "edges": edges,
        "routes": routes_meta,
        "adj": adj,
    }

    return graph


def get_graph_stats(graph):
    """Return a summary of the built graph."""
    nodes = graph.get("nodes", {})
    edges = graph.get("edges", [])
    routes = graph.get("routes", {})
    transfers = sum(1 for n in nodes.values() if n.get("is_transfer_point"))
    no_coords = sum(1 for n in nodes.values() if n.get("lat") is None)

    return {
        "nodes": len(nodes),
        "edges": len(edges),
        "routes": len(routes),
        "transfer_points": transfers,
        "stops_without_coords": no_coords,
    }


# ── Standalone test ──
if __name__ == "__main__":
    data_dir = Path(__file__).resolve().parent.parent / "data"
    stops_path = str(data_dir / "stops.json")
    lines_path = str(data_dir / "lines.json")

    print("[GraphBuilder] Building graph...")
    graph = build_graph(stops_path, lines_path)
    stats = get_graph_stats(graph)

    print(f"[GraphBuilder] Nodes:     {stats['nodes']}")
    print(f"[GraphBuilder] Edges:     {stats['edges']}")
    print(f"[GraphBuilder] Routes:    {stats['routes']}")
    print(f"[GraphBuilder] Transfers: {stats['transfer_points']}")
    print(f"[GraphBuilder] No coords: {stats['stops_without_coords']}")

    # Sample: show first few edges
    print("\n[GraphBuilder] Sample edges:")
    for e in graph["edges"][:6]:
        from_name = graph["nodes"][e["from"]]["name"]
        to_name = graph["nodes"][e["to"]]["name"]
        print(
            f"  {e['id']}: {from_name} -> {to_name} "
            f"({e['route_id']}) "
            f"{e['distance_km']} km, {e['time_minutes']} min"
        )

    # Check a transfer point
    print("\n[GraphBuilder] Transfer points:")
    for nid, ndata in graph["nodes"].items():
        if ndata["is_transfer_point"]:
            print(f"  {ndata['name']} ({nid}): {ndata['routes_serving']}")
