/**
 * UniGo UI Components
 * Handles user interface interactions and animations
 */

const UniGoUI = {
  /**
   * Initialize all UI components
   */
  init() {
    this.initMobileMenu();
    this.initPopularRoutes();
    this.initAnimations();
    UniGoHelpers.debug('UI initialized');
  },

  /**
   * Initialize mobile menu toggle
   */
  initMobileMenu() {
    const menuIcon = document.querySelector('.menu-icon');
    const overlayMenu = document.querySelector('.overlay-menu');

    if (!menuIcon || !overlayMenu) return;

    menuIcon.addEventListener('click', () => {
      overlayMenu.classList.toggle('show');
      this.toggleMenuAnimation(menuIcon, overlayMenu.classList.contains('show'));
    });

    // Close menu when clicking on links
    overlayMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        overlayMenu.classList.remove('show');
        this.toggleMenuAnimation(menuIcon, false);
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuIcon.contains(e.target) && !overlayMenu.contains(e.target)) {
        if (overlayMenu.classList.contains('show')) {
          overlayMenu.classList.remove('show');
          this.toggleMenuAnimation(menuIcon, false);
        }
      }
    });
  },

  /**
   * Toggle menu icon animation
   * @param {HTMLElement} menuIcon - Menu icon element
   * @param {boolean} isOpen - Whether menu is open
   */
  toggleMenuAnimation(menuIcon, isOpen) {
    const bars = menuIcon.querySelectorAll('.bar');
    if (isOpen) {
      bars[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
      bars[0].style.transform = 'rotate(0) translate(0, 0)';
      bars[1].style.opacity = '1';
      bars[2].style.transform = 'rotate(0) translate(0, 0)';
    }
  },

  /**
   * Initialize popular routes click handlers
   */
  initPopularRoutes() {
    document.querySelectorAll('.route-card').forEach(card => {
      card.addEventListener('click', async () => {
        const from = card.getAttribute('data-from');
        const to = card.getAttribute('data-to');

        if (!from || !to) return;

        try {
          const routeData = await DataLoader.searchRoute(from, to);
          
          if (routeData) {
            const fromLabel = RouteParser.getLocationName(from, 'departure-dropdown');
            const toLabel = RouteParser.getLocationName(to, 'destination-dropdown');

            this.saveRouteToStorage({
              fromLabel,
              toLabel,
              steps: routeData.steps,
              routeLabel: routeData.label
            });

            window.location.href = 'route.html';
          } else {
            UniGoHelpers.showError('No route found for this destination.');
          }
        } catch (error) {
          console.error('[UniGo] Error loading popular route:', error);
          UniGoHelpers.showError('Failed to load route information.');
        }
      });
    });
  },

  /**
   * Initialize animations for elements
   */
  initAnimations() {
    // Add intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.route-card, .result-card').forEach(el => {
      observer.observe(el);
    });
  },

  /**
   * Display search results on the page
   * @param {Object} routeData - Route data with steps
   * @param {string} fromLabel - Starting location name
   * @param {string} toLabel - Destination location name
   */
  displaySearchResults(routeData, fromLabel, toLabel) {
    const resultsList = document.querySelector('.results-list');
    const searchResultContainer = document.querySelector('.search-result-container');

    if (!resultsList || !searchResultContainer) return;

    resultsList.innerHTML = '';
    searchResultContainer.classList.remove('hide');

    // Scroll to results
    searchResultContainer.scrollIntoView({ behavior: 'smooth' });

    if (routeData && routeData.steps && routeData.steps.length > 0) {
      const resultCard = this.createResultCard(routeData, fromLabel, toLabel);
      resultsList.appendChild(resultCard);
    } else {
      resultsList.innerHTML = `<p class="result-info-p">No route found between ${fromLabel} and ${toLabel}.</p>`;
    }
  },

  /**
   * Create a result card element
   * @param {Object} routeData - Route data
   * @param {string} fromLabel - Starting location
   * @param {string} toLabel - Destination
   * @returns {HTMLElement} Result card element
   */
  createResultCard(routeData, fromLabel, toLabel) {
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';

    const infoDiv = document.createElement('div');
    infoDiv.className = 'result-info';

    const h3 = document.createElement('h3');
    h3.textContent = `${fromLabel} to ${toLabel}`;
    infoDiv.appendChild(h3);

    const anchorP = document.createElement('p');
    anchorP.className = 'result-info-p';
    anchorP.textContent = routeData.label || 'Recommended Route';
    infoDiv.appendChild(anchorP);

    resultCard.appendChild(infoDiv);

    // Make card clickable
    resultCard.style.cursor = 'pointer';
    resultCard.addEventListener('click', () => {
      this.saveRouteToStorage({
        fromLabel,
        toLabel,
        steps: routeData.steps,
        routeLabel: routeData.label
      });
      window.location.href = 'route.html';
    });

    // Add step cards
    let insertAfterElement = anchorP;
    routeData.steps.forEach((text, i) => {
      const stepDiv = this.createStepCard(text, i);
      insertAfterElement.insertAdjacentElement('afterend', stepDiv);
      insertAfterElement = stepDiv;
    });

    return resultCard;
  },

  /**
   * Create a step card element
   * @param {string} stepText - Step description
   * @param {number} index - Step index for animation delay
   * @returns {HTMLElement} Step card element
   */
  createStepCard(stepText, index) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-card animated';

    const imgSrc = RouteParser.getBusImage(stepText);
    if (imgSrc) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'bus-img-container';
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = 'Bus Image';
      img.className = 'bus-img';
      imgContainer.appendChild(img);
      stepDiv.appendChild(imgContainer);
    }

    const p = document.createElement('p');
    p.className = 'result-info-p generated';
    p.textContent = stepText;
    stepDiv.appendChild(p);

    // Animate with delay
    const delay = (CONFIG?.app?.animationDelay || 300) * index;
    setTimeout(() => stepDiv.classList.add('show'), delay);

    return stepDiv;
  },

  /**
   * Save route data to localStorage
   * @param {Object} routeData - Route data to save
   */
  saveRouteToStorage(routeData) {
    try {
      localStorage.setItem('currentRoute', JSON.stringify(routeData));
    } catch (error) {
      console.error('[UniGo] Failed to save route to storage:', error);
    }
  },

  /**
   * Load route data from localStorage
   * @returns {Object|null} Route data or null
   */
  loadRouteFromStorage() {
    try {
      const data = localStorage.getItem('currentRoute');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[UniGo] Failed to load route from storage:', error);
      return null;
    }
  },

  /**
   * Clear route data from localStorage
   */
  clearRouteStorage() {
    try {
      localStorage.removeItem('currentRoute');
    } catch (error) {
      console.error('[UniGo] Failed to clear route storage:', error);
    }
  }
};

// Auto-initialize UI when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    UniGoUI.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniGoUI;
}

