/**
 * UniGo Data Loader
 * DEPRECATED: Route search now handled by Flask backend API.
 * This module is kept for backward compatibility — loads local routes
 * as a fallback if the backend is unreachable.
 */

const DataLoader = {
  routes: [],
  isRoutesLoaded: false,
  loadingPromises: {},

  /**
   * Load route data from local JSON file (fallback only).
   * Graph loading removed — Dijkstra runs on the backend now.
   */
  async loadRoutes() {
    if (this.isRoutesLoaded) return Promise.resolve(this.routes);
    if (this.loadingPromises.routes) return this.loadingPromises.routes;

    const routesFile = CONFIG?.dataFiles?.routes || 'data/unigo_transport_routes_full_slugged.json';
    this.loadingPromises.routes = fetch(routesFile)
      .then(r => r.json())
      .then(data => {
        this.routes = Array.isArray(data) ? data : [];
        this.isRoutesLoaded = true;
        UniGoHelpers.debug('Local routes loaded (fallback):', this.routes.length, 'routes');
        return this.routes;
      })
      .catch(e => {
        console.warn('[UniGo] Failed to load local routes (fallback):', e);
        return [];
      });

    return this.loadingPromises.routes;
  },

  async loadAll() {
    await this.loadRoutes();
  },

  /**
   * Search for a route — uses backend API first, falls back to local.
   * @deprecated Use script.js findTrans() directly instead.
   */
  async searchRoute(from, to) {
    // Try backend API first
    const apiBase = CONFIG?.apiBase || 'http://127.0.0.1:5000';
    const fromId = CONFIG?.slugToNodeId?.[from] || from;
    const toId = CONFIG?.slugToNodeId?.[to] || to;

    try {
      const res = await fetch(`${apiBase}/api/routes?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`);
      if (res.ok) {
        const data = await res.json();
        // Convert API format to legacy format for backward compatibility
        const textSteps = (data.path || []).map(s => {
          const routeName = s.route_name || s.route_id || 'Unknown';
          return `${routeName} from ${s.from_name} → ${s.to_name}`;
        });
        return {
          label: `${data.total_time_minutes || '?'} min · Rs. ${data.total_fare_pkr || 50}`,
          steps: textSteps,
          apiData: data
        };
      }
    } catch (e) {
      UniGoHelpers.debug('Backend unavailable, using local fallback');
    }

    // Fallback: local search
    await this.loadRoutes();
    return RouteParser.findRoute(this.routes, from, to);
  },

  async getStop(stopId) { return null; },
  reset() {
    this.routes = [];
    this.isRoutesLoaded = false;
  }
};

// Auto-load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    DataLoader.loadAll().catch(console.error);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}
