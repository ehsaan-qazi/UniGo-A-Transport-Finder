/**
 * UniGo Configuration File
 * Contains API keys, application settings, and constants
 */

const CONFIG = {
  // Google Maps API Configuration
  googleMaps: {
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE', // Replace with your actual API key
    center: {
      lat: 33.6844, // Islamabad center
      lng: 73.0479
    },
    zoom: 12,
    mapOptions: {
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    }
  },

  // Metro Line Colors
  metroLines: {
    red: {
      color: '#E53935',
      name: 'Red Line'
    },
    orange: {
      color: '#FB8C00',
      name: 'Orange Line'
    },
    green: {
      color: '#43A047',
      name: 'Green Line'
    },
    greenFeeder: {
      color: '#66BB6A',
      name: 'Green Feeder'
    }
  },

  // Application Settings
  app: {
    name: 'UniGo',
    version: '2.0.0',
    debug: true, // Set to false in production
    animationDelay: 300 // milliseconds
  },

  // Route Data Files
  dataFiles: {
    routes: 'src/data/unigo_transport_routes_full_slugged.json',
    stops: 'src/data/stops.json' // To be created
  },

  // Path settings
  paths: {
    images: 'images/',
    css: 'src/css/',
    js: 'src/js/'
  }
};

// Export for use in modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

