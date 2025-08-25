// Toggle mobile menu
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
