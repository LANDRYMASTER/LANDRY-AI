/* ============================================================
   LANDRY — Configuration
   Dify Integration & Application Settings
   ============================================================ */

const LANDRY_CONFIG = {
  /* ── Dify API Configuration ──────────────────────────────── */
  dify: {
    DIFY_URL: "https://api.dify.ai/v1",        // e.g., "https://api.dify.ai/v1"
    API_KEY: "app-fRkQLKrySy3N0zuvUVPuS3kd",         // Your Dify API key
    CONVERSATION_ID: "", // Will be set after first message
    USER_ID: "",         // Generated per session
  },

  /* ── Application Settings ────────────────────────────────── */
  app: {
    name: "LANDRY",
    version: "1.0.0",
    language: "fr",
    locale: "fr-CI",
    environment: "production",
  },

  /* ── UI Settings ─────────────────────────────────────────── */
  ui: {
    loadingDuration: 2500,          // Loading screen duration (ms)
    typingSpeed: 40,                // Typing animation speed (ms per char)
    typingIndicatorDuration: 1500,  // Typing dots duration (ms)
    maxMessageLength: 1000,         // Character limit for messages
    messageAnimationDelay: 100,     // Delay between message animations
    autoScrollDelay: 300,           // Delay before auto-scroll
  },

  /* ── Messages ────────────────────────────────────────────── */
  messages: {
    loading: [
      "Je prépare notre conversation...",
      "Je prends quelques instants...",
      "Bienvenue...",
      "Je suis là pour toi...",
    ],
    suggestions: [
      { text: "Je me sens stressé", icon: "😰" },
      { text: "J'ai besoin de parler", icon: "💬" },
      { text: "Je suis triste", icon: "😢" },
      { text: "Je veux juste discuter", icon: "🌿" },
    ],
    welcome: "Bonjour ! Je suis LANDRY, ton compagnon émotionnel. Je suis là pour t'écouter, sans jugement. Comment te sens-tu aujourd'hui ?",
    errors: {
      network: "Désolé, je n'arrive pas à me connecter. Vérifie ta connexion internet.",
      generic: "Quelque chose ne s'est pas bien passé. Réessaie s'il te plaît.",
      rateLimit: "Prenons une petite pause. Réessaie dans quelques instants.",
    },
  },

  /* ── Access Codes & Utilisateurs ───────────────────────────── */
  access: {
    enabled: true,
    allowBypass: false,

    // 10 utilisateurs pré-programmés — chaque code est unique et
    // sert d'identifiant pour sauvegarder la conversation de cet utilisateur.
    // Format : { code, name, color }  (color = couleur d'avatar optionnelle)
    users: [
      { code: "LANDRY2024", name: "Utilisateur 1",  color: "#7B61FF" },
      { code: "BIENETRE",   name: "Utilisateur 2",  color: "#A88BFF" },
      { code: "ECOUTE",     name: "Utilisateur 3",  color: "#5DD6F0" },
      { code: "PAIX2024",   name: "Utilisateur 4",  color: "#F0A5DD" },
      { code: "ESPOIR",     name: "Utilisateur 5",  color: "#F5C542" },
      { code: "COURAGE",    name: "Utilisateur 6",  color: "#42F5A7" },
      { code: "LUMIERE",    name: "Utilisateur 7",  color: "#F57C42" },
      { code: "SEREIN",     name: "Utilisateur 8",  color: "#6AF542" },
      { code: "DOUCEUR",    name: "Utilisateur 9",  color: "#42C8F5" },
      { code: "ZENITUDE",   name: "Utilisateur 10", color: "#F54242" },
    ],

    // Codes valides extraits automatiquement de la liste ci-dessus
    get validCodes() {
      return this.users.map((u) => u.code);
    },

    // Trouver un utilisateur par son code
    findUser(code) {
      return this.users.find(
        (u) => u.code === code.toUpperCase()
      ) || null;
    },
  },

  /* ── Persistance ─────────────────────────────────────────── */
  persistence: {
    // Sauvegarder l'historique entre les sessions (localStorage)
    enabled: true,
    // Nombre max de messages conservés par utilisateur
    maxMessages: 200,
    // Restaurer automatiquement la conversation au retour
    autoRestore: true,
  },

  /* ── Consent ─────────────────────────────────────────────── */
  consent: {
    version: "1.0",
    links: {
      conditions: "#conditions",
      privacy: "#privacy",
    },
  },

  /* ── Feature Flags (Future) ──────────────────────────────── */
  features: {
    whatsapp: true,
    voice: false,
    memory: false,
    notifications: false,
    emotionDetection: false,
    userAccounts: false,
    analytics: false,
    attachments: false,
    voiceMessages: false,
  },

  /* ── Analytics (Future) ──────────────────────────────────── */
  analytics: {
    enabled: false,
    endpoint: "",
  },
};

