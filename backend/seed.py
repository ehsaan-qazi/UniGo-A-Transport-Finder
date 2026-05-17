"""
Seed script — loads stops from the dynamically-built graph into the database.
The graph is built from stops.json + lines.json at app startup.
Run once: python seed.py
"""
import sys
from pathlib import Path

# Add backend dir to path so we can import app/models
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app
from models import db, Stop


def seed_stops():
    """Read nodes from the dynamic graph and insert/update the database."""
    app = create_app()

    graph = app.config.get("GRAPH_DATA", {})
    nodes = graph.get("nodes", {})
    print(f"[seed] Graph has {len(nodes)} nodes")

    with app.app_context():
        db.create_all()

        # Wipe existing stops for a clean reseed
        deleted = Stop.query.delete()
        print(f"[seed] Cleared {deleted} existing stops")

        inserted = 0
        for node_id, node_data in nodes.items():
            stop = Stop(
                id=node_id,
                name=node_data.get("name", node_id),
                latitude=node_data.get("lat", 0.0),
                longitude=node_data.get("lon", 0.0),
                stop_type="major_hub" if node_data.get("is_transfer_point") else "regular_stop",
                is_transfer_point=node_data.get("is_transfer_point", False),
                wheelchair_accessible=False,
                routes_serving=",".join(node_data.get("routes_serving", [])),
            )
            db.session.add(stop)
            inserted += 1

        db.session.commit()
        print(f"[seed] Inserted {inserted} stops")
        print(f"[seed] Total stops in DB: {Stop.query.count()}")


if __name__ == "__main__":
    seed_stops()
