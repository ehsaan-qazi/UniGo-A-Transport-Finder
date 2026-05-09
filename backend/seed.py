"""
Seed script — loads stops from reliable_metro_graph.json into the SQLite database.
Run once: python seed.py
"""
import json
import sys
from pathlib import Path

# Add backend dir to path so we can import app/models
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app
from models import db, Stop


def seed_stops():
    """Read nodes from reliable_metro_graph.json and insert into DB."""
    app = create_app()

    graph_path = app.config["GRAPH_DATA_PATH"]
    print(f"[seed] Loading graph from: {graph_path}")

    with open(graph_path, "r", encoding="utf-8") as f:
        graph = json.load(f)

    nodes = graph.get("nodes", {})
    print(f"[seed] Found {len(nodes)} nodes in graph")

    with app.app_context():
        # Drop and recreate all tables
        db.create_all()

        inserted = 0
        skipped = 0

        for node_id, node_data in nodes.items():
            # Check if already exists
            existing = db.session.get(Stop, node_id)
            if existing:
                skipped += 1
                continue

            stop = Stop(
                id=node_id,
                name=node_data.get("name", node_id),
                latitude=node_data.get("latitude", 0.0),
                longitude=node_data.get("longitude", 0.0),
                stop_type=node_data.get("type", "regular_stop"),
                is_transfer_point=node_data.get("is_transfer_point", False),
                wheelchair_accessible=node_data.get("wheelchair_accessible", False),
                routes_serving=",".join(node_data.get("routes_serving", [])),
            )
            db.session.add(stop)
            inserted += 1

        db.session.commit()
        print(f"[seed] Done! Inserted: {inserted}, Skipped (already exist): {skipped}")
        print(f"[seed] Total stops in DB: {Stop.query.count()}")


if __name__ == "__main__":
    seed_stops()
