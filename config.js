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
    version: '2.1.0',
    debug: true, // Set to false in production
    animationDelay: 300 // milliseconds
  },

  // Backend API
  apiBase: 'https://unigo-backend-53re.onrender.com',

  // Route Data Files (local fallback — backend is primary)
  dataFiles: {
    routes: 'data/unigo_transport_routes_full_slugged.json'
  },

  // Path settings
  paths: {
    images: 'images/',
    css: 'src/css/',
    js: 'src/js/'
  },

  // Mapping: dropdown slug → graph node ID (reliable_metro_graph.json)
  // Needed because dropdown values don't match graph node IDs directly
  slugToNodeId: {
    'comsats': 'comsats_university',
    'nust': 'nust',
    'qau': 'islamic_university',      // closest match in graph
    'iiu': 'islamic_university',
    'bahria-uni': 'bahria_university',
    'air-uni': 'nust',                 // no direct match — nearest hub
    'fast-uni': 'fast_university',
    'nust-smme': 'nust',
    'iqra-uni': 'nust',                // no direct match — nearest hub
    'riphah-uni': 'faizabad',          // no direct match — nearest hub
    'preston-uni': 'faizabad',         // no direct match — nearest hub
    'iiui-female': 'islamic_university',
    'saddar': 'saddar',
    'committee-chowk': 'committee_chowk',
    'faizabad': 'faizabad',
    'pir-wadhai': 'pir_wadhai_morh',
    'blue-area': 'stock_exchange',     // closest match in graph
    'g9': 'sabzi_mandi',              // closest match in graph
    'centaurus': 'stock_exchange',     // closest match in graph
    'peshawar-mor': 'nust',            // no direct match — nearest hub
    'f6': 'stock_exchange',            // closest match in graph
    'f7': 'stock_exchange',            // closest match in graph
    'f8': 'pims',                      // closest match in graph
    'g10': 'g10_g11',
    'g11': 'g10_g11',
    'bahria-town': 'bahria_university',
    'dha': 'dha_gate_07',
    'pwd': 'pwd_housing_society'
  }
};

// Export for use in modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

