/**
 * UniGo Search Component
 * Handles route search functionality
 */

const SearchComponent = {
  /**
   * Initialize search functionality
   */
  init() {
    this.attachSearchHandler();
    UniGoHelpers.debug('Search component initialized');
  },

  /**
   * Attach event handler to search button
   */
  attachSearchHandler() {
    const searchButton = document.getElementById('search');
    if (searchButton) {
      searchButton.addEventListener('click', () => this.performSearch());
    }

    // Also allow Enter key on dropdowns
    const departureDropdown = document.getElementById('departure-dropdown');
    const destinationDropdown = document.getElementById('destination-dropdown');

    if (departureDropdown) {
      departureDropdown.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });
    }

    if (destinationDropdown) {
      destinationDropdown.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch();
      });
    }
  },

  /**
   * Perform route search
   */
  async performSearch() {
    const departureDropdown = document.getElementById('departure-dropdown');
    const destinationDropdown = document.getElementById('destination-dropdown');

    if (!departureDropdown || !destinationDropdown) {
      UniGoHelpers.showError('Search form not found');
      return;
    }

    const from = departureDropdown.value;
    const to = destinationDropdown.value;

    if (!from || !to) {
      UniGoHelpers.showError('Please select both departure and destination');
      return;
    }

    if (from === to) {
      UniGoHelpers.showError('Departure and destination cannot be the same');
      return;
    }

    try {
      UniGoHelpers.showLoading('Searching for routes...');

      const routeData = await DataLoader.searchRoute(from, to);

      const fromLabel = RouteParser.getLocationName(from, 'departure-dropdown');
      const toLabel = RouteParser.getLocationName(to, 'destination-dropdown');

      if (routeData) {
        UniGoUI.displaySearchResults(routeData, fromLabel, toLabel);
      } else {
        UniGoUI.displaySearchResults(null, fromLabel, toLabel);
      }

      UniGoHelpers.hideLoading();
    } catch (error) {
      console.error('[UniGo] Search error:', error);
      UniGoHelpers.hideLoading();
      UniGoHelpers.showError('Failed to search for routes. Please try again.');
    }
  },

  /**
   * Validate search inputs
   * @param {string} from - Departure location
   * @param {string} to - Destination location
   * @returns {boolean} True if valid
   */
  validateInputs(from, to) {
    if (!from || !to) {
      UniGoHelpers.showError('Please select both departure and destination');
      return false;
    }

    if (from === to) {
      UniGoHelpers.showError('Departure and destination cannot be the same');
      return false;
    }

    return true;
  }
};

// Make search function available globally for inline onclick handlers
function findTrans() {
  SearchComponent.performSearch();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SearchComponent.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchComponent;
}

