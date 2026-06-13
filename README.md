# 🌿 Mon Tableau de Vie

Dashboard personnel PWA (Progressive Web App) — accessible depuis n'importe quel appareil, installable sur l'écran d'accueil, fonctionne hors-ligne.

🔗 **[Ouvrir l'app](https://alexandramallah.github.io/Mon-Tableau-de-Vie)**

---

## ✨ Fonctionnalités

### 📅 Aujourd'hui
- Navigation jour par jour (passé / futur)
- **Météo** en temps réel (Open-Meteo, sans clé API, géolocalisation auto)
- Anneaux de progression des habitudes
- Humeur, sommeil (horaires + qualité), énergie
- **💊 Suivi pilule** — bouton à cocher, streak affiché
- To-do du jour
- Journal / routines

### 💼 Travail
- Projets & tâches (avec jalons, priorité, avancement)
- Bilan hebdo / mensuel
- Candidatures, articles, communications
- Gestion du temps & missions pro
- **📓 Notes** — groupes, éditeur WYSIWYG (gras, italique, titres, listes…)
- Réseau / CRM

### 🏃 Activités
- Suivi des séances sportives semaine par semaine
- Planning sport
- Graphique 14 jours

### 🩺 Santé
- Composition corporelle (poids, masse grasse, masse maigre)
- Hydratation quotidienne
- Bien-être sur 30 jours
- Routines (skincare…) — streak et calendrier 30 jours
- **💊 Suivi pilule** — calendrier 90 jours, streak, record, % du mois
- Pas quotidiens
- Tendances & prédictions

### 💰 Finances
- Comptes courant & épargne avec soldes automatiques
- Transactions (dépenses, revenus, épargne, hors compte, frais pro)
- Catégories personnalisées + catégories pro automatiques
- Jauge budget mensuel
- **📉 Évolution du solde** — courbe sur 90 jours
- **⚖️ Comparaison mois N vs N-1** — dépenses / revenus / épargne / hors compte
- Flux 6 derniers mois
- Répartition par catégorie
- Prévisions & abonnements

### 🍽️ Domestique
- To-do du jour (partagé avec Aujourd'hui)
- Planning repas
- Liste de courses (par événement)
- 🌱 Plantes — fréquence d'arrosage, alertes

### 📅 Calendrier
- Vue mensuelle interactive
- Import ICS (Google Agenda, etc.)
- Synchronisation Google Agenda via URL iCal
- Événements manuels
- Intégration des tâches, jalons, abonnements, plantes

### 📔 Journal
- Journal quotidien libre
- Mots-clés humeur détectés automatiquement

### 🧱 Piliers de vie
- Suivi de 8 piliers (santé, travail, finances, loisirs…)
- Score hebdomadaire avec métriques automatiques

---

## 🚀 Installation sur mobile

1. Ouvre `alexandramallah.github.io/Mon-Tableau-de-Vie` dans **Samsung Internet** ou **Chrome**
2. Menu → **Ajouter à l'écran d'accueil**
3. L'app s'installe comme une vraie application, fonctionne hors-ligne

---

## 🔧 Stack technique

| Élément | Détail |
|---|---|
| Frontend | HTML / CSS / JS vanilla — fichier unique `index.html` |
| Graphiques | Chart.js 4 |
| Sync cloud | Firebase Firestore (auth Google) |
| Stockage local | `localStorage` |
| PWA | Service Worker network-first, cache offline |
| Hébergement | GitHub Pages |
| Météo | [Open-Meteo](https://open-meteo.com) (gratuit, sans clé) |
| Géocodage | [Nominatim](https://nominatim.org) (OpenStreetMap) |

---

## 🔄 Mises à jour

Les mises à jour sont **automatiques** — l'app se recharge toute seule quand une nouvelle version est disponible (toast "🔄 Mise à jour — rechargement…").

Le numéro de version est visible dans le titre de l'onglet (`v189`).
