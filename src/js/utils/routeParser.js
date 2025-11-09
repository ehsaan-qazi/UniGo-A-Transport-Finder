/**
 * UniGo Route Parser
 * Handles parsing and transformation of route data
 */

const RouteParser = {
  /**
   * Map of bus line names to image paths
   */
  busImages: {
    "Red Line": "images/red-line.png",
    "Orange Line": "images/orange-line.png",
    "Green Line": "images/green-line.jpeg",
    "FR-01": "images/green-feeders/fr-01.png",
    "FR-02": "images/green-feeders/fr-02.png",
    "FR-03": "images/green-feeders/fr-03.png",
    "FR-03A": "images/green-feeders/fr-03a.png",
    "FR-04": "images/green-feeders/fr-04.png",
    "FR-04A": "images/green-feeders/fr-04a.png",
    "FR-05": "images/green-feeders/fr-05.png",
    "FR-06": "images/green-feeders/fr-06.png",
    "FR-07": "images/green-feeders/fr-07.png",
    "FR-08C": "images/green-feeders/fr-08c.png",
    "FR-08A": "images/green-feeders/fr-08a.png",
    "FR-09": "images/green-feeders/fr-09.png",
    "FR-13": "images/green-feeders/fr-13.png"
  },

  /**
   * Get bus image path based on step text
   * @param {string} stepText - Route step description
   * @returns {string|null} Image path or null
   */
  getBusImage(stepText) {
    if (stepText.includes("Red Line")) return this.busImages["Red Line"];
    if (stepText.includes("Orange Line")) return this.busImages["Orange Line"];
    
    const feederMatch = stepText.match(/FR-\d+[A-Z]?/i);
    if (feederMatch) {
      const code = feederMatch[0].toUpperCase();
      return this.busImages[code] || this.busImages["Green Line"];
    }
    
    if (stepText.includes("Green")) return this.busImages["Green Line"];
    return null;
  },

  /**
   * Reverse the direction of a route step
   * @param {string} text - Original step text
   * @returns {string} Reversed step text
   */
  reverseStepText(text) {
    const match = text.match(/^(.*? from )(.+?)( →| via | -> )(.+?)$/i);
    if (match) {
      const [, routePart, fromLocation, arrow, toLocation] = match;
      return `${routePart}${toLocation.trim()}${arrow}${fromLocation.trim()}`;
    }
    return text;
  },

  /**
   * Find route between two locations
   * @param {Array} routes - Array of all routes
   * @param {string} from - Starting location slug
   * @param {string} to - Destination location slug
   * @returns {Object|null} Route object with steps or null
   */
  findRoute(routes, from, to) {
    // Try direct route
    const direct = routes.find(r => r.from === from && r.to === to);
    if (direct?.options?.length) {
      return {
        steps: direct.options[0].steps.slice(),
        label: direct.options[0].label || 'Recommended Route',
        reversed: false
      };
    }

    // Try reverse route
    const reverse = routes.find(r => r.from === to && r.to === from);
    if (reverse?.options?.length) {
      return {
        steps: reverse.options[0].steps
          .slice()
          .reverse()
          .map(s => this.reverseStepText(s)),
        label: reverse.options[0].label || 'Recommended Route',
        reversed: true
      };
    }

    return null;
  },

  /**
   * Extract all unique stops from route steps
   * @param {Array} steps - Array of route steps
   * @returns {Array} Array of stop names
   */
  extractStops(steps) {
    const stops = [];
    
    steps.forEach(stepText => {
      const parsed = UniGoHelpers.parseStepInfo(stepText);
      if (parsed) {
        if (!stops.includes(parsed.from)) {
          stops.push(parsed.from);
        }
        if (!stops.includes(parsed.to)) {
          stops.push(parsed.to);
        }
      }
    });

    return stops;
  },

  /**
   * Get route segments with line information
   * @param {Array} steps - Array of route steps
   * @returns {Array} Array of segments with line type and stops
   */
  getRouteSegments(steps) {
    return steps.map(stepText => {
      const parsed = UniGoHelpers.parseStepInfo(stepText);
      const lineType = UniGoHelpers.getLineType(stepText);
      const feederCode = UniGoHelpers.getFeederCode(stepText);
      const image = this.getBusImage(stepText);

      return {
        text: stepText,
        line: parsed?.line || '',
        from: parsed?.from || '',
        to: parsed?.to || '',
        lineType: lineType,
        feederCode: feederCode,
        image: image
      };
    });
  },

  /**
   * Calculate total transfer count
   * @param {Array} steps - Array of route steps
   * @returns {number} Number of transfers
   */
  countTransfers(steps) {
    // Each step is a segment, transfers are between different lines
    return Math.max(0, steps.length - 1);
  },

  /**
   * Get location display name from dropdown
   * @param {string} value - Location value/slug
   * @param {string} dropdownId - ID of the dropdown element
   * @returns {string} Display name or value
   */
  getLocationName(value, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return value;
    
    const option = dropdown.querySelector(`option[value="${value}"]`);
    return option ? option.text : value;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RouteParser;
}

