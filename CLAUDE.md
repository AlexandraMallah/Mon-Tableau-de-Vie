# CLAUDE.md — Mon Tableau de Vie

Fichier de contexte complet pour reprendre le projet sans aucune explication supplémentaire.

---

## Qui est Alexandra

Alexandra Mallah, postdoctorante en géographie (UPHF), française. Ce dashboard est son outil de vie quotidien personnel. Elle n'est pas développeuse — elle ne connaît pas Git, ne lit pas le code, et communique en français. Toutes les réponses doivent être **en français**, concises, et sans jargon technique inutile.

---

## Le projet

**Un dashboard de vie personnel** — fichier HTML unique, auto-hébergé sur GitHub Pages.

- **URL live** : https://alexandramllh.github.io/Mon-Tableau-de-Vie/
- **Repo GitHub** : https://github.com/AlexandraMllh/Mon-Tableau-de-Vie
- **Fichier de travail** : `/Users/alexandramallah/Documents/Mon-Tableau-de-Vie/index.html`
- **Version actuelle** : v199 (dans le `<title>`)
- **Taille** : ~12000 lignes

---

## Stack technique

- **HTML/CSS/JS pur** — zéro framework, zéro build tool, zéro dépendance locale
- **Chart.js 4.4.1** (CDN) — graphiques
- **Firebase 10.7.1** (CDN) — authentification Google + sync Firestore cross-device
- **Persistence locale** : `localStorage` clé `tableauDeVie_v3`
- **Sync cloud** : Firebase Firestore, résolution de conflits par `lastModified` timestamp
- **Google Calendar** : import ICS via proxies CORS (`allorigins.win`, `corsproxy.io`, `thingproxy.freeboard.io`)

### Firebase config (déjà dans le fichier)
```
apiKey: "AIzaSyDPnPO3IQd3puR4qkx0nWFHLHSDAPuAGcM"
authDomain: "mon-tableau-de-vie.firebaseapp.com"
projectId: "mon-tableau-de-vie"
```

---

## Workflow Git — IMPORTANT

Le repo est configuré et les credentials GitHub sont dans le trousseau macOS. Après chaque modification :

```bash
cd /Users/alexandramallah/Documents/Mon-Tableau-de-Vie
git add index.html
git commit -m "description du changement"
git push origin main
```

GitHub Pages se met à jour en ~2 minutes. **Ne jamais dire à Alexandra d'uploader manuellement** — tout se fait via git push désormais.

**Incrémenter le numéro de version dans `<title>` à chaque push** (v32 → v33 → v34…) pour vérifier que la bonne version est chargée.

---

## Architecture du fichier

Le fichier `index.html` est organisé en 4 blocs :
1. `<head>` — meta, CDN scripts, tout le CSS (~1000 lignes)
2. `<body>` — HTML de toutes les vues (~800 lignes)
3. Modals — fenêtres modales (~400 lignes)
4. `<script>` — tout le JS (~5000 lignes)

---

## Vues (onglets de navigation)

| data-view | Nom affiché | Contenu |
|-----------|-------------|---------|
| `today` | Aujourd'hui | Rings résumé, habitudes, bien-être, skincare |
| `work` | Travail | Tâches, temps, postdoc, candidatures, valorisation, enseignement |
| `activities` | Activités | Log des activités physiques/loisirs |
| `health` | Santé | Métriques corporelles, chart sommeil/énergie/humeur |
| `money` | Argent | Transactions, abonnements, comptes |
| `domestic` | Domestique | Courses, tâches ménagères, plantes |
| `calendar` | Calendrier | Vue mensuelle + événements ICS |
| `pillars` | Piliers | Objectifs de vie par domaine |
| `journal` | Journal | Notes quotidiennes avec analyse émotionnelle |

### Sous-vues Travail (`data-sub`)
`tasks` · `time` · `postdoc` · `candidatures` · `valorisation` · `teaching`

