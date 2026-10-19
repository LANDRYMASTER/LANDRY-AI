/* ============================================================
   LANDRY — Storage Manager
   Gestion de la persistance des conversations par utilisateur
   via localStorage (fonctionne même après un refresh)
   ============================================================ */

const StorageManager = (() => {
  const PREFIX = "landry_user_";
  const SESSION_KEY = "landry_active_session";

  /* ────────────────────────────────────────────────────────────
     Structure d'un profil utilisateur en localStorage :
     {
       userId: "LANDRY2024",
       conversationId: "dify-conv-xxx",   ← ID Dify pour continuité
       history: [
         { role: "assistant" | "user", text: "...", time: "14:30" },
         ...
       ],
       lastSeen: 1700000000000
     }
  ──────────────────────────────────────────────────────────── */

  /* ── Clé localStorage pour un utilisateur ─────────────────── */
  function _key(userId) {
    return PREFIX + userId.toUpperCase();
  }

  /* ── Charger le profil d'un utilisateur ───────────────────── */
  function loadProfile(userId) {
    try {
      const raw = localStorage.getItem(_key(userId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[LANDRY Storage] Erreur de lecture:", e);
      return null;
    }
  }

  /* ── Sauvegarder le profil d'un utilisateur ───────────────── */
  function saveProfile(userId, data) {
    try {
      const profile = {
        userId: userId.toUpperCase(),
        conversationId: data.conversationId || "",
        history: data.history || [],
        lastSeen: Date.now(),
      };
      localStorage.setItem(_key(userId), JSON.stringify(profile));
    } catch (e) {
      console.warn("[LANDRY Storage] Erreur de sauvegarde:", e);
    }
  }

  /* ── Ajouter un message à l'historique ────────────────────── */
  function appendMessage(userId, role, text, time) {
    const profile = loadProfile(userId) || { conversationId: "", history: [] };
    profile.history.push({ role, text, time });
    // Limiter à 200 messages max pour ne pas surcharger localStorage
    if (profile.history.length > 200) {
      profile.history = profile.history.slice(-200);
    }
    saveProfile(userId, profile);
  }

  /* ── Mettre à jour le conversation_id Dify ────────────────── */
  function setConversationId(userId, convId) {
    const profile = loadProfile(userId) || { conversationId: "", history: [] };
    profile.conversationId = convId;
    saveProfile(userId, profile);
  }

  /* ── Obtenir le conversation_id sauvegardé ────────────────── */
  function getConversationId(userId) {
    const profile = loadProfile(userId);
    return profile ? profile.conversationId : "";
  }

  /* ── Obtenir l'historique complet ─────────────────────────── */
  function getHistory(userId) {
    const profile = loadProfile(userId);
    return profile ? profile.history : [];
  }

  /* ── Effacer la conversation d'un utilisateur ─────────────── */
  function clearConversation(userId) {
    const profile = loadProfile(userId);
    if (profile) {
      profile.conversationId = "";
      profile.history = [];
      saveProfile(userId, profile);
    }
  }

  /* ── Session active (utilisateur connecté) ────────────────── */
  function setActiveUser(userId) {
    sessionStorage.setItem(SESSION_KEY, userId.toUpperCase());
  }

  function getActiveUser() {
    return sessionStorage.getItem(SESSION_KEY) || null;
  }

  function clearActiveUser() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ── Vérifier si un utilisateur a déjà une session ─────────── */
  function hasExistingSession(userId) {
    const profile = loadProfile(userId);
    return profile && profile.history && profile.history.length > 0;
  }

  /* ── Informations de debug ────────────────────────────────── */
  function debugInfo(userId) {
    const profile = loadProfile(userId);
    if (!profile) return null;
    return {
      userId: profile.userId,
      messagesCount: profile.history.length,
      conversationId: profile.conversationId,
      lastSeen: new Date(profile.lastSeen).toLocaleString("fr-CI"),
    };
  }

  /* ── Public API ───────────────────────────────────────────── */
  return {
    loadProfile,
    saveProfile,
    appendMessage,
    setConversationId,
    getConversationId,
    getHistory,
    clearConversation,
    setActiveUser,
    getActiveUser,
    clearActiveUser,
    hasExistingSession,
    debugInfo,
  };
})();
