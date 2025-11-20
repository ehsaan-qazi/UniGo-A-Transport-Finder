/**
 * UniGo Data Loader
 * Handles loading and caching of route data
 */

const DataLoader = {
  routes: [],
  graph: null,
  stops: {},
  isRoutesLoaded: false,
  isGraphLoaded: false,
  isStopsLoaded: false,
  loadingPromises: {},

  // Mapping from Dropdown Values (Slugs) to Graph Node IDs
  slugMapping: {
    "comsats": "comsats-university",
    "nust": "nust-metro-station", // or "nust" depending on graph
    "qau": "quaid-azam-university",
    "iiu": "islamic-university",
    "bahria-uni": "bahria-university",
    "air-uni": "air-university", // Check graph
    "fast-uni": "fast-university",
    "nust-smme": "nust-smme", // Check graph
    "iqra-uni": "iqra-university", // Check graph
    "riphah-uni": "riphah-university", // Check graph
    "preston-uni": "preston-university", // Check graph
    "iiui-female": "iiui-female-campus", // Check graph
    "saddar": "saddar",
    "committee-chowk": "committee-chowk",
    "faizabad": "faizabad",
    "pir-wadhai": "pir-wadhai-morh", // Check graph
    "blue-area": "blue-area",
    "g9": "g-9-markaz",
    "centaurus": "centaurus", // Check graph
    "peshawar-mor": "peshawar-mor",
    "f6": "f-6", // Check graph
    "f7": "f-7-markaz",
    "f8": "f-8-markaz",
    "g10": "g-10-markaz",
    "g11": "g-11-markaz",
    "bahria-town": "bahria-town", // Check graph
    "dha": "dha-gate-07", // Check graph
    "pwd": "pwd-housing-society"
  },

  /**
   * Load route data from JSON file (Legacy support + Graph)
   */
  async loadRoutes() {
    // Load Graph Data
    if (!this.isGraphLoaded && !this.loadingPromises.graph) {
      this.loadingPromises.graph = fetch('data/graph.json')
        .then(r => r.json())
        .then(data => {
          this.graph = data;
          this.isGraphLoaded = true;
          UniGoHelpers.debug('Graph loaded successfully:', Object.keys(this.graph.nodes).length, 'nodes');
          return this.graph;
        })
        .catch(e => {
          console.error('Failed to load graph:', e);
          return null;
        });
    }

    // Keep loading legacy routes for now as fallback or for other features
    if (this.isRoutesLoaded) return Promise.resolve(this.routes);
    if (this.loadingPromises.routes) return this.loadingPromises.routes;

    const routesFile = CONFIG?.dataFiles?.routes || 'src/data/unigo_transport_routes_full_slugged.json';
    this.loadingPromises.routes = fetch(routesFile)
      .then(r => r.json())
      .then(data => {
        this.routes = Array.isArray(data) ? data : [];
        this.isRoutesLoaded = true;
        return this.routes;
      })
      .catch(e => {
        console.warn('Failed to load legacy routes:', e);
        return [];
      });

    return Promise.all([this.loadingPromises.graph, this.loadingPromises.routes]);
  },

  async loadStops() {
    // Placeholder for future
    return {};
  },

  async loadAll() {
    await this.loadRoutes();
  },

  /**
   * Search for a route between two locations
   * Uses Dynamic Pathfinding if available, otherwise falls back to legacy
   */
  async searchRoute(from, to) {
    await this.loadRoutes();

    // Try Dynamic Search first
    if (this.isGraphLoaded && window.UniGoPathfinder) {
      const startNode = this.slugMapping[from] || from;
      const endNode = this.slugMapping[to] || to;

      UniGoHelpers.debug(`Searching graph: ${startNode} -> ${endNode}`);

      const path = UniGoPathfinder.findShortestPath(this.graph, startNode, endNode);

      if (path) {
        const formattedSteps = UniGoPathfinder.formatPath(path);
        return {
          label: "Recommended Route (Dynamic)",
          steps: formattedSteps
        };
      } else {
        UniGoHelpers.debug('No dynamic path found, trying legacy...');
      }
    }

    // Fallback to Legacy Search
    return RouteParser.findRoute(this.routes, from, to);
  },

  // ... (Other methods kept simple)
  async getStop(stopId) { return null; },
  reset() {
    this.routes = [];
    this.graph = null;
    this.isRoutesLoaded = false;
    this.isGraphLoaded = false;
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

