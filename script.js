let routes = [];
let isDataLoaded = false;

/**
 * Resolve a dropdown slug to a graph node ID for the backend API.
 * Falls back to the slug itself if no mapping exists.
 */
function resolveSlug(slug) {
  return (CONFIG && CONFIG.slugToNodeId && CONFIG.slugToNodeId[slug]) || slug;
}

/**
 * Get the API base URL from config.
 */
function getApiBase() {
  return (CONFIG && CONFIG.apiBase) || 'http://127.0.0.1:5000';
}


let selectedDeparture = null;
let selectedDestination = null;

/**
 * Debounce helper for autocomplete API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Initialize autocomplete for an input field
 */
function initAutocomplete(inputId, suggestionsId, onSelect) {
  const input = document.getElementById(inputId);
  const suggestions = document.getElementById(suggestionsId);
  if (!input || !suggestions) return;

  const fetchSuggestions = debounce(async (query) => {
    if (!query) {
      suggestions.classList.remove("active");
      return;
    }
    
    try {
      const res = await fetch(`${getApiBase()}/api/stops/search?q=${encodeURIComponent(query)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        renderSuggestions(data.stops || []);
      }
    } catch (e) {
      console.warn("[UniGo] Autocomplete failed:", e);
    }
  }, 300);

  function renderSuggestions(stops) {
    suggestions.innerHTML = "";
    if (stops.length === 0) {
      suggestions.classList.remove("active");
      return;
    }

    stops.forEach(stop => {
      const li = document.createElement("li");
      li.className = "suggestion-item";
      li.textContent = stop.name;
      li.addEventListener("click", () => {
        input.value = stop.name;
        suggestions.classList.remove("active");
        onSelect({ id: stop.id, name: stop.name });
      });
      suggestions.appendChild(li);
    });
    suggestions.classList.add("active");
  }

  input.addEventListener("input", (e) => {
    // Reset selection if user types
    onSelect(null);
    fetchSuggestions(e.target.value.trim());
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.classList.remove("active");
    }
  });
}

// Load the full dataset (local fallback if backend is unavailable)
document.addEventListener("DOMContentLoaded", () => {
  // Init autocomplete for inputs
  initAutocomplete("departure-input", "departure-suggestions", (val) => selectedDeparture = val);
  initAutocomplete("destination-input", "destination-suggestions", (val) => selectedDestination = val);

  const routesFile = (CONFIG && CONFIG.dataFiles && CONFIG.dataFiles.routes)
    || 'data/unigo_transport_routes_full_slugged.json';

  fetch(routesFile)
    .then((r) => r.json())
    .then((json) => {
      if (Array.isArray(json)) {
        routes = json;
        isDataLoaded = true;
      }
    })
    .catch(() => {
      isDataLoaded = false;
      console.warn("[UniGo] Failed to load local routes JSON (fallback data).");
    });
});

// Enhanced mobile menu toggle with animation
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector(".menu-icon");
  const overlayMenu = document.querySelector(".overlay-menu");

  if (menuIcon && overlayMenu) {
    menuIcon.addEventListener("click", () => {
      overlayMenu.classList.toggle("show");

      const bars = menuIcon.querySelectorAll(".bar");
      if (overlayMenu.classList.contains("show")) {
        bars[0].style.transform = "rotate(45deg) translate(6px, 6px)";
        bars[1].style.opacity = "0";
        bars[2].style.transform = "rotate(-45deg) translate(6px, -6px)";
      } else {
        bars[0].style.transform = "rotate(0) translate(0, 0)";
        bars[1].style.opacity = "1";
        bars[2].style.transform = "rotate(0) translate(0, 0)";
      }
    });

    overlayMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        overlayMenu.classList.remove("show");
        const bars = menuIcon.querySelectorAll(".bar");
        bars[0].style.transform = "rotate(0) translate(0, 0)";
        bars[1].style.opacity = "1";
        bars[2].style.transform = "rotate(0) translate(0, 0)";
      });
    });

    document.addEventListener("click", function (e) {
      if (!menuIcon.contains(e.target) && !overlayMenu.contains(e.target)) {
        if (overlayMenu.classList.contains("show")) {
          overlayMenu.classList.remove("show");
          const bars = menuIcon.querySelectorAll(".bar");
          bars[0].style.transform = "rotate(0) translate(0, 0)";
          bars[1].style.opacity = "1";
          bars[2].style.transform = "rotate(0) translate(0, 0)";
        }
      }
    });
  }
});

// Reverse route text handler
function reverseStepText(text) {
  const match = text.match(
    /^(.*? from )(.+?)( →| via )(.+?)$/i
  );
  if (match) {
    const [, routePart, fromLocation, arrow, toLocation] = match;
    return `${routePart}${toLocation.trim()}${arrow} ${fromLocation.trim()}`;
  }
  return text;
}

// Map bus names/feeder codes to images
const busImages = {
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
  "FR-09": "images/green-feeders/fr-09.png"
};

// Helper to detect which image to use from step text
function getBusImage(stepText) {
  if (stepText.includes("Red Line") || stepText.includes("Red")) return busImages["Red Line"];
  if (stepText.includes("Orange Line") || stepText.includes("Orange")) return busImages["Orange Line"];
  const feederMatch = stepText.match(/FR-\d+[A-Z]?/i);
  if (feederMatch) {
    const code = feederMatch[0].toUpperCase();
    return busImages[code] || busImages["Green Line"];
  }
  if (stepText.includes("Green")) return busImages["Green Line"];
  return null;
}

// Helper to get bus image from route_id (backend API format uses IDs like "fr_01", "red_line")
function getBusImageFromRouteId(routeId) {
  if (!routeId) return null;
  const id = routeId.toLowerCase();
  if (id === 'red_line') return busImages["Red Line"];
  if (id === 'orange_line') return busImages["Orange Line"];
  // Green feeders: fr_01 → FR-01
  const feederMap = {
    'fr_01': 'FR-01', 'fr_03a': 'FR-03A', 'fr_04': 'FR-04', 'fr_04a': 'FR-04A',
    'fr_05': 'FR-05', 'fr_06': 'FR-06', 'fr_07': 'FR-07',
    'fr_08a': 'FR-08A', 'fr_08c': 'FR-08C', 'fr_09': 'FR-09',
    'fr_14': 'FR-01', 'fr_14a': 'FR-01', 'fr_15': 'FR-01' // fallback for newer routes
  };
  if (feederMap[id]) return busImages[feederMap[id]] || busImages["Green Line"];
  return busImages["Green Line"];
}

// Get fare for a line (Red = 30 PKR, Green/Orange = 50 PKR)
function getLineFare(routeIdOrText) {
  if (!routeIdOrText) return 50;
  const s = routeIdOrText.toLowerCase();
  if (s.includes('red')) return 30;
  return 50; // Orange + all green feeders
}

/**
 * Show / hide the result panel in the sidebar.
 */
function showResults() {
  const panel = document.getElementById("result-panel");
  if (panel) panel.classList.remove("hide");
}
function hideResults() {
  const panel = document.getElementById("result-panel");
  if (panel) panel.classList.add("hide");
  if (window.UniGoMap) window.UniGoMap.clearMap();
}

/**
 * Main search function — calls backend API first, falls back to local JSON.
 */
async function findTrans() {
  const departureInput = document.getElementById("departure-input");
  const destinationInput = document.getElementById("destination-input");

  if (!selectedDeparture || !selectedDestination) {
    // Try to fall back to typed text if they didn't click a suggestion
    const fromText = departureInput?.value.trim();
    const toText = destinationInput?.value.trim();
    if (!fromText || !toText) {
      alert("Please select both departure and destination from the suggestions.");
      return;
    }
    // Set fallback selected items based on input text
    if (!selectedDeparture) selectedDeparture = { id: fromText, name: fromText };
    if (!selectedDestination) selectedDestination = { id: toText, name: toText };
  }

  if (selectedDeparture.id === selectedDestination.id) {
    alert("Departure and destination cannot be the same.");
    return;
  }

  const fromLabel = selectedDeparture.name;
  const toLabel = selectedDestination.name;

  // Show loading state in result panel
  const stepsContainer = document.getElementById("journey-steps");
  const resultTitle = document.getElementById("result-title");
  const fareBadge = document.getElementById("fare-badge");
  const resultMeta = document.getElementById("result-meta");

  if (resultTitle) resultTitle.textContent = `Your Trip to ${toLabel}`;
  if (fareBadge) fareBadge.textContent = "Calculating...";
  if (resultMeta) resultMeta.textContent = "Searching for routes...";
  if (stepsContainer) stepsContainer.innerHTML = "";
  showResults();

  // Try backend API first
  // Try to resolve via slug mapping if it's a legacy value, otherwise use ID directly
  const fromNodeId = resolveSlug(selectedDeparture.id);
  const toNodeId = resolveSlug(selectedDestination.id);

  try {
    console.log(`[UniGo] 🔵 Calling backend API: ${getApiBase()}/api/routes?from=${fromNodeId}&to=${toNodeId}`);
    const res = await fetch(`${getApiBase()}/api/routes?from=${encodeURIComponent(fromNodeId)}&to=${encodeURIComponent(toNodeId)}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`[UniGo] ✅ BACKEND result received (source: ${data.source || 'api'}, fare: Rs.${data.total_fare_pkr}, time: ${data.total_time_minutes}min)`);
      renderApiResult(data, fromLabel, toLabel);
      if (window.UniGoMap) {
        window.UniGoMap.drawRoute(data.path);
      }
      return;
    } else {
      console.warn(`[UniGo] ⚠️ Backend returned ${res.status}, falling back to local.`);
    }
  } catch (e) {
    console.warn("[UniGo] ❌ Backend API unavailable, falling back to local data.", e.message);
  }

  // Fallback: local JSON search
  console.log("[UniGo] 🟡 Using LOCAL JSON fallback for search.");
  fallbackLocalSearch(selectedDeparture.id, selectedDestination.id, fromLabel, toLabel);
}

/**
 * Render the backend API result into the new sidebar result panel.
 */
function renderApiResult(data, fromLabel, toLabel) {
  const stepsContainer = document.getElementById("journey-steps");
  const resultTitle = document.getElementById("result-title");
  const fareBadge = document.getElementById("fare-badge");
  const resultMeta = document.getElementById("result-meta");
  const steps = data.path || [];

  // Calculate total fare by counting unique lines
  let totalFare = data.total_fare_pkr || 0;
  if (!totalFare) {
    const linesSeen = new Set();
    steps.forEach(step => {
      const lineKey = step.route_id || step.route_name || '';
      if (!linesSeen.has(lineKey) && lineKey) {
        linesSeen.add(lineKey);
        totalFare += getLineFare(lineKey);
      }
    });
    if (totalFare === 0) totalFare = 50;
  }

  const transfers = data.transfers != null ? data.transfers : Math.max(0, steps.length - 1);

  // Update header
  if (resultTitle) resultTitle.textContent = `Your Trip to ${toLabel}`;
  if (fareBadge) fareBadge.textContent = `Fare: Rs. ${totalFare}`;
  const metaParts = [];
  if (data.total_time_minutes) metaParts.push(`Arrival in ${data.total_time_minutes} minutes`);
  if (data.total_distance_km) metaParts.push(`${data.total_distance_km} km`);
  metaParts.push(`${transfers} transfer${transfers !== 1 ? 's' : ''}`);
  if (resultMeta) resultMeta.textContent = metaParts.join(' · ');

  // Render step cards
  if (stepsContainer) stepsContainer.innerHTML = "";

  steps.forEach((step, i) => {
    // Dotted connector before each card (except the first)
    if (i > 0) {
      const connector = document.createElement("div");
      connector.className = "step-connector";
      connector.innerHTML = '<div class="step-connector-line"></div>';
      stepsContainer.appendChild(connector);
    }

    const card = document.createElement("div");
    card.className = "step-card";

    // Bus image
    const imgSrc = getBusImageFromRouteId(step.route_id) ||
                   getBusImage(step.route_name || '') ||
                   getBusImage(step.step_text || '');
    const imgWrap = document.createElement("div");
    imgWrap.className = "step-img-wrap";
    if (imgSrc) {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = step.route_name || "Bus";
      img.loading = "lazy";
      imgWrap.appendChild(img);
    }
    card.appendChild(imgWrap);

    // Text content
    const textWrap = document.createElement("div");
    textWrap.className = "step-text-wrap";

    const routeName = document.createElement("span");
    routeName.className = "step-route-name";
    const routeDisplay = step.route_name || step.route_id || 'Unknown';
    const timeStr = step.time_minutes ? ` (${step.time_minutes} min)` : '';
    routeName.textContent = `${routeDisplay}${timeStr}`;
    textWrap.appendChild(routeName);

    const stopsSpan = document.createElement("span");
    stopsSpan.className = "step-stops";
    stopsSpan.textContent = `${step.from_name} → ${step.to_name}`;
    textWrap.appendChild(stopsSpan);

    const fareSpan = document.createElement("span");
    fareSpan.className = "step-fare";
    const extras = [];
    if (step.stops_count) extras.push(`${step.stops_count} stops`);
    const lineFare = getLineFare(step.route_id || step.route_name);
    extras.push(`Rs. ${lineFare}`);
    fareSpan.textContent = extras.join(' · ');
    textWrap.appendChild(fareSpan);

    card.appendChild(textWrap);
    stepsContainer.appendChild(card);

    // Animate in
    const delay = (CONFIG?.app?.animationDelay || 300) * i;
    setTimeout(() => card.classList.add("show"), delay);
  });

  showResults();
}

/**
 * Fallback: search through locally loaded JSON when backend is unavailable.
 */
function fallbackLocalSearch(from, to, fromLabel, toLabel) {
  const stepsContainer = document.getElementById("journey-steps");
  const resultTitle = document.getElementById("result-title");
  const fareBadge = document.getElementById("fare-badge");
  const resultMeta = document.getElementById("result-meta");

  if (!isDataLoaded) {
    if (resultMeta) resultMeta.textContent = "Route data is still loading. Please try again.";
    return;
  }

  let steps = null;
  let routeLabel = "Recommended Route";

  const direct = routes.find(r => r.from === from && r.to === to);
  if (direct?.options?.length) {
    steps = direct.options[0].steps.slice();
    routeLabel = direct.options[0].label || routeLabel;
  } else {
    const reverse = routes.find(r => r.from === to && r.to === from);
    if (reverse?.options?.length) {
      steps = reverse.options[0].steps.slice().reverse().map(s => reverseStepText(s));
      routeLabel = reverse.options[0].label || routeLabel;
    }
  }

  if (steps && steps.length) {
    // Calculate fare from step text
    let totalFare = 0;
    const linesSeen = new Set();
    steps.forEach(text => {
      const lineType = text.includes('Red') ? 'red' : (text.includes('Orange') ? 'orange' : 'green');
      if (!linesSeen.has(lineType)) {
        linesSeen.add(lineType);
        totalFare += lineType === 'red' ? 30 : 50;
      }
    });

    if (resultTitle) resultTitle.textContent = `Your Trip to ${toLabel}`;
    if (fareBadge) fareBadge.textContent = `Fare: Rs. ${totalFare}`;
    if (resultMeta) resultMeta.textContent = routeLabel + ' (local data)';
    if (stepsContainer) stepsContainer.innerHTML = "";

    steps.forEach((text, i) => {
      if (i > 0) {
        const connector = document.createElement("div");
        connector.className = "step-connector";
        connector.innerHTML = '<div class="step-connector-line"></div>';
        stepsContainer.appendChild(connector);
      }

      const card = document.createElement("div");
      card.className = "step-card";

      // Bus image
      const imgSrc = getBusImage(text);
      const imgWrap = document.createElement("div");
      imgWrap.className = "step-img-wrap";
      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "Bus Image";
        img.loading = "lazy";
        imgWrap.appendChild(img);
      }
      card.appendChild(imgWrap);

      // Text
      const textWrap = document.createElement("div");
      textWrap.className = "step-text-wrap";
      const routeName = document.createElement("span");
      routeName.className = "step-route-name";
      // Parse "Orange Line from X → Y"
      const parts = text.split(" from ");
      routeName.textContent = parts[0] || text;
      textWrap.appendChild(routeName);

      if (parts[1]) {
        const stopsSpan = document.createElement("span");
        stopsSpan.className = "step-stops";
        stopsSpan.textContent = parts[1];
        textWrap.appendChild(stopsSpan);
      }

      card.appendChild(textWrap);
      stepsContainer.appendChild(card);

      setTimeout(() => card.classList.add("show"), i * 300);
    });

    showResults();
  } else {
    if (resultTitle) resultTitle.textContent = "No Route Found";
    if (fareBadge) fareBadge.textContent = "";
    if (resultMeta) resultMeta.textContent = `No route found between ${fromLabel} and ${toLabel}.`;
    if (stepsContainer) stepsContainer.innerHTML = "";
    showResults();
  }
}

