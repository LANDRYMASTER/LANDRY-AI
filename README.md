# 🌿 LANDRY — Ton Compagnon Émotionnel

<p align="center">
  <img src="assets/avatar-landry.png" alt="LANDRY Avatar" width="120" style="border-radius: 50%;">
</p>

<p align="center">
  <strong>Un espace d'écoute confidentiel et bienveillant pour ton bien-être psychologique.</strong>
</p>

<p align="center">
  Conçu pour la Côte d'Ivoire 🇨🇮
</p>

---

## 📖 À Propos

LANDRY est un compagnon émotionnel alimenté par l'intelligence artificielle. Il est conçu pour offrir une écoute bienveillante, un soutien au bien-être psychologique et une orientation vers les ressources appropriées.

**LANDRY n'est pas un chatbot.** C'est un espace de confiance où l'on se sent écouté.

### Principes

- 🔒 **Confidentiel** — Tes conversations restent privées
- 🤝 **Bienveillant** — Aucun jugement, seulement de l'écoute
- 🧠 **Éthique** — Respecte les limites de l'IA
- 🌍 **Local** — Pensé pour la Côte d'Ivoire

---

## 🚀 Démarrage Rapide

### Prérequis

- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Aucune installation requise

### Lancement

1. Ouvrez `index.html` dans votre navigateur
2. C'est tout ! ✨

### Codes d'accès (démo)

Pour la démonstration, utilisez l'un de ces codes :

| Code | Description |
|------|-------------|
| `LANDRY2024` | Code principal |
| `BIENETRE` | Code alternatif |
| `ECOUTE` | Code alternatif |

---

## 📁 Structure du Projet

```
landry-ui/
│
├── index.html              # Page principale
├── css/
│   ├── variables.css       # Variables CSS (design system)
│   ├── style.css           # Styles principaux
│   ├── animation.css       # Micro-animations
│   └── responsive.css      # Responsive breakpoints
│
├── js/
│   ├── config.js           # Configuration & API Dify
│   ├── screens.js          # Gestion des écrans
│   └── app.js              # Logique principale
│
├── assets/
│   ├── avatar-landry.png   # Avatar 3D de LANDRY
│   ├── logo.svg            # Logo LANDRY
│   ├── icons/              # Icônes (réservé)
│   └── illustrations/      # Illustrations (réservé)
│
└── README.md               # Ce fichier
```

---

## 🎨 Design System

### Palette de Couleurs

| Usage | Couleur | Hex |
|-------|---------|-----|
| Primary Background | ⬜ | `#FFFFFF` |
| Secondary Background | 🔲 | `#FAFAFC` |
| Primary | 🟣 | `#7B61FF` |
| Secondary | 💜 | `#A88BFF` |
| Accent | 🌸 | `#ECE8FF` |
| Text | ⬛ | `#111111` |
| Secondary Text | 🔘 | `#6B7280` |
| Success | 🟢 | `#22C55E` |
| Warning | 🟡 | `#F59E0B` |
| Danger | 🔴 | `#EF4444` |

### Typographie

- **Police** : Inter (Google Fonts)
- **Poids** : 400, 500, 600, 700
- **Radius** : 24px (principal)

### Animations

- Fade In / Slide Up
- Avatar Breathing
- Typing Indicator
- Button Ripple
- Card Hover Lift
- Screen Transitions

---

## 🔌 Intégration Dify

Pour connecter LANDRY à Dify :

1. Ouvrez `js/config.js`
2. Renseignez vos identifiants :

```javascript
dify: {
  DIFY_URL: "https://api.dify.ai/v1",
  API_KEY: "votre-clé-api",
}
```

3. Sauvegardez et rechargez la page

> **Note** : Sans configuration Dify, LANDRY fonctionne en mode démonstration avec des réponses simulées.

---

## ♿ Accessibilité

- ✅ ARIA labels sur tous les éléments interactifs
- ✅ Navigation au clavier
- ✅ Focus visible
- ✅ HTML sémantique
- ✅ `prefers-reduced-motion` respecté
- ✅ Mode sombre automatique
- ✅ Contraste élevé
- ✅ Skip to content

---

## 📱 Responsive

Optimisé pour :

- 📱 Mobile (320px+)
- 📱 Tablette (480px+)
- 💻 Desktop (768px+)
- 🖥️ Grand écran (1200px+)
- 📱 Mode paysage
- 📱 Encoche iPhone (safe area)

---

## 🔮 Fonctionnalités Futures

L'architecture est prête pour l'ajout de :

- [ ] WhatsApp
- [ ] Saisie vocale
- [ ] Mémoire de conversation
- [ ] Notifications
- [ ] Détection d'émotion
- [ ] Comptes utilisateurs
- [ ] Analytics
- [ ] Pièces jointes

Activez-les dans `config.js` → `features`.

---

## ⚡ Performance

- ✅ Aucune bibliothèque externe (sauf Google Fonts)
- ✅ CSS optimisé et organisé
- ✅ Lazy loading des images
- ✅ Pas de code dupliqué
- ✅ Pas de CSS inline
- ✅ Pas de JS inline

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés.

---

<p align="center">
  Fait avec 💜 pour la Côte d'Ivoire
</p>
