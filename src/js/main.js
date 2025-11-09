/**
 * UniGo Main Application File
 * Refactored from script.js to use modular structure
 * 
 * This file serves as the entry point and orchestrates all components
 */

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
  UniGoHelpers.debug('UniGo application starting...');
  
  // All components auto-initialize via their own DOMContentLoaded listeners
  // This file can be used for any additional app-level initialization
  
  UniGoHelpers.debug('UniGo application ready');
});

// Note: Individual components (DataLoader, UniGoUI, SearchComponent) 
// initialize themselves via their own DOMContentLoaded listeners
// in their respective files.

