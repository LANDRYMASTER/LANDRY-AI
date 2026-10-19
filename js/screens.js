/* ============================================================
   LANDRY — Screen Manager
   Handles screen transitions, navigation, and screen-specific logic
   ============================================================ */

const ScreenManager = (() => {
  /* ── State ───────────────────────────────────────────────── */
  let currentScreen = null;
  const screens = {};
  const screenOrder = ["welcome", "access", "consent", "loading", "chat"];

  /* ── Initialize ──────────────────────────────────────────── */
  function init() {
    // Register all screens
    screenOrder.forEach((name) => {
      const el = document.getElementById(`screen-${name}`);
      if (el) {
        screens[name] = el;
      }
    });

    // Show the welcome screen
    navigateTo("welcome");
  }

  /* ── Navigate to a Screen ────────────────────────────────── */
  function navigateTo(screenName, options = {}) {
    const target = screens[screenName];
    if (!target) {
      console.warn(`[LANDRY] Screen "${screenName}" not found.`);
      return;
    }

    // Exit current screen
    if (currentScreen && screens[currentScreen]) {
      const currentEl = screens[currentScreen];
      currentEl.classList.add("exiting");

      setTimeout(() => {
        currentEl.classList.remove("active", "exiting");
        currentEl.setAttribute("aria-hidden", "true");
      }, 300);
    }

    // Enter new screen
    setTimeout(() => {
      target.classList.add("active");
      target.setAttribute("aria-hidden", "false");
      currentScreen = screenName;

      // Run screen-specific initialization
      onScreenEnter(screenName, options);

      // Focus management for accessibility
      const firstFocusable = target.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 400);
      }
    }, currentScreen ? 300 : 0);
  }

  /* ── Screen Enter Handlers ───────────────────────────────── */
  function onScreenEnter(screenName, options) {
    switch (screenName) {
      case "welcome":
        initWelcome();
        break;
      case "access":
        initAccess();
        break;
      case "consent":
        initConsent();
        break;
      case "loading":
        initLoading();
        break;
      case "chat":
        initChat();
        break;
    }
  }

  /* ── Screen 1: Welcome ───────────────────────────────────── */
  function initWelcome() {
    const avatar = document.querySelector("#screen-welcome .avatar");
    const greeting = document.querySelector(".welcome-greeting");
    const name = document.querySelector(".welcome-name");
    const subtitle = document.querySelector(".welcome-subtitle");
    const btn = document.querySelector("#btn-start");
    const badge = document.querySelector(".secure-badge");

    // Staggered entrance animations
    const elements = [avatar, greeting, name, subtitle, btn, badge];
    elements.forEach((el, i) => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        setTimeout(() => {
          el.style.transition = `opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)`;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, 200 + i * 120);
      }
    });

    // Start avatar breathing after entrance
    setTimeout(() => {
      if (avatar) {
        avatar.closest(".avatar-container").classList.add("anim-breathing");
      }
    }, 1200);
  }

  /* ── Screen 2: Access Code ───────────────────────────────── */
  function initAccess() {
    const input = document.getElementById("access-code");
    const errorEl = document.getElementById("access-error");

    if (input) {
      input.value = "";
      if (errorEl) errorEl.textContent = "";
      input.classList.remove("error");

      // Animate in
      const elements = document.querySelectorAll("#screen-access .anim-fade-in-up");
      elements.forEach((el, i) => {
        el.style.animationDelay = `${200 + i * 100}ms`;
      });
    }
  }

  /* ── Screen 3: Consent ───────────────────────────────────── */
  function initConsent() {
    const checkbox = document.getElementById("consent-checkbox");
    const btn = document.getElementById("btn-accept");

    if (checkbox) {
      checkbox.checked = false;
    }
    if (btn) {
      btn.disabled = true;
    }
  }

  /* ── Screen 4: Loading ───────────────────────────────────── */
  function initLoading() {
    const messages = LANDRY_CONFIG.messages.loading;
    const container = document.getElementById("loading-text");
    let currentIndex = 0;

    if (!container) return;

    // Create message elements
    container.innerHTML = "";
    messages.forEach((msg, i) => {
      const span = document.createElement("span");
      span.className = "loading-message";
      span.textContent = msg;
      if (i === 0) span.classList.add("active");
      container.appendChild(span);
    });

    // Rotate messages
    const interval = setInterval(() => {
      const allMessages = container.querySelectorAll(".loading-message");
      allMessages[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % messages.length;
      allMessages[currentIndex].classList.add("active");
    }, 800);

    // Navigate to chat after loading duration
    setTimeout(() => {
      clearInterval(interval);
      navigateTo("chat");
    }, LANDRY_CONFIG.ui.loadingDuration);
  }

  /* ── Screen 5: Chat ──────────────────────────────────────── */
  function initChat() {
    // Chat initialization is handled by ChatManager in app.js
    if (typeof ChatManager !== "undefined" && ChatManager.init) {
      ChatManager.init();
    }
  }

  /* ── Public API ──────────────────────────────────────────── */
  return {
    init,
    navigateTo,
    getCurrentScreen: () => currentScreen,
  };
})();