// Popular Routes — API-first with local fallback
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".route-card").forEach(card => {
    card.addEventListener("click", async () => {
      const from = card.getAttribute("data-from");
      const to = card.getAttribute("data-to");

      let fromLabel = document.querySelector(`#departure-dropdown option[value="${from}"]`)?.text || from;
      let toLabel = document.querySelector(`#destination-dropdown option[value="${to}"]`)?.text || to;

      // Try backend API first
      const fromNodeId = resolveSlug(from);
      const toNodeId = resolveSlug(to);

      try {
        const res = await fetch(`${getApiBase()}/api/routes?from=${encodeURIComponent(fromNodeId)}&to=${encodeURIComponent(toNodeId)}`);
        if (res.ok) {
          const data = await res.json();
          const textSteps = (data.path || []).map(s => {
            const routeName = s.route_name || s.route_id || 'Unknown';
            return `${routeName} from ${s.from_name} → ${s.to_name}`;
          });
          localStorage.setItem("currentRoute", JSON.stringify({
            fromLabel, toLabel,
            steps: textSteps,
            routeLabel: `${data.total_time_minutes || '?'} min · Rs. ${data.total_fare_pkr || 50}`,
            apiData: data
          }));
          window.location.href = "route.html";
          return;
        }
      } catch (e) {
        console.warn("[UniGo] Backend unavailable for popular route, trying local.", e);
      }

      // Fallback: local JSON
      let steps = null;
      let routeLabel = "Recommended Route";

      const direct = routes.find(r => r.from === from && r.to === to);
      if (direct?.options?.length) {
        steps = direct.options[0].steps.slice();
        routeLabel = direct.options[0].label || routeLabel;
      } else {
        const reverse = routes.find(r => r.from === to && r.to === from);
        if (reverse?.options?.length) {
          steps = reverse.options[0].steps.slice().reverse().map(s => reverseStepText(s));
          routeLabel = reverse.options[0].label || routeLabel;
          [fromLabel, toLabel] = [toLabel, fromLabel];
        }
      }

      if (steps && steps.length) {
        localStorage.setItem("currentRoute", JSON.stringify({ fromLabel, toLabel, steps, routeLabel }));
        window.location.href = "route.html";
      } else {
        alert("No route found for this popular route.");
      }
    });
  });
});