/* ── Dify API Helper ─────────────────────────────────────── */
const DifyAPI = {
  /**
   * Send a message to Dify and get a response
   * @param {string} message - User message
   * @returns {Promise<string>} - Assistant response
   */
  async sendMessage(message) {
    const { DIFY_URL, API_KEY, CONVERSATION_ID, USER_ID } = LANDRY_CONFIG.dify;

    // If Dify is not configured, return a simulated response
    if (!DIFY_URL || !API_KEY) {
      return this._simulateResponse(message);
    }

    try {
      const response = await fetch(`${DIFY_URL}/chat-messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          query: message,
          response_mode: "blocking",
          conversation_id: CONVERSATION_ID || "",
          user: USER_ID,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        throw new Error("API_ERROR");
      }

      const data = await response.json();

      // Store conversation ID for continuity
      if (data.conversation_id) {
        LANDRY_CONFIG.dify.CONVERSATION_ID = data.conversation_id;
        // Persister dans localStorage pour survie après refresh
        if (typeof StorageManager !== "undefined") {
          const activeUser = StorageManager.getActiveUser();
          if (activeUser) {
            StorageManager.setConversationId(activeUser, data.conversation_id);
          }
        }
      }

      return data.answer;
    } catch (error) {
      console.error("[LANDRY] Dify API error:", error);
      if (error.message === "RATE_LIMIT") {
        return LANDRY_CONFIG.messages.errors.rateLimit;
      }
      return LANDRY_CONFIG.messages.errors.network;
    }
  },

  /**
   * Simulated response for demo / offline mode
   * @param {string} message - User message
   * @returns {Promise<string>} - Simulated response
   */
  async _simulateResponse(message) {
    const responses = [
      "Je t'entends. Merci de partager ça avec moi. Peux-tu m'en dire un peu plus sur ce que tu ressens ?",
      "C'est courageux de ta part de parler de ça. Je suis là pour t'écouter. Comment ça se manifeste au quotidien ?",
      "Je comprends que ça puisse être difficile. Tu n'es pas seul(e). Qu'est-ce qui te pèse le plus en ce moment ?",
      "Merci pour ta confiance. Prends ton temps, il n'y a pas de pression ici. Qu'est-ce qui t'aiderait le plus maintenant ?",
      "Ce que tu ressens est tout à fait valide. Parlons-en ensemble. Depuis quand tu te sens comme ça ?",
      "Je suis content(e) que tu te confies. C'est un premier pas important. Comment puis-je t'accompagner ?",
    ];

    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 1200)
    );

    return responses[Math.floor(Math.random() * responses.length)];
  },

  /**
   * Generate a unique user ID for the session
   * @returns {string} - UUID
   */
  generateUserId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  },

  /**
   * Reset conversation (start fresh)
   */
  resetConversation() {
    LANDRY_CONFIG.dify.CONVERSATION_ID = "";
  },
};

// Initialize user ID on load
LANDRY_CONFIG.dify.USER_ID = DifyAPI.generateUserId();
