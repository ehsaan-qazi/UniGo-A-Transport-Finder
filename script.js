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

// Map bus names/feeder codes to images
const busImages = {
  "Red Line": "images/red-line.png",
  "Orange Line": "images/orange-line.png",
  "Green Line": "images/green-line.jpeg", // fallback if no feeder match
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

// Search function
function findTrans() {
  // Ensure data is loaded
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

  // Show the search results container
  document.querySelector(".search-result-container").classList.remove("hide");

  let steps = null;

  // Direct route
  const direct = routes.find(r => r.from === from && r.to === to);
  if (direct?.steps) {
    steps = direct.steps.slice();
  } else {
    // Reverse route
    const reverse = routes.find(r => r.from === to && r.to === from);
    if (reverse?.steps) {
      steps = reverse.steps.slice().reverse().map(s => reverseStepText(s));
    }
  }

  if (steps && steps.length) {
    // Create result card
    const resultCard = document.createElement("div");
    resultCard.className = "result-card";

    const infoDiv = document.createElement("div");
    infoDiv.className = "result-info";

    const h3 = document.createElement("h3");
    h3.textContent = `${fromLabel} to ${toLabel}`;
    infoDiv.appendChild(h3);

    const anchorP = document.createElement("p");
    anchorP.className = "result-info-p";
    anchorP.textContent = "Recommended Route:";
    infoDiv.appendChild(anchorP);

    resultCard.appendChild(infoDiv);
    resultsList.appendChild(resultCard);

    // Make the entire resultCard clickable
    resultCard.style.cursor = "pointer"; // Add cursor style to indicate clickability
    resultCard.addEventListener("click", () => {
      localStorage.setItem("currentRoute", JSON.stringify({ fromLabel, toLabel, steps }));
      window.location.href = "route.html";
    });

    let insertAfterElement = anchorP; // Start inserting after the 'Recommended Route' paragraph

    // 🔧 Step rendering with images + animation
    steps.forEach((text, i) => {
      const stepDiv = document.createElement("div");
      stepDiv.className = "step-card animated";

      // Add bus image if available
      const imgSrc = getBusImage(text);
      if (imgSrc) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "bus-img-container"; // New container for image
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "Bus Image";
        img.className = "bus-img";
        imgContainer.appendChild(img);
        stepDiv.appendChild(imgContainer);
      }

      // Add step text
      const p = document.createElement("p");
      p.className = "result-info-p generated";
      p.textContent = text;
      stepDiv.appendChild(p);

      insertAfterElement.insertAdjacentElement("afterend", stepDiv);
      insertAfterElement = stepDiv; // Update the insertion point for the next step

      // Pop-out animation delay
      setTimeout(() => stepDiv.classList.add("show"), i * 300);
    });

    // "View Route" button (removed as the entire card is clickable)
    // const viewBtn = document.createElement("a");
    // viewBtn.className = "view-route-btn";
    // viewBtn.textContent = "View Route";
    // viewBtn.href = "#";
    // viewBtn.addEventListener("click", (e) => {
    //   e.preventDefault();
    //   localStorage.setItem("currentRoute", JSON.stringify({ fromLabel, toLabel, steps }));
    //   window.location.href = "route.html";
    // });

    // infoDiv.appendChild(viewBtn);

  } else {
    resultsList.innerHTML = `<p class="result-info-p">No route found between ${fromLabel} and ${toLabel}.</p>`;
  }
}

// Make Popular Routes Clickable
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".route-card").forEach(card => {
    card.addEventListener("click", () => {
      const from = card.getAttribute("data-from");
      const to = card.getAttribute("data-to");

      // Try to find a direct route first
      let steps = null;
      let fromLabel = document.querySelector(`#departure-dropdown option[value="${from}"]`)?.text || from;
      let toLabel = document.querySelector(`#destination-dropdown option[value="${to}"]`)?.text || to;

      const direct = routes.find(r => r.from === from && r.to === to);
      if (direct?.steps) {
        steps = direct.steps.slice();
      } else {
        // Reverse route
        const reverse = routes.find(r => r.from === to && r.to === from);
        if (reverse?.steps) {
          steps = reverse.steps.slice().reverse().map(s => reverseStepText(s));
          [fromLabel, toLabel] = [toLabel, fromLabel];
        }
      }

      if (steps && steps.length) {
        localStorage.setItem("currentRoute", JSON.stringify({ fromLabel, toLabel, steps }));
        window.location.href = "route.html";
      } else {
        alert("No route found for this popular route.");
      }
    });
  });
});

// Helper to detect which image to use
function getBusImage(stepText) {
  // 🔴 Red Line
  if (stepText.includes("Red Line")) {
    return "images/red-line.png";
  }

  // 🟠 Orange Line
  if (stepText.includes("Orange Line")) {
    return "images/orange-line.png";
  }

  // 🔵 Blue Line
  if (stepText.includes("Blue Line")) {
    return "images/blue-line.png";
  }

  // 🟢 Green Line Feeders (check for FR codes like FR-08C, FR-01, etc.)
  const feederMatch = stepText.match(/FR-\d+[A-Z]?/i); 
  if (feederMatch) {
    const code = feederMatch[0].toLowerCase(); // e.g. fr-08c
    return `images/green-feeders/${code}.png`;
  }

  // Generic fallback for green line (if no feeder match)
  if (stepText.includes("Green")) {
    return "images/green-line.jpeg";
  }

  return null; // nothing matched
}



