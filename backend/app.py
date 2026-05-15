"""
UniGo Flask Application
Entry point for the backend API server.
Loads graph data into memory at startup, registers all blueprints.
"""
import json
import os
from flask import Flask
from flask_cors import CORS
from models import db
from config import config_map


def create_app(config_name=None):
    """Application factory."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # Initialize extensions
    db.init_app(app)
    CORS(app)  # Allow all origins for dev — restrict in production

    # Load graph data into memory at startup
    _load_graph_data(app)
    _load_precomputed_routes(app)

    # Register blueprints
    from routes.stops import stops_bp
    from routes.route_search import route_search_bp
    from routes.favourites import favourites_bp
    from routes.recent import recent_bp
    from routes.reports import reports_bp

    app.register_blueprint(stops_bp)
    app.register_blueprint(route_search_bp)
    app.register_blueprint(favourites_bp)
    app.register_blueprint(recent_bp)
    app.register_blueprint(reports_bp)

    # Health check
    @app.route("/api/health")
    def health():
        graph = app.config.get("GRAPH_DATA", {})
        nodes_count = len(graph.get("nodes", {}))
        edges_count = len(graph.get("edges", []))
        return {
            "status": "ok",
            "nodes": nodes_count,
            "edges": edges_count,
            "routes": len(graph.get("routes", {})),
        }

    # Create DB tables on first request (dev convenience)
    with app.app_context():
        db.create_all()

    return app


def _load_graph_data(app):
    """Load reliable_metro_graph.json into app.config['GRAPH_DATA']."""
    path = app.config.get("GRAPH_DATA_PATH", "")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            app.config["GRAPH_DATA"] = json.load(f)
        nodes = len(app.config["GRAPH_DATA"].get("nodes", {}))
        edges = len(app.config["GRAPH_DATA"].get("edges", []))
        print(f"[UniGo] Loaded graph: {nodes} nodes, {edges} edges")
    else:
        print(f"[UniGo] WARNING: Graph file not found at {path}")
        app.config["GRAPH_DATA"] = {}


def _load_precomputed_routes(app):
    """Load unigo_transport_routes_full_slugged.json as fallback."""
    path = app.config.get("ROUTES_DATA_PATH", "")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            app.config["PRECOMPUTED_ROUTES"] = json.load(f)
        count = len(app.config["PRECOMPUTED_ROUTES"])
        print(f"[UniGo] Loaded {count} pre-computed routes (fallback)")
    else:
        print(f"[UniGo] WARNING: Pre-computed routes not found at {path}")
        app.config["PRECOMPUTED_ROUTES"] = []


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
@app.route('/api/health')
def health():
    return {'status': 'ok'}