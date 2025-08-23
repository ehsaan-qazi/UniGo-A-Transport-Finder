let routes = [];
let isDataLoaded = false;

// Load the full slugged dataset
document.addEventListener("DOMContentLoaded", () => {
  fetch("data/unigo_transport_routes_full_slugged.json")
    .then((r) => r.json())
    .then((json) => {
      if (Array.isArray(json)) {
        routes = json;
        isDataLoaded = true;
      }
    })
    .catch(() => {
      isDataLoaded = false;
      // If fetch fails (e.g., opened via file://). Use a local server.
      try { console.warn("[UniGo] Failed to load routes JSON. Please ensure the site is served via a local server (e.g., Live Server) to enable data loading."); } catch (_) {}
    });
});

// Enhanced mobile menu toggle with animation
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector('.menu-icon');
  const overlayMenu = document.querySelector('.overlay-menu');

  if (menuIcon && overlayMenu) {
    // Toggle menu on hamburger click
    menuIcon.addEventListener('click', () => {
      overlayMenu.classList.toggle('show');
      
      // Animate hamburger bars to X
      const bars = menuIcon.querySelectorAll('.bar');
      if (overlayMenu.classList.contains('show')) {
        bars[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
      } else {
        bars[0].style.transform = 'rotate(0) translate(0, 0)';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'rotate(0) translate(0, 0)';
      }
    });

    // Close menu when a link is clicked
    overlayMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        overlayMenu.classList.remove('show');
        // Reset hamburger animation
        const bars = menuIcon.querySelectorAll('.bar');
        bars[0].style.transform = 'rotate(0) translate(0, 0)';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'rotate(0) translate(0, 0)';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!menuIcon.contains(e.target) && !overlayMenu.contains(e.target)) {
        if (overlayMenu.classList.contains('show')) {
          overlayMenu.classList.remove('show');
          // Reset hamburger animation
          const bars = menuIcon.querySelectorAll('.bar');
          bars[0].style.transform = 'rotate(0) translate(0, 0)';
          bars[1].style.opacity = '1';
          bars[2].style.transform = 'rotate(0) translate(0, 0)';
        }
      }
    });
  }
});

function reverseStepText(text) {
  const match = text.match(/^(Take\s[A-Z0-9-]+)\sfrom\s(.*?)\s(to|via)\s(.*?)(?:\.)?$/i);
  if (match) {
    const [, routePart, fromLocation, toOrVia, toLocation] = match;
    return `${routePart} from ${toLocation.trim()} ${toOrVia} ${fromLocation.trim()}.`;
  }
  return text;
}

function findTrans(){
  const depEl = document.getElementById("departure-dropdown");
  const dstEl = document.getElementById("destination-dropdown");
  const from = depEl.value;
  const to = dstEl.value;
  const fromLabel = depEl.options[depEl.selectedIndex].text;
  const toLabel = dstEl.options[dstEl.selectedIndex].text;

  const resultsContainer = document.querySelector(".search-result-container");
  if (resultsContainer) resultsContainer.classList.remove("hide");

  const titleEl = document.querySelector("#route-1");
  if (titleEl) titleEl.innerText = `Route 1: ${fromLabel} to ${toLabel}`;

  const info = document.querySelector("#result-card-1 .result-info");
  if (info) info.querySelectorAll(".result-info-p.generated").forEach(p => p.remove());
  const anchorP = document.querySelector("#result-card-1 .result-info .result-info-p");

  if (!isDataLoaded) {
    const p = document.createElement("p");
    p.className = "result-info-p generated";
    p.textContent = "Loading route data... please try again in a moment.";
    anchorP && anchorP.insertAdjacentElement("afterend", p);
    return;
  }

  // Find direct or reverse route
  let route = routes.find(r => r.from === from && r.to === to);
  let steps = route?.steps ? [...route.steps] : null;
  if (!steps) {
    const reverse = routes.find(r => r.from === to && r.to === from);
    if (reverse?.steps) {
      steps = [...reverse.steps].reverse();
      steps = steps.map(step => reverseStepText(step));
    }
  }

  if (steps && steps.length) {
    for (let i = 0; i < steps.length; i++) {
      const p = document.createElement("p");
      p.className = "result-info-p generated";
      p.textContent = steps[i];
      anchorP && anchorP.insertAdjacentElement("afterend", p);
    }
    const viewRouteBtn = document.querySelector("#result-card-1 .result-info .view-route-btn");
    if (viewRouteBtn) {
      viewRouteBtn.onclick = () => {
        const routeData = {
          fromLabel: fromLabel,
          toLabel: toLabel,
          steps: steps
        };
        localStorage.setItem('currentRoute', JSON.stringify(routeData));
        window.location.href = 'route.html';
      };
    }
  } else {
    const p = document.createElement("p");
    p.className = "result-info-p generated";
    p.textContent = "No routes found for the selected departure and destination.";
    anchorP && anchorP.insertAdjacentElement("afterend", p);
  }
}