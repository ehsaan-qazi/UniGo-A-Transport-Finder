"""
UniGo Flask Backend Configuration
Supports dev (SQLite) and prod (PostgreSQL) environments.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get("SECRET_KEY", "unigo-dev-secret-change-in-prod")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Path to the main data file
    GRAPH_DATA_PATH = os.environ.get(
        "GRAPH_DATA_PATH",
        str(BASE_DIR.parent / "data" / "reliable_metro_graph.json")
    )

    # Path to the pre-computed routes file (fallback for direct lookups)
    ROUTES_DATA_PATH = os.environ.get(
        "ROUTES_DATA_PATH",
        str(BASE_DIR.parent / "data" / "unigo_transport_routes_full_slugged.json")
    )


class DevelopmentConfig(Config):
    """Development configuration — uses SQLite."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'unigo.db'}"
    )


class ProductionConfig(Config):
    """Production configuration — uses PostgreSQL via DATABASE_URL."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "")


# Map environment names to config classes
config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
