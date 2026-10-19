/* ============================================================
   LANDRY — Main Application
   Core application logic, event handlers, and chat management
   ============================================================ */

/* ── Chat Manager ──────────────────────────────────────────── */

const ChatManager = (() => {
  let messagesContainer = null;
  let inputField = null;
  let sendButton = null;
  let charCounter = null;
  let suggestionsContainer = null;
  let isTyping = false;
  let isInitialized = false;

  /* ── Initialize Chat ─────────────────────────────────────── */
  function init() {
    if (isInitialized) return;

    messagesContainer = document.getElementById("chat-messages");
    inputField = document.getElementById("chat-input");
    sendButton = document.getElementById("btn-send");
    charCounter = document.getElementById("char-counter");
    suggestionsContainer = document.getElementById("suggestions");

    if (!messagesContainer || !inputField) return;

    setupInputListeners();

    // ── Restaurer la conversation sauvegardée si elle existe ──
    const activeUser = StorageManager.getActiveUser();
    if (
      activeUser &&
      LANDRY_CONFIG.persistence.enabled &&
      LANDRY_CONFIG.persistence.autoRestore &&
      StorageManager.hasExistingSession(activeUser)
    ) {
      // Restaurer le conversation_id Dify pour continuer le fil
      const savedConvId = StorageManager.getConversationId(activeUser);
      if (savedConvId) {
        LANDRY_CONFIG.dify.CONVERSATION_ID = savedConvId;
      }
      _restoreHistory(activeUser);
    } else {
      // Première fois : afficher suggestions + message de bienvenue
      showSuggestions();
      setTimeout(() => {
        addAssistantMessage(LANDRY_CONFIG.messages.welcome, true);
      }, 600);
    }

    isInitialized = true;
  }

  /* ── Restaurer l'historique depuis localStorage ───────────── */
  function _restoreHistory(userId) {
    const history = StorageManager.getHistory(userId);
    if (!history || history.length === 0) {
      showSuggestions();
      setTimeout(() => {
        addAssistantMessage(LANDRY_CONFIG.messages.welcome, true);
      }, 600);
      return;
    }

    // Badge "conversation restaurée"
    const badge = document.createElement("div");
    badge.className = "restore-badge";
    badge.innerHTML = `
      <span>💬 Conversation précédente restaurée</span>
      <button id="btn-clear-history" title="Effacer l'historique">🗑️ Effacer</button>
    `;
    messagesContainer.appendChild(badge);

    document.getElementById("btn-clear-history")?.addEventListener("click", () => {
      StorageManager.clearConversation(userId);
      LANDRY_CONFIG.dify.CONVERSATION_ID = "";
      messagesContainer.innerHTML = "";
      isInitialized = false;
      init();
    });

    // Rejouer les messages sans animation de frappe
    history.forEach((msg) => {
      _addMessageRaw(msg.role, msg.text, msg.time);
    });

    scrollToBottom();
  }

  /* ── Ajouter un message restauré (sans sauvegarde) ─────────── */
  function _addMessageRaw(role, text, time) {
    const wrapper = document.createElement("div");
    wrapper.className = `message message-${role} message-animated`;
    wrapper.setAttribute("role", "listitem");

    if (role === "assistant") {
      wrapper.innerHTML = `
        <div class="message-avatar">
          <img src="assets/avatar-landry.png" alt="LANDRY" class="avatar avatar-xs" loading="lazy">
        </div>
        <div class="message-content">
          <div class="message-bubble" aria-label="Message de LANDRY">${escapeHTML(text)}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="message-content">
          <div class="message-bubble" aria-label="Votre message">${escapeHTML(text)}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
    }
    messagesContainer.appendChild(wrapper);
  }

  /* ── Input Listeners ─────────────────────────────────────── */
  function setupInputListeners() {
    // Auto-resize textarea
    inputField.addEventListener("input", () => {
      autoResize();
      updateSendButton();
      updateCharCounter();
    });

    // Send on Enter (without Shift)
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Send button click
    sendButton.addEventListener("click", sendMessage);
  }

  /* ── Auto-resize Textarea ────────────────────────────────── */
  function autoResize() {
    inputField.style.height = "auto";
    inputField.style.height = Math.min(inputField.scrollHeight, 100) + "px";
  }

  /* ── Update Send Button State ────────────────────────────── */
  function updateSendButton() {
    const hasText = inputField.value.trim().length > 0;
    sendButton.classList.toggle("active", hasText);
    sendButton.setAttribute("aria-disabled", !hasText);
  }

  /* ── Character Counter ───────────────────────────────────── */
  function updateCharCounter() {
    const current = inputField.value.length;
    const max = LANDRY_CONFIG.ui.maxMessageLength;

    if (current > 0) {
      charCounter.textContent = `${current}/${max}`;
      charCounter.style.opacity = "1";

      charCounter.classList.remove("warning", "danger");
      if (current >= max) {
        charCounter.classList.add("danger");
        inputField.value = inputField.value.substring(0, max);
      } else if (current >= max * 0.85) {
        charCounter.classList.add("warning");
      }
    } else {
      charCounter.style.opacity = "0";
    }
  }

  /* ── Send Message ────────────────────────────────────────── */
  async function sendMessage() {
    const text = inputField.value.trim();
    if (!text || isTyping) return;

    // Hide suggestions
    hideSuggestions();

    // Add user message
    addUserMessage(text);

    // Clear input
    inputField.value = "";
    autoResize();
    updateSendButton();
    updateCharCounter();

    // Show typing indicator
    showTypingIndicator();

    // Get response from Dify (or simulated)
    try {
      const response = await DifyAPI.sendMessage(text);
      hideTypingIndicator();
      addAssistantMessage(response);
    } catch (error) {
      hideTypingIndicator();
      addAssistantMessage(LANDRY_CONFIG.messages.errors.generic);
    }
  }

  /* ── Add User Message ────────────────────────────────────── */
  function addUserMessage(text) {
    const messageEl = createMessageElement("user", text);
    messagesContainer.appendChild(messageEl);

    // Sauvegarder dans localStorage
    const now = new Date();
    const time = now.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" });
    const activeUser = StorageManager.getActiveUser();
    if (activeUser && LANDRY_CONFIG.persistence.enabled) {
      StorageManager.appendMessage(activeUser, "user", text, time);
    }

    scrollToBottom();
  }

  /* ── Add Assistant Message ───────────────────────────────── */
  function addAssistantMessage(text, save = true) {
    const messageEl = createMessageElement("assistant", text);
    messagesContainer.appendChild(messageEl);

    // Typing animation for text
    const bubble = messageEl.querySelector(".message-bubble");
    typeText(bubble, text);

    // Sauvegarder dans localStorage
    const now = new Date();
    const time = now.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" });
    const activeUser = StorageManager.getActiveUser();
    if (save && activeUser && LANDRY_CONFIG.persistence.enabled) {
      StorageManager.appendMessage(activeUser, "assistant", text, time);
    }

    scrollToBottom();
  }

  /* ── Create Message Element ──────────────────────────────── */
  function createMessageElement(type, text) {
    const wrapper = document.createElement("div");
    wrapper.className = `message message-${type} message-animated`;
    wrapper.setAttribute("role", "listitem");

    const now = new Date();
    const time = now.toLocaleTimeString("fr-CI", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (type === "assistant") {
      wrapper.innerHTML = `
        <div class="message-avatar">
          <img src="assets/avatar-landry.png" alt="LANDRY" class="avatar avatar-xs" loading="lazy">
        </div>
        <div class="message-content">
          <div class="message-bubble" aria-label="Message de LANDRY"></div>
          <div class="message-time">${time}</div>
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="message-content">
          <div class="message-bubble" aria-label="Votre message">${escapeHTML(text)}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
    }

    return wrapper;
  }

  /* ── Typing Animation ────────────────────────────────────── */
  function typeText(element, text) {
    element.textContent = "";
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        element.textContent += text[index];
        index++;
        scrollToBottom();
      } else {
        clearInterval(interval);
      }
    }, LANDRY_CONFIG.ui.typingSpeed);
  }

  /* ── Typing Indicator ────────────────────────────────────── */
  function showTypingIndicator() {
    isTyping = true;

    const typingEl = document.createElement("div");
    typingEl.className = "chat-typing message-animated";
    typingEl.id = "typing-indicator";
    typingEl.setAttribute("aria-label", "LANDRY est en train d'écrire");

    typingEl.innerHTML = `
      <div class="message-avatar">
        <img src="assets/avatar-landry.png" alt="" class="avatar avatar-xs" loading="lazy">
      </div>
      <div class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;

    messagesContainer.appendChild(typingEl);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    isTyping = false;
    const typingEl = document.getElementById("typing-indicator");
    if (typingEl) {
      typingEl.style.opacity = "0";
      setTimeout(() => typingEl.remove(), 200);
    }
  }

  /* ── Suggestions ─────────────────────────────────────────── */
  function showSuggestions() {
    if (!suggestionsContainer) return;
    suggestionsContainer.style.display = "flex";
  }

  function hideSuggestions() {
    if (!suggestionsContainer) return;
    suggestionsContainer.style.transition = "opacity 0.3s var(--ease-out)";
    suggestionsContainer.style.opacity = "0";
    setTimeout(() => {
      suggestionsContainer.style.display = "none";
    }, 300);
  }

  /* ── Use Suggestion ──────────────────────────────────────── */
  function useSuggestion(text) {
    inputField.value = text;
    updateSendButton();
    updateCharCounter();
    sendMessage();
  }

  /* ── Scroll to Bottom ────────────────────────────────────── */
  function scrollToBottom() {
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }, LANDRY_CONFIG.ui.autoScrollDelay);
  }

  /* ── Escape HTML ─────────────────────────────────────────── */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── Public API ──────────────────────────────────────────── */
  return {
    init,
    sendMessage,
    useSuggestion,
  };
})();

/* ============================================================
   Theme Manager
   ============================================================ */

const ThemeManager = (() => {
  const STORAGE_KEY = "landry-theme";

  function init() {
    // Check saved preference or system preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    // Listen for system changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? "dark" : "light");
      }
    });
  }

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    updateToggleIcon(theme);
  }

  function updateToggleIcon(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    const sunIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonIcon = `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    btn.innerHTML = theme === "dark" ? sunIcon : moonIcon;
    btn.setAttribute("aria-label", theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
  }

  return { init, toggle };
})();

