/**
 * UniGo Helper Functions
 * Utility functions used throughout the application
 */

const UniGoHelpers = {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Object} coord1 - First coordinate {lat, lng}
   * @param {Object} coord2 - Second coordinate {lat, lng}
   * @returns {number} Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * 
      Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Convert degrees to radians
   * @param {number} degrees
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  },

  /**
   * Estimate travel time based on distance (assuming average speed of 30 km/h)
   * @param {number} distance - Distance in kilometers
   * @returns {number} Time in minutes
   */
  estimateTravelTime(distance) {
    const averageSpeed = 30; // km/h for metro
    return Math.ceil((distance / averageSpeed) * 60);
  },

  /**
   * Format time to readable string
   * @param {number} minutes
   * @returns {string} Formatted time string
   */
  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  },

  /**
   * Debounce function to limit rapid function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Slugify a string (convert to lowercase, replace spaces with hyphens)
   * @param {string} text
   * @returns {string} Slugified string
   */
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Get line type from step text
   * @param {string} stepText
   * @returns {string} Line type (red, orange, green, green-feeder)
   */
  getLineType(stepText) {
    if (stepText.includes('Red Line')) return 'red';
    if (stepText.includes('Orange Line')) return 'orange';
    if (stepText.includes('Green Feeder') || /FR-\d+/i.test(stepText)) return 'green-feeder';
    if (stepText.includes('Green Line')) return 'green';
    return 'unknown';
  },

  /**
   * Get feeder route code from step text
   * @param {string} stepText
   * @returns {string|null} Feeder code (e.g., "FR-01") or null
   */
  getFeederCode(stepText) {
    const match = stepText.match(/FR-\d+[A-Z]?/i);
    return match ? match[0].toUpperCase() : null;
  },

  /**
   * Parse stop names from step text
   * @param {string} stepText - E.g., "Red Line from Faizabad → PIMS"
   * @returns {Object} {from: string, to: string, line: string}
   */
  parseStepInfo(stepText) {
    const regex = /^(.+?) from (.+?)(?:→|->|via)(.+?)$/i;
    const match = stepText.match(regex);
    
    if (match) {
      return {
        line: match[1].trim(),
        from: match[2].trim(),
        to: match[3].trim()
      };
    }
    
    return null;
  },

  /**
   * Show loading indicator
   * @param {string} message - Optional loading message
   */
  showLoading(message = 'Loading...') {
    // Implementation depends on your UI design
    console.log(`Loading: ${message}`);
  },

  /**
   * Hide loading indicator
   */
  hideLoading() {
    console.log('Loading complete');
  },

  /**
   * Show error message to user
   * @param {string} message - Error message
   */
  showError(message) {
    alert(`Error: ${message}`);
  },

  /**
   * Log debug information (only if debug mode is enabled)
   * @param  {...any} args - Arguments to log
   */
  debug(...args) {
    if (CONFIG && CONFIG.app && CONFIG.app.debug) {
      console.log('[UniGo Debug]:', ...args);
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniGoHelpers;
}

