// public/swagger-custom.js

function initializeSwaggerCustomizations() {
  try {
    const topbar = document.querySelector('.swagger-ui .topbar .topbar-wrapper');
    const infoContainer = document.querySelector('.swagger-ui .info');

    // Exit if the essential elements aren't ready yet
    if (!topbar || !infoContainer) {
      return;
    }

    // --- 1. SETUP TOP BAR BUTTONS ---
    if (!document.querySelector('.custom-btn-container')) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'custom-btn-container';

      // Re-introduce the "Home" button with text/emoji
      const homeButton = document.createElement('a');
      homeButton.href = '/';
      homeButton.target = '_self';
      homeButton.className = 'topbar-btn';
      homeButton.innerHTML = '🏠 Home';
      buttonContainer.appendChild(homeButton);

      const backButton = document.createElement('button');
      backButton.className = 'topbar-btn';
      backButton.innerHTML = '⏪ Back';
      backButton.onclick = () => history.back();
      buttonContainer.appendChild(backButton);

      const schemasButton = document.createElement('button');
      schemasButton.className = 'topbar-btn';
      schemasButton.innerHTML = '📜 Schemas';
      schemasButton.onclick = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      };
      buttonContainer.appendChild(schemasButton);

      topbar.prepend(buttonContainer);
    }
    
    // --- 2. INJECT LOGO INTO INFO SECTION ---
    if (!document.getElementById('info-section-logo')) {
      const logoDiv = document.createElement('div');
      logoDiv.id = 'info-section-logo';
      // The div is empty; CSS will handle the background image.
      infoContainer.prepend(logoDiv);
    }

    // --- 3. "BACK TO TOP" BUTTON (Unchanged) ---
    if (!document.getElementById('back-to-top-btn')) {
      const backToTopButton = document.createElement('button');
      backToTopButton.id = 'back-to-top-btn';
      backToTopButton.innerHTML = '↑';
      document.body.appendChild(backToTopButton);
      backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
          backToTopButton.classList.add('show');
        } else {
          backToTopButton.classList.remove('show');
        }
      });
    }

  } catch (error) {
    console.error("Swagger custom script failed:", error);
  }
}

const observer = new MutationObserver((mutations, obs) => {
  const swaggerUI = document.getElementById('swagger-ui');
  if (swaggerUI && swaggerUI.children.length > 0) {
    initializeSwaggerCustomizations();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});