### Sous-vues Domestique
`todo` · `domtasks` · `meals` · `groceries` · `plants`
(L'onglet `chores` a été supprimé)

---

## Patterns JS clés

### État global
```javascript
let state = loadState(); // chargé au démarrage
function saveState() { /* localStorage + Firebase debounce 2500ms */ }
```

### Navigation par jour (onglet Aujourd'hui)
```javascript
let _selectedDayKey = null; // null = aujourd'hui
function getSelectedDayKey() { return _selectedDayKey || todayKey(); }
function getToday() { /* retourne state.history[getSelectedDayKey()] */ }
// NE PAS utiliser todayKey() directement pour lire les données du jour
// Toujours passer par getToday() et getSelectedDayKey()
```

### Clé de date
```javascript
function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); } // "2026-05-28"
```

### Structure `state.history[dateKey]`
```javascript
{
  habits: {},      // { habitId: value }
  activities: {},  // { activityId: true/false }
  mood: null,      // 1-5
  sleep: null,     // heures (0-24, step 0.5)
  energy: null,    // 1-5
  weight: null,    // kg
  water: 0,        // verres (rétrocompat, utiliser habits["h-eau"])
  journal: "",
  bedtime: null,   // "23:30"
  wakeTime: null,  // "07:15"
}
```

### Rendu de la vue Aujourd'hui
```javascript
function renderTodayView() {
  renderTodayNav(); renderRings(); renderHabits();
  renderWellbeing(); renderSkincare(); renderJournal();
}
```

### Habitudes numériques vs booléennes
- `type: "numeric"` → input nombre, `isHabitDone` vérifie `value >= target`
- `type: "boolean"` → checkbox toggle
- L'eau (`h-eau`) : target=4 verres, step=1 (pas 100 !)
- Les pas (`h-pas`) : target=9000, step=100

---

## CSS — Conventions

### Variables couleurs principales
```css
--bg-1: #fdf6f0  /* fond chaud */
--bg-2: #f3ecff  /* fond lavande */
--card: #ffffff
--ink: #4a4458   /* texte principal */
--ink-soft: #8a8499
--lavender: #c9b6f0
--mint: #aee0c8
--line: #efeaf5  /* bordures */
--shadow: 0 6px 20px rgba(120,100,160,0.08)
```

### Composants récurrents
- `.card` — carte blanche avec shadow et border-radius
- `.modal-bg` + `.modal` — overlay modal
- `.work-header` — flex row titre + actions
- `.task-row` — ligne de tâche avec priorité
- `.ring-card` — carte avec anneau SVG
- `.habit` / `.habit-numeric` — ligne d'habitude
- `.btn-icon` — bouton pill dans le header

### Design system
Style pastel féminin, doux. Arrondis généreux (12-16px). Pas de couleurs criardes. Palette : lavande, mint, peach, rose, sky, butter.

---

## Fonctionnalités importantes à connaître

### Tâches (section Travail → Tâches)
- Triées par urgence puis deadline
- Priorités : `urgent` 🚨 / `high` 🔴 / `medium` 🟠 / `low` ⚪
- **Jalons** : `t.milestones = [{ name, done }]` — auto-calcule le % d'avancement
- **Progression manuelle** : `t.progress` (0-100) si pas de jalons
- `taskProgress(t)` → retourne le % effectif
- **Barre de couleur** : rouge (0%) → orange → jaune → vert (100%) via `hsl(pct*1.2, 72%, 52%)`
- **Mini calendrier deadlines** à droite de la liste (30 jours, points colorés par priorité)
- Filtre par deadline en cliquant sur un jour du calendrier

### Analyse émotionnelle du journal
- `analyzeJournal(text)` → détecte 8 émotions (Joie, Gratitude, Motivation, Sérénité, Stress, Fatigue, Tristesse, Irritation)
- `JOURNAL_EMOTIONS` — dictionnaire de mots-clés français
- Badges affichés en temps réel sous la textarea journal
- Badges sur les entrées passées
- Reflet dans "Aujourd'hui" → "Comment je me sens" si journal a du contenu

### Google Calendar
- Import ICS via 3 proxies CORS en cascade
- `parseICS()` retourne `{ events, name, color }` — **pas un array** !
- Toujours utiliser `parsed.events.map(...)` et `parsed.events.length`
- Couleurs individuelles des événements : `ev.color || src?.color || "#aee0c8"`
- `GCAL_COLORS` — map nom couleur → hex (tomato, flamingo, peacock, etc.)

### Firebase sync
- `onAuthStateChanged` gère tout — ne jamais montrer le bouton sign-in avant que ça fire
- `_fbLoad()` / `_fbSave()` — chargement/sauvegarde Firestore
- Résolution conflits : `lastModified` timestamp, le plus récent gagne
- Debounce 2500ms sur saveState avant d'écrire dans Firebase

### Navigation jours précédents
- Flèches ◀ ▶ dans l'onglet Aujourd'hui
- `navDay(delta)` — change `_selectedDayKey`
- Impossible d'aller dans le futur

### Cache GitHub Pages
- Script en `<head>` qui ajoute `?_cb=TIMESTAMP` à l'URL sur `github.io`
- Force le CDN à toujours servir la version fraîche
- Plus besoin de Cmd+Shift+R

---

## Migrations de données

Les migrations tournent à chaque `loadState()` dans `migrate(s)`. Migrations existantes :
1. Événements ICS sans sourceId → source par défaut
2. Skincare (h-skincare unique → matin + soir séparés)
3. Habitude h-eau : type numeric, target 4, unit verres
4. `today.water` → `today.habits["h-eau"]`
5. **Valeurs eau > 20** → diviser par 100 (correction step=100 → step=1)
6. Noms d'activités
7. Noms de projets Travail
8. Lier tâches MSCA au projet Candidatures

---

## Projets de travail (seeds)

IDs fixes : `p-seed-postdoc` · `p-seed-candidatures` · `p-seed-valo` · `p-seed-enseignement`

---

## Fonctionnalités ajoutées récemment (v150→v199)

### Finances
- **🏠 Charge fixe** : `tx.fixedCharge = true` — exclue de la jauge budget, du donut dépenses, du graphique flux 6 mois
- **💼 Frais pro** : `tx.reimbursable = true` — exclus du donut dépenses, du flux 6 mois, des objectifs par catégorie
- **Jauge budget** : couleur basée sur `dailyActual / dailyIdeal` (pas sur le % consommé)
- **Évolution du solde** : courbe 90 jours (`balanceEvolutionChart`)
- **Comparaison N vs N-1** : carte `⚖️ Mois en mois`
- Cycle financier : du 26 du mois précédent au 25 du mois courant (`currentMonthRange()`)
- Formulaire "Nouvelle transaction" remonté en haut de page

### Santé
- **💊 Suivi pilule** : `state.history[dk].pillTaken` — checkbox dans Aujourd'hui, calendrier 90j + streak dans Santé
- Fonctions : `togglePill()`, `renderPill()`, `renderPillSante()`, `_pillStreak()`, `_pillBestStreak()`

### Météo
- Widget en haut de l'onglet Aujourd'hui
- API Open-Meteo (gratuit, sans clé) + Nominatim pour la ville
- `fetchWeather()`, `maybeLoadWeather()`
- Codes météo WMO : `WMO_ICONS`, `WMO_DESC`

### Notes Travail
- Éditeur WYSIWYG `contenteditable` + `document.execCommand`
- `_noteFlushToLocalStorage()` : sauvegarde immédiate localStorage à chaque frappe
- `window.addEventListener('pagehide', _noteFlushToLocalStorage)` : protection avant reload
- Interface mobile responsive : navigation panneau (sidebar ↔ éditeur)
- `state.work.workNotes = [{ id, name, emoji, notes: [{id, title, content, createdAt, updatedAt}] }]`

### Domestique
- Onglet **🗒️ Tâches** (`domtasks`) : `state.domestique.tasks = [{id, name, category, priority, deadline, done}]`
- Fonctions : `renderDomesticTasks()`, `addDomesticTask()`, `toggleDomesticTask()`, `deleteDomesticTask()`
- Onglet Ménage supprimé

### Service Worker (mises à jour critiques)
- `{ updateViaCache: 'none' }` sur l'enregistrement + `reg.update()` au démarrage
- `controllerchange` → `window.location.href = '/Mon-Tableau-de-Vie/?_r=' + Date.now()` (PAS `location.reload()` — ne marche pas en PWA Samsung)
- Cache avec `ignoreSearch: true` au fallback (gère `?_cb=timestamp`)
- `_noteFlushToLocalStorage()` appelé avant tout reload

### Icônes PWA
- `apple-touch-icon` dans `<head>` pour iOS (pas le manifest)
- Nommer les nouveaux fichiers icône avec un nouveau suffixe à chaque changement (ex: v3, v4…) pour forcer le re-téléchargement

## Fonctionnalités en attente / à faire

- **Bodytrax importer** : importer les métriques corporelles depuis export Samsung Health ou Bodytrax CSV

---

## Problèmes résolus — ne pas recasser

| Problème | Solution |
|----------|----------|
| `parseICS()` retourne objet pas array | Toujours `.events.map()` et `.events.length` |
| Flash Firebase "Non connecté" | Bouton sign-in seulement dans `onAuthStateChanged` |
| Mobile dark mode | `<meta name="color-scheme" content="light">` + `html { color-scheme: light }` |
| Eau step=100 → valeurs 100/200 | `inputStep = target <= 30 ? 1 : 100` + migration `/100` |
| Cache GitHub Pages | Script timestamp `?_cb=` en head |
| Couché/Réveil ordre | Couché (bedtimeInput) GAUCHE, Réveil (wakeTimeInput) DROITE |
| Bouton "Recharger" dangereux | Supprimé du header (existait dans une version précédente) |
| `location.reload()` ne marche pas en PWA Samsung | Utiliser `window.location.href = '/Mon-Tableau-de-Vie/?_r=' + Date.now()` |
| Icône PWA pas mise à jour | iOS lit `apple-touch-icon` dans `<head>`, pas le manifest. Renommer le fichier icône à chaque changement. |
| Notes perdues au rechargement SW | `_noteFlushToLocalStorage()` + `pagehide` listener |
| SW bloqué en cache HTTP | `{ updateViaCache: 'none' }` + `reg.update()` |

---

## Fichiers du repo

```
/Users/alexandramallah/Documents/Mon-Tableau-de-Vie/
├── index.html      ← LE SEUL FICHIER QUI COMPTE
├── README.md       ← readme public GitHub
├── CLAUDE.md       ← ce fichier
└── .gitignore
```

**Ne jamais créer d'autres fichiers** sauf demande explicite. Tout le code vit dans `index.html`.

---

## Démarrage rapide pour un nouveau Claude

1. Lire ce fichier en entier
2. `Read /Users/alexandramallah/Documents/Mon-Tableau-de-Vie/index.html` pour voir le code actuel
3. Faire les modifications demandées
4. Pousser :
```bash
cd /Users/alexandramallah/Documents/Mon-Tableau-de-Vie
git add index.html
git commit -m "feat: description"
git push origin main
```
5. Incrémenter le `<title>Mon Tableau de Vie · vXX</title>` à chaque push
6. Attendre ~2 min → https://alexandramllh.github.io/Mon-Tableau-de-Vie/ est à jour
