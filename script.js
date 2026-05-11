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

// Load the full dataset (local fallback if backend is unavailable)
document.addEventListener("DOMContentLoaded", () => {
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
 * Main search function — calls backend API first, falls back to local JSON.
 */
async function findTrans() {
  const from = document.getElementById("departure-dropdown").value;
  const to = document.getElementById("destination-dropdown").value;

  if (!from || !to) {
    alert("Please select both departure and destination.");
    return;
  }
  if (from === to) {
    alert("Departure and destination cannot be the same.");
    return;
  }

  const fromLabel = document.querySelector(`#departure-dropdown option[value="${from}"]`)?.text || from;
  const toLabel = document.querySelector(`#destination-dropdown option[value="${to}"]`)?.text || to;

  const resultsList = document.querySelector(".results-list");
  resultsList.innerHTML = '<p class="result-info-p">Searching...</p>';
  const searchResultContainer = document.querySelector(".search-result-container");
  searchResultContainer.classList.remove("hide");
  searchResultContainer.scrollIntoView({ behavior: 'smooth' });

  // Try backend API first
  const fromNodeId = resolveSlug(from);
  const toNodeId = resolveSlug(to);

  try {
    const res = await fetch(`${getApiBase()}/api/routes?from=${encodeURIComponent(fromNodeId)}&to=${encodeURIComponent(toNodeId)}`);
    if (res.ok) {
      const data = await res.json();
      renderApiResult(data, fromLabel, toLabel, resultsList);
      return;
    }
  } catch (e) {
    console.warn("[UniGo] Backend API unavailable, falling back to local data.", e);
  }

  // Fallback: local JSON search
  fallbackLocalSearch(from, to, fromLabel, toLabel, resultsList);
}

/**
 * Render the backend API result as a rich card with fare, time, and step timeline.
 */
function renderApiResult(data, fromLabel, toLabel, container) {
  container.innerHTML = "";
  const steps = data.path || [];

  // Calculate total fare by counting unique lines
  let totalFare = 0;
  const linesSeen = new Set();
  steps.forEach(step => {
    const lineKey = step.route_id || step.route_name || '';
    if (!linesSeen.has(lineKey) && lineKey) {
      linesSeen.add(lineKey);
      totalFare += getLineFare(lineKey);
    }
  });
  if (totalFare === 0) totalFare = 50;

  const transfers = data.transfers != null ? data.transfers : Math.max(0, steps.length - 1);

  // Build result card
  const resultCard = document.createElement("div");
  resultCard.className = "result-card";

  // Info section
  const infoDiv = document.createElement("div");
  infoDiv.className = "result-info";

  const h3 = document.createElement("h3");
  h3.textContent = `${fromLabel} to ${toLabel}`;
  infoDiv.appendChild(h3);

  // Summary line
  const summaryP = document.createElement("p");
  summaryP.className = "result-info-p";
  const summaryParts = [];
  if (data.total_time_minutes) summaryParts.push(`${data.total_time_minutes} min`);
  if (data.total_distance_km) summaryParts.push(`${data.total_distance_km} km`);
  summaryParts.push(`Rs. ${totalFare}`);
  summaryParts.push(`${transfers} transfer${transfers !== 1 ? 's' : ''}`);
  summaryP.textContent = summaryParts.join(' · ');
  infoDiv.appendChild(summaryP);

  resultCard.appendChild(infoDiv);

  // Make card clickable → route.html
  resultCard.style.cursor = "pointer";
  resultCard.addEventListener("click", () => {
    // Convert API steps to text steps for route.html compatibility
    const textSteps = steps.map(s => {
      const routeName = s.route_name || s.route_id || 'Unknown';
      return `${routeName} from ${s.from_name} → ${s.to_name}`;
    });
    localStorage.setItem("currentRoute", JSON.stringify({
      fromLabel, toLabel,
      steps: textSteps,
      routeLabel: summaryP.textContent,
      apiData: data // Store the full API response too
    }));
    window.location.href = "route.html";
  });

  // Step cards
  let insertAfterElement = summaryP;
  steps.forEach((step, i) => {
    const stepDiv = document.createElement("div");
    stepDiv.className = "step-card animated";

    // Bus image
    const imgSrc = getBusImageFromRouteId(step.route_id) ||
                   getBusImage(step.route_name || '') ||
                   getBusImage(step.step_text || '');
    if (imgSrc) {
      const imgContainer = document.createElement("div");
      imgContainer.className = "bus-img-container";
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = step.route_name || "Bus";
      img.className = "bus-img";
      img.loading = "lazy";
      imgContainer.appendChild(img);
      stepDiv.appendChild(imgContainer);
    }

    // Step text
    const p = document.createElement("p");
    p.className = "result-info-p generated";
    const routeDisplay = step.route_name || step.route_id || '';
    const stopsText = `${step.from_name} → ${step.to_name}`;
    const fare = getLineFare(step.route_id || step.route_name);
    const extras = [];
    if (step.stops_count) extras.push(`${step.stops_count} stops`);
    if (step.time_minutes) extras.push(`${step.time_minutes} min`);
    extras.push(`Rs. ${fare}`);
    p.textContent = `${routeDisplay} from ${stopsText} (${extras.join(', ')})`;
    stepDiv.appendChild(p);

    insertAfterElement.insertAdjacentElement("afterend", stepDiv);
    insertAfterElement = stepDiv;

    const delay = (CONFIG?.app?.animationDelay || 300) * i;
    setTimeout(() => stepDiv.classList.add("show"), delay);
  });

  container.appendChild(resultCard);
}

/**
 * Fallback: search through locally loaded JSON when backend is unavailable.
 * This is the original logic, preserved as-is.
 */
function fallbackLocalSearch(from, to, fromLabel, toLabel, resultsList) {
  if (!isDataLoaded) {
    resultsList.innerHTML = '<p class="result-info-p">Route data is still loading. Please try again.</p>';
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
    const resultCard = document.createElement("div");
    resultCard.className = "result-card";

    const infoDiv = document.createElement("div");
    infoDiv.className = "result-info";

    const h3 = document.createElement("h3");
    h3.textContent = `${fromLabel} to ${toLabel}`;
    infoDiv.appendChild(h3);

    const anchorP = document.createElement("p");
    anchorP.className = "result-info-p";
    anchorP.textContent = routeLabel;
    infoDiv.appendChild(anchorP);

    resultCard.appendChild(infoDiv);
    resultsList.appendChild(resultCard);

    resultCard.style.cursor = "pointer";
    resultCard.addEventListener("click", () => {
      localStorage.setItem("currentRoute", JSON.stringify({ fromLabel, toLabel, steps, routeLabel }));
      window.location.href = "route.html";
    });

    let insertAfterElement = anchorP;
    steps.forEach((text, i) => {
      const stepDiv = document.createElement("div");
      stepDiv.className = "step-card animated";

      const imgSrc = getBusImage(text);
      if (imgSrc) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "bus-img-container";
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "Bus Image";
        img.className = "bus-img";
        imgContainer.appendChild(img);
        stepDiv.appendChild(imgContainer);
      }

      const p = document.createElement("p");
      p.className = "result-info-p generated";
      p.textContent = text;
      stepDiv.appendChild(p);

      insertAfterElement.insertAdjacentElement("afterend", stepDiv);
      insertAfterElement = stepDiv;

      setTimeout(() => stepDiv.classList.add("show"), i * 300);
    });
  } else {
    resultsList.innerHTML = `<p class="result-info-p">No route found between ${fromLabel} and ${toLabel}.</p>`;
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
