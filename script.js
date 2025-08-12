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
    if (reverse?.steps) steps = [...reverse.steps].reverse();
  }

  if (steps && steps.length) {
    for (let i = steps.length - 1; i >= 0; i--) {
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