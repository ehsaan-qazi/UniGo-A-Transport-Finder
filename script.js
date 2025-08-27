let routes = [];
let isDataLoaded = false;

// Load the full dataset
document.addEventListener("DOMContentLoaded", () => {
  fetch("data/unigo_transport_routes_full_slugged.json") // <-- make sure the JSON file is in /data/
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
  "FR-03a": "images/green-feeders/fr-03a.png",
  "FR-04": "images/green-feeders/fr-04.png",
  "FR-04a": "images/green-feeders/fr-04a.png",
  "FR-05": "images/green-feeders/fr-05.png",
  "FR-06": "images/green-feeders/fr-06.png",
  "FR-07": "images/green-feeders/fr-07.png",
  "FR-08C": "images/green-feeders/fr-08c.png",
  "FR-08A": "images/green-feeders/fr-08a.png",
  "FR-09": "images/green-feeders/fr-09.png"
};

// Helper to detect which image to use
function getBusImage(stepText) {
  if (stepText.includes("Red Line")) return busImages["Red Line"];
  if (stepText.includes("Orange Line")) return busImages["Orange Line"];
  const feederMatch = stepText.match(/FR-\d+[A-Z]?/i);
  if (feederMatch) {
    const code = feederMatch[0].toUpperCase();
    return busImages[code] || busImages["Green Line"];
  }
  if (stepText.includes("Green")) return busImages["Green Line"];
  return null;
}

// Search function
function findTrans() {
  if (!isDataLoaded) {
    alert("Route data is still loading. Please try again in a moment.");
    return;
  }

  const from = document.getElementById("departure-dropdown").value;
  const to = document.getElementById("destination-dropdown").value;

  const fromLabel = document.querySelector(`#departure-dropdown option[value="${from}"]`)?.text || from;
  const toLabel = document.querySelector(`#destination-dropdown option[value="${to}"]`)?.text || to;

  const resultsList = document.querySelector(".results-list");
  resultsList.innerHTML = "";
  document.querySelector(".search-result-container").classList.remove("hide");

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

// Popular Routes
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".route-card").forEach(card => {
    card.addEventListener("click", () => {
      const from = card.getAttribute("data-from");
      const to = card.getAttribute("data-to");

      let steps = null;
      let routeLabel = "Recommended Route";

      let fromLabel = document.querySelector(`#departure-dropdown option[value="${from}"]`)?.text || from;
      let toLabel = document.querySelector(`#destination-dropdown option[value="${to}"]`)?.text || to;

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
