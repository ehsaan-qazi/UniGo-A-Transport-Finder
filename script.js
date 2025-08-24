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
      try {
        console.warn("[UniGo] Failed to load routes JSON. Please ensure the site is served via a local server (e.g., Live Server) to enable data loading.");
      } catch (_) {}
    });
});

// Enhanced mobile menu toggle with animation
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector(".menu-icon");
  const overlayMenu = document.querySelector(".overlay-menu");

  if (menuIcon && overlayMenu) {
    // Toggle menu on hamburger click
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

    // Close menu when a link is clicked
    overlayMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        overlayMenu.classList.remove("show");
        const bars = menuIcon.querySelectorAll(".bar");
        bars[0].style.transform = "rotate(0) translate(0, 0)";
        bars[1].style.opacity = "1";
        bars[2].style.transform = "rotate(0) translate(0, 0)";
      });
    });

    // Close menu when clicking outside
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

// Rewrites a step for reverse routes where the step has explicit "from ... to/via ..."
function reverseStepText(text) {
  const match = text.match(
    /^(Take\s(?:[A-Z][a-z]+\s){0,2}(?:Line|Feeder|Bus|Metro)\s(?:[A-Z0-9-]+)?)\sfrom\s(.*?)\s(to|via)\s(.*?)(?:\.)?$/i
  );
  if (match) {
    const [, routePart, fromLocation, toOrVia, toLocation] = match;
    return `${routePart} from ${toLocation.trim()} ${toOrVia} ${fromLocation.trim()}.`;
  }
  return text; // leave untouched if it doesn't fit the pattern
}

// Utility: render steps after the anchor, preserving order
function renderStepsAfter(anchorEl, steps) {
  let insertAfter = anchorEl; // start by inserting after the anchor
  steps.forEach((step) => {
    const p = document.createElement("p");
    p.className = "result-info-p generated";
    p.textContent = step;
    insertAfter.insertAdjacentElement("afterend", p);
    insertAfter = p; // next insertion goes after the last inserted <p>
  });
}

// Search function
function findTrans() {
  const depEl = document.getElementById("departure-dropdown");
  const dstEl = document.getElementById("destination-dropdown");
  let from = depEl.value;
  let to = dstEl.value;
  let fromLabel = depEl.options[depEl.selectedIndex].text;
  let toLabel = dstEl.options[dstEl.selectedIndex].text;

  const resultsContainer = document.querySelector(".search-result-container");
  if (resultsContainer) resultsContainer.classList.remove("hide");

  const titleEl = document.querySelector("#route-1");
  if (titleEl) titleEl.innerText = `Route 1: ${fromLabel} to ${toLabel}`;

  const info = document.querySelector("#result-card-1 .result-info");
  if (info) info.querySelectorAll(".result-info-p.generated").forEach((p) => p.remove());
  const anchorP = document.querySelector("#result-card-1 .result-info .result-info-p");

  if (!isDataLoaded) {
    const p = document.createElement("p");
    p.className = "result-info-p generated";
    p.textContent = "Loading route data... please try again in a moment.";
    anchorP && anchorP.insertAdjacentElement("afterend", p);
    return;
  }

  let steps = null;

  // Direct route: keep dataset order
  const direct = routes.find((r) => r.from === from && r.to === to);
  if (direct?.steps) {
    steps = direct.steps.slice();
  } else {
    // Reverse route: reverse array and swap "from ... to/via ..." text
    const reverse = routes.find((r) => r.from === to && r.to === from);
    if (reverse?.steps) {
      steps = reverse.steps.slice().reverse().map((s) => reverseStepText(s));
      [fromLabel, toLabel] = [toLabel, fromLabel]; // swap for display + route.html
      if (titleEl) titleEl.innerText = `Route 1: ${fromLabel} to ${toLabel}`;
    }
  }

  if (steps && steps.length) {
    if (anchorP) renderStepsAfter(anchorP, steps);

    const viewRouteBtn = document.querySelector("#result-card-1 .result-info .view-route-btn");
    if (viewRouteBtn) {
      viewRouteBtn.onclick = () => {
        localStorage.setItem(
          "currentRoute",
          JSON.stringify({
            fromLabel,
            toLabel,
            steps,
          })
        );
        window.location.href = "route.html";
      };
    }
  } else {
    const p = document.createElement("p");
    p.className = "result-info-p generated";
    p.textContent = "No routes found for the selected departure and destination.";
    anchorP && anchorP.insertAdjacentElement("afterend", p);
  }
}
