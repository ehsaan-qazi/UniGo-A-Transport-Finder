/**
 * UniGo Data Loader
 * Handles loading and caching of route data
 */

const DataLoader = {
  routes: [],
  stops: {},
  isRoutesLoaded: false,
  isStopsLoaded: false,
  loadingPromises: {},

  /**
   * Load route data from JSON file
   * @returns {Promise<Array>} Promise resolving to routes array
   */
  async loadRoutes() {
    if (this.isRoutesLoaded) {
      return Promise.resolve(this.routes);
    }

    if (this.loadingPromises.routes) {
      return this.loadingPromises.routes;
    }

    const routesFile = CONFIG?.dataFiles?.routes || 'src/data/unigo_transport_routes_full_slugged.json';
    
    this.loadingPromises.routes = fetch(routesFile)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load routes: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          this.routes = data;
          this.isRoutesLoaded = true;
          UniGoHelpers.debug('Routes loaded successfully:', this.routes.length);
          return this.routes;
        } else {
          throw new Error('Invalid routes data format');
        }
      })
      .catch(error => {
        console.error('[UniGo] Failed to load routes:', error);
        UniGoHelpers.showError('Failed to load route data. Please ensure the site is served via a local server.');
        throw error;
      })
      .finally(() => {
        delete this.loadingPromises.routes;
      });

    return this.loadingPromises.routes;
  },

  /**
   * Load stops data from JSON file (will be created in Phase 3)
   * @returns {Promise<Object>} Promise resolving to stops object
   */
  async loadStops() {
    if (this.isStopsLoaded) {
      return Promise.resolve(this.stops);
    }

    if (this.loadingPromises.stops) {
      return this.loadingPromises.stops;
    }

    const stopsFile = CONFIG?.dataFiles?.stops || 'src/data/stops.json';
    
    this.loadingPromises.stops = fetch(stopsFile)
      .then(response => {
        if (!response.ok) {
          // Stops file doesn't exist yet, that's okay
          UniGoHelpers.debug('Stops file not found (will be created in Phase 3)');
          return { stops: [], routes: {} };
        }
        return response.json();
      })
      .then(data => {
        this.stops = data;
        this.isStopsLoaded = true;
        UniGoHelpers.debug('Stops loaded successfully');
        return this.stops;
      })
      .catch(error => {
        console.warn('[UniGo] Stops data not available:', error);
        this.stops = { stops: [], routes: {} };
        return this.stops;
      })
      .finally(() => {
        delete this.loadingPromises.stops;
      });

    return this.loadingPromises.stops;
  },

  /**
   * Load all data (routes and stops)
   * @returns {Promise<Object>} Promise resolving to object with routes and stops
   */
  async loadAll() {
    try {
      const [routes, stops] = await Promise.all([
        this.loadRoutes(),
        this.loadStops()
      ]);
      return { routes, stops };
    } catch (error) {
      console.error('[UniGo] Failed to load data:', error);
      throw error;
    }
  },

  /**
   * Get routes data (load if not already loaded)
   * @returns {Promise<Array>} Routes array
   */
  async getRoutes() {
    if (!this.isRoutesLoaded) {
      await this.loadRoutes();
    }
    return this.routes;
  },

  /**
   * Get stops data (load if not already loaded)
   * @returns {Promise<Object>} Stops object
   */
  async getStops() {
    if (!this.isStopsLoaded) {
      await this.loadStops();
    }
    return this.stops;
  },

  /**
   * Search for a route between two locations
   * @param {string} from - Starting location slug
   * @param {string} to - Destination location slug
   * @returns {Promise<Object|null>} Route data or null
   */
  async searchRoute(from, to) {
    const routes = await this.getRoutes();
    return RouteParser.findRoute(routes, from, to);
  },

  /**
   * Get stop by ID
   * @param {string} stopId - Stop ID/slug
   * @returns {Promise<Object|null>} Stop data or null
   */
  async getStop(stopId) {
    const stops = await this.getStops();
    if (stops.stops && Array.isArray(stops.stops)) {
      return stops.stops.find(stop => stop.id === stopId) || null;
    }
    return null;
  },

  /**
   * Reset/clear cached data
   */
  reset() {
    this.routes = [];
    this.stops = {};
    this.isRoutesLoaded = false;
    this.isStopsLoaded = false;
    UniGoHelpers.debug('Data cache cleared');
  }
};

// Auto-load data when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    DataLoader.loadAll().catch(error => {
      console.error('[UniGo] Failed to auto-load data:', error);
    });
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}