/* ============================================================
   Ripple Effect
   ============================================================ */

function createRipple(event) {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";

  button.appendChild(ripple);

  ripple.addEventListener("animationend", () => ripple.remove());
}

/* ============================================================
   Event Handlers
   ============================================================ */

function setupEventHandlers() {
  /* ── Screen 1: Welcome → Access ──────────────────────────── */
  const btnStart = document.getElementById("btn-start");
  if (btnStart) {
    btnStart.addEventListener("click", (e) => {
      createRipple(e);
      ScreenManager.navigateTo("access");
    });
  }

  /* ── Screen 2: Access Code ───────────────────────────────── */
  const btnAccess = document.getElementById("btn-access");
  const accessInput = document.getElementById("access-code");
  const accessError = document.getElementById("access-error");

  if (btnAccess && accessInput) {
    btnAccess.addEventListener("click", (e) => {
      createRipple(e);
      validateAccessCode();
    });

    accessInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        validateAccessCode();
      }
    });

    // Clear error on input
    accessInput.addEventListener("input", () => {
      accessInput.classList.remove("error");
      if (accessError) accessError.textContent = "";
    });
  }

  function validateAccessCode() {
    const code = accessInput.value.trim().toUpperCase();

    if (!code) {
      showAccessError("Veuillez entrer un code d'accès.");
      return;
    }

    if (LANDRY_CONFIG.access.validCodes.includes(code)) {
      // ── Enregistrer l'utilisateur actif pour la persistance ──
      StorageManager.setActiveUser(code);
      ScreenManager.navigateTo("consent");
    } else {
      showAccessError("Code d'accès invalide. Réessaie.");
    }
  }

  function showAccessError(msg) {
    if (accessError) accessError.textContent = msg;
    if (accessInput) {
      accessInput.classList.add("error");
      accessInput.focus();
    }
  }

  /* ── Screen 2: Back Button ───────────────────────────────── */
  const btnBackAccess = document.getElementById("btn-back-access");
  if (btnBackAccess) {
    btnBackAccess.addEventListener("click", () => {
      ScreenManager.navigateTo("welcome");
    });
  }

  /* ── Screen 3: Consent ───────────────────────────────────── */
  const consentCheckbox = document.getElementById("consent-checkbox");
  const btnAccept = document.getElementById("btn-accept");

  if (consentCheckbox && btnAccept) {
    consentCheckbox.addEventListener("change", () => {
      btnAccept.disabled = !consentCheckbox.checked;
    });

    btnAccept.addEventListener("click", (e) => {
      createRipple(e);
      if (consentCheckbox.checked) {
        ScreenManager.navigateTo("loading");
      }
    });
  }

  const btnBackConsent = document.getElementById("btn-back-consent");
  if (btnBackConsent) {
    btnBackConsent.addEventListener("click", () => {
      ScreenManager.navigateTo("access");
    });
  }

  /* ── Theme Toggle ────────────────────────────────────────── */
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      ThemeManager.toggle();
    });
  }

  /* ── Suggestion Chips ────────────────────────────────────── */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".suggestion-chip");
    if (chip) {
      const text = chip.getAttribute("data-message");
      if (text) {
        ChatManager.useSuggestion(text);
      }
    }
  });

  /* ── Ripple on Primary Buttons ───────────────────────────── */
  document.querySelectorAll(".ripple-container").forEach((btn) => {
    btn.addEventListener("click", createRipple);
  });

  /* ── Attachment Button (Future) ──────────────────────────── */
  const btnAttach = document.getElementById("btn-attach");
  if (btnAttach) {
    btnAttach.addEventListener("click", () => {
      if (LANDRY_CONFIG.features.attachments) {
        // Future: Open attachment picker
        console.log("[LANDRY] Attachments coming soon.");
      }
    });
  }

  /* ── Voice Button (Future) ───────────────────────────────── */
  const btnVoice = document.getElementById("btn-voice");
  if (btnVoice) {
    btnVoice.addEventListener("click", () => {
      if (LANDRY_CONFIG.features.voice) {
        // Future: Start voice recording
        console.log("[LANDRY] Voice input coming soon.");
      }
    });
  }
}

/* ============================================================
   Application Initialization
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize managers
  ThemeManager.init();
  ScreenManager.init();
  setupEventHandlers();

  console.log(
    "%c🌿 LANDRY %cv" + LANDRY_CONFIG.app.version,
    "color: #7B61FF; font-size: 16px; font-weight: bold;",
    "color: #A88BFF; font-size: 12px;"
  );
});
