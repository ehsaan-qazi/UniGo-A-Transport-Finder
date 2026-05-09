"""
UniGo Database Models
Stores stops (seeded from graph JSON), favourites, recent searches, and community reports.
Routes are NOT stored in the DB — they're loaded in memory from the JSON graph.
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Stop(db.Model):
    """A metro/bus stop with coordinates and metadata."""
    __tablename__ = "stops"

    id = db.Column(db.String(100), primary_key=True)  # e.g. "nust", "pims"
    name = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    stop_type = db.Column(db.String(50), default="regular_stop")
    is_transfer_point = db.Column(db.Boolean, default=False)
    wheelchair_accessible = db.Column(db.Boolean, default=False)
    routes_serving = db.Column(db.Text, default="")  # comma-separated route IDs

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "type": self.stop_type,
            "is_transfer_point": self.is_transfer_point,
            "wheelchair_accessible": self.wheelchair_accessible,
            "routes_serving": [r.strip() for r in self.routes_serving.split(",") if r.strip()],
        }


class FavouriteRoute(db.Model):
    """A user's saved favourite route (identified by session/device ID for now)."""
    __tablename__ = "favourites"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    device_id = db.Column(db.String(100), nullable=False, index=True)
    from_stop_id = db.Column(db.String(100), db.ForeignKey("stops.id"), nullable=False)
    to_stop_id = db.Column(db.String(100), db.ForeignKey("stops.id"), nullable=False)
    route_label = db.Column(db.String(200), default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    from_stop = db.relationship("Stop", foreign_keys=[from_stop_id])
    to_stop = db.relationship("Stop", foreign_keys=[to_stop_id])

    def to_dict(self):
        return {
            "id": self.id,
            "from_stop": self.from_stop.to_dict() if self.from_stop else None,
            "to_stop": self.to_stop.to_dict() if self.to_stop else None,
            "route_label": self.route_label,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RecentSearch(db.Model):
    """Tracks recent searches per device."""
    __tablename__ = "recent_searches"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    device_id = db.Column(db.String(100), nullable=False, index=True)
    from_stop_id = db.Column(db.String(100), db.ForeignKey("stops.id"), nullable=False)
    to_stop_id = db.Column(db.String(100), db.ForeignKey("stops.id"), nullable=False)
    searched_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    from_stop = db.relationship("Stop", foreign_keys=[from_stop_id])
    to_stop = db.relationship("Stop", foreign_keys=[to_stop_id])

    def to_dict(self):
        return {
            "id": self.id,
            "from_stop": self.from_stop.to_dict() if self.from_stop else None,
            "to_stop": self.to_stop.to_dict() if self.to_stop else None,
            "searched_at": self.searched_at.isoformat() if self.searched_at else None,
        }


class StopReport(db.Model):
    """Community-submitted report about a stop (crowded, broken, unsafe, etc.)."""
    __tablename__ = "stop_reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    stop_id = db.Column(db.String(100), db.ForeignKey("stops.id"), nullable=False)
    issue_type = db.Column(db.String(50), nullable=False)  # crowded, broken, unsafe, other
    description = db.Column(db.Text, default="")
    reporter_name = db.Column(db.String(100), default="Anonymous")
    reported_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_resolved = db.Column(db.Boolean, default=False)

    stop = db.relationship("Stop", backref="reports")

    def to_dict(self):
        return {
            "id": self.id,
            "stop_id": self.stop_id,
            "stop_name": self.stop.name if self.stop else None,
            "issue_type": self.issue_type,
            "description": self.description,
            "reporter_name": self.reporter_name,
            "reported_at": self.reported_at.isoformat() if self.reported_at else None,
            "is_resolved": self.is_resolved,
        }
