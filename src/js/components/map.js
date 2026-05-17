/**
 * UniGo Google Maps Integration
 * Handles map initialization, route rendering, and marker placement.
 */

const UniGoMap = {
  map: null,
  markers: [],
  polylines: [],
  stopsData: null,
  linesData: null,
  isDataLoaded: false,

  // Default Islamabad center
  defaultCenter: { lat: 33.6844, lng: 73.0479 },

  /**
   * Fetch the structural data needed for drawing the map
   */
  async loadMapData() {
    if (this.isDataLoaded) return;
    try {
      const [stopsRes, linesRes] = await Promise.all([
        fetch('data/stops.json'),
        fetch('data/lines.json')
      ]);
      
      this.stopsData = await stopsRes.json();
      this.linesData = await linesRes.json();
      this.isDataLoaded = true;
      console.log('[UniGoMap] Map data loaded successfully.');
    } catch (e) {
      console.error('[UniGoMap] Error loading map data:', e);
    }
  },

  /**
   * Initialize the Google Map inside the #map div
   */
  async init() {
    await this.loadMapData();

    const mapOptions = {
      center: CONFIG?.googleMaps?.center || this.defaultCenter,
      zoom: CONFIG?.googleMaps?.zoom || 12,
      ...CONFIG?.googleMaps?.mapOptions,
      // Minimalist styles to make the transport lines stand out
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, mapOptions);
    window.unigoMap = this.map; // Expose globally just in case
  },

  /**
   * Clear all drawn elements from the map
   */
  clearMap() {
    this.markers.forEach(m => m.setMap(null));
    this.polylines.forEach(p => p.setMap(null));
    this.markers = [];
    this.polylines = [];
  },

  /**
   * Draw the entire path provided by the backend API
   * @param {Array} path - The sequence of steps from the backend
   */
  drawRoute(path) {
    if (!this.map || !this.isDataLoaded || !path || path.length === 0) return;

    this.clearMap();
    const bounds = new google.maps.LatLngBounds();

    path.forEach((step, index) => {
      // Find the specific line to get its stops sequence
      const line = this.linesData.find(l => l.route_id === step.route_id);
      if (!line) return;

      const stopSequence = line.stops.map(s => s.stop_id);
      let fromIdx = stopSequence.indexOf(step.from_id);
      let toIdx = stopSequence.indexOf(step.to_id);

      // Handle reverse direction if necessary
      if (fromIdx === -1 || toIdx === -1) return;
      if (fromIdx > toIdx) {
        const temp = fromIdx;
        fromIdx = toIdx;
        toIdx = temp;
      }

      // Collect all coordinates between from_id and to_id for this segment
      const segmentCoords = [];
      for (let i = fromIdx; i <= toIdx; i++) {
        const stopId = stopSequence[i];
        const stopObj = this.stopsData[stopId];
        if (stopObj && stopObj.lat && stopObj.lon) {
          const latLng = new google.maps.LatLng(stopObj.lat, stopObj.lon);
          segmentCoords.push(latLng);
          bounds.extend(latLng);
        }
      }

      // Determine color
      const color = line.color || step.route_color || '#888888';

      // Draw Polyline (Subway Map style - straight lines between stops)
      const polyline = new google.maps.Polyline({
        path: segmentCoords,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: this.map
      });
      this.polylines.push(polyline);

      // Drop Markers
      // Origin marker
      if (index === 0) {
        this.addMarker(segmentCoords[0], step.from_name, 'http://maps.google.com/mapfiles/ms/icons/green-dot.png');
      }

      // Destination marker
      if (index === path.length - 1) {
        this.addMarker(segmentCoords[segmentCoords.length - 1], step.to_name, 'http://maps.google.com/mapfiles/ms/icons/red-dot.png');
      }

      // Transfer markers (end of current step if there's another step)
      if (index < path.length - 1) {
        this.addMarker(
          segmentCoords[segmentCoords.length - 1], 
          `Transfer at ${step.to_name}`, 
          'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          0.7
        );
      }
    });

    // Fit map to show the entire route
    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds);
      
      // Prevent zooming in too closely if the route is very short
      const listener = google.maps.event.addListener(this.map, "idle", () => { 
        if (this.map.getZoom() > 15) this.map.setZoom(15); 
        google.maps.event.removeListener(listener); 
      });
    }
  },

  /**
   * Helper to add a marker to the map
   */
  addMarker(position, title, iconUrl, opacity = 1.0) {
    const marker = new google.maps.Marker({
      position,
      map: this.map,
      title,
      icon: iconUrl ? {
        url: iconUrl,
        scaledSize: new google.maps.Size(32, 32)
      } : undefined,
      opacity
    });

    // Optional: Add basic infowindow
    const infoWindow = new google.maps.InfoWindow({
      content: `<strong>${title}</strong>`
    });
    
    marker.addListener("click", () => {
      infoWindow.open({
        anchor: marker,
        map: this.map,
      });
    });

    this.markers.push(marker);
    return marker;
  }
};

// Expose globally
window.UniGoMap = UniGoMap;
