# UniGo Project Structure

This document describes the reorganized structure of the UniGo project after Phase 1 restructuring.

## Directory Structure

```
UniGo/
├── config.js                          # Configuration file (API keys, settings)
├── index.html                         # Main landing page
├── search.html                        # Search page
├── route.html                         # Route details page
├── about.html                         # About page
├── profile.html                       # Profile page
├── about.js                           # About page specific scripts
├── profile.js                         # Profile page specific scripts
├── search.js                          # Search page specific scripts (legacy)
├── route.js                           # Route page specific scripts (legacy)
├── script.js.bak                      # Backup of original script.js
│
├── src/                               # Source code directory
│   ├── css/                           # Stylesheets
│   │   ├── index.css
│   │   ├── search.css
│   │   ├── route.css
│   │   ├── about.css
│   │   └── profile.css
│   │
│   ├── data/                          # Data files
│   │   ├── unigo_transport_routes_full_slugged.json  # Pre-computed routes
│   │   └── stops.json                 # (To be created) Stop data with coordinates
│   │
│   └── js/                            # JavaScript modules
│       ├── main.js                    # Main application entry point
│       │
│       ├── core/                      # Core functionality
│       │   ├── dataLoader.js          # Data loading and caching
│       │   ├── graph.js               # Graph data structure (for future A* implementation)
│       │   └── pathfinding.js         # Pathfinding algorithms (skeleton for A*)
│       │
│       ├── components/                # UI components
│       │   ├── ui.js                  # UI interactions and animations
│       │   ├── search.js              # Search functionality
│       │   └── map.js                 # (To be created) Google Maps integration
│       │
│       └── utils/                     # Utility functions
│           ├── helpers.js             # General helper functions
│           └── routeParser.js         # Route parsing and transformation
│
├── images/                            # Image assets
│   ├── green-feeders/                 # Green feeder bus images
│   ├── green-line.jpeg
│   ├── orange-line.png
│   ├── red-line.png
│   └── ...
│
├── css/                               # (Legacy) Old CSS directory
├── data/                              # (Legacy) Old data directory
├── README.md                          # Project README
├── LICENSE                            # License file
└── STRUCTURE.md                       # This file

```

## Module Descriptions

### Core Modules

#### `config.js`
- Central configuration for API keys and application settings
- Contains Google Maps API configuration
- Metro line color definitions
- File paths and application constants

#### `src/js/main.js`
- Application entry point
- Orchestrates initialization of all modules
- Currently minimal as modules auto-initialize

### Core Functionality (`src/js/core/`)

#### `dataLoader.js`
- Handles loading route data from JSON files
- Implements caching to avoid redundant loads
- Provides async methods to get routes and stops data
- Auto-loads data on page load

#### `graph.js`
- Implements Node, Edge, and MetroGraph classes
- Represents metro network as a graph structure
- Prepared for future A* algorithm implementation
- Currently contains skeleton with TODOs

#### `pathfinding.js`
- Contains pathfinding algorithm implementations
- A* algorithm structure prepared for future development
- Includes heuristic function using Haversine distance
- Currently contains skeleton with detailed comments

### Components (`src/js/components/`)

#### `ui.js`
- Manages all UI interactions
- Mobile menu toggle
- Popular routes click handlers
- Result card creation and display
- LocalStorage management for route data

#### `search.js`
- Handles route search functionality
- Input validation
- Integrates with DataLoader and RouteParser
- Displays search results

#### `map.js` (To be created in Phase 2)
- Google Maps integration
- Map initialization and rendering
- Marker placement for stops
- Route polylines
- Info windows

### Utilities (`src/js/utils/`)

#### `helpers.js`
- Haversine distance calculation
- Time estimation and formatting
- Coordinate calculations
- String manipulation (slugify)
- Debug logging
- Generic utility functions

#### `routeParser.js`
- Parse route step text
- Find routes (direct and reverse)
- Extract stops from routes
- Get route segments with line information
- Bus image mapping

## Script Loading Order

HTML files load scripts in this order:

1. `config.js` - Configuration first
2. `src/js/utils/helpers.js` - Utilities needed by everything
3. `src/js/utils/routeParser.js` - Route parsing utilities
4. `src/js/core/dataLoader.js` - Data loading (uses helpers and parser)
5. `src/js/components/ui.js` - UI components (uses all above)
6. `src/js/components/search.js` - Search component (optional, for search pages)
7. `src/js/main.js` - Main application initialization
8. Page-specific scripts (if any)

## Key Features

### Modular Architecture
- Each module has a single responsibility
- Clear separation of concerns
- Easy to test and maintain

### Auto-initialization
- Modules initialize themselves via DOMContentLoaded events
- No manual initialization needed in most cases

### Data Caching
- Route data is loaded once and cached
- Efficient use of network resources

### Backward Compatibility
- Existing route data format still supported
- Pre-computed routes work as before
- Ready for future dynamic pathfinding

## Migration Notes

### Old Files
- `script.js` → Backed up as `script.js.bak`
- `css/*` → Copied to `src/css/`
- `data/*` → Copied to `src/data/`

### Updated References
All HTML files now reference:
- CSS from `src/css/`
- Data from `src/data/`
- Scripts from `src/js/`

## Next Steps (Phase 2)

1. Create `src/js/components/map.js` for Google Maps integration
2. Create `src/data/stops.json` with coordinates for all stops
3. Integrate map display in `route.html`
4. Add markers and polylines for routes

## Next Steps (Phase 3)

1. Research and collect all metro stop coordinates
2. Create comprehensive `stops.json` file
3. Map all routes to graph structure

## Next Steps (Phase 4+)

1. Implement A* algorithm in `pathfinding.js`
2. Build graph from stops data
3. Replace pre-computed routes with dynamic pathfinding
4. Add transfer penalties and optimizations

