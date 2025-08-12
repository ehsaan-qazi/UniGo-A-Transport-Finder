// Toggle mobile menu
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector('.menu-icon');
  const overlayMenu = document.querySelector('.overlay-menu');

  if (menuIcon && overlayMenu) {
    menuIcon.addEventListener('click', () => {
      overlayMenu.classList.toggle('show');
    });

    // Close menu when a link is clicked (optional)
    overlayMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        overlayMenu.classList.remove('show');
      });
    });
  }
});
