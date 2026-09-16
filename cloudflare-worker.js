// Relais CORS pour Mon Tableau de Vie.
// - ?url=<...>    → agenda Google (.ics), inchangé depuis l'origine
// - ?recipe=<...> → page de recette : en extrait les données structurées
//   (Schema.org "Recipe", le format que les sites de recettes intègrent pour
//   Google) et les renvoie en JSON propre à l'app.
// - ?steps=<n>&token=<t> → import automatique des pas (Raccourcis iOS / Tasker-MacroDroid
//   Android) : enregistre <n> pas pour le compte propriétaire de <t>, sans authentification
//   Firebase classique (l'automatisation tourne en tâche de fond, sans session ouverte). Le
//   jeton joue le rôle d'une clé API personnelle — voir firestore.rules pour le détail de la
//   sécurité (le jeton est vérifié côté Firestore lui-même, pas de clé admin ici).

const FIRESTORE_API_KEY = "AIzaSyDPnPO3IQd3puR4qkx0nWFHLHSDAPuAGcM"; // clé Web publique de l'app (déjà visible côté client) — la sécurité vient des règles Firestore, pas du secret de cette clé
const FIRESTORE_PROJECT_ID = "mon-tableau-de-vie";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

async function importSteps(steps, token) {
  if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) return { ok: false, error: "invalid_token" };
  const n = Number(steps);
  if (!Number.isFinite(n) || n < 0 || n > 200000) return { ok: false, error: "invalid_steps" };

  // 1. Retrouve le uid propriétaire de ce jeton (stepTokens/{token} → {uid}).
  const tokResp = await fetch(`${FIRESTORE_BASE}/stepTokens/${encodeURIComponent(token)}?key=${FIRESTORE_API_KEY}`);
  if (!tokResp.ok) return { ok: false, error: "unknown_token" };
  const tokData = await tokResp.json();
  const uid = tokData.fields?.uid?.stringValue;
  if (!uid) return { ok: false, error: "unknown_token" };

  // 2. Écrit le document dédié (jamais le document "state" principal, pour ne jamais entrer en
  // conflit avec sa synchronisation). updatedAt est un instant absolu : c'est l'app, côté
  // client, qui décide si ça correspond à "aujourd'hui" dans SON fuseau horaire local — le
  // Worker ne doit pas essayer de deviner un fuseau.
  const body = {
    fields: {
      steps: { integerValue: String(Math.round(n)) },
      token: { stringValue: token },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
  };
  const writeResp = await fetch(
    `${FIRESTORE_BASE}/users/${encodeURIComponent(uid)}/dashboard/stepsImport?key=${FIRESTORE_API_KEY}`,
    { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!writeResp.ok) return { ok: false, error: "write_failed" };
  return { ok: true, steps: Math.round(n) };
}

function isPrivateHostname(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  // IPv4 privées / de boucle locale / lien-local
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}

function flattenInstructions(ri) {
  if (!ri) return "";
  if (typeof ri === "string") return ri.trim();
  if (Array.isArray(ri)) return ri.map(flattenInstructions).filter(Boolean).join("\n");
  if (typeof ri === "object") {
    if (ri["@type"] === "HowToSection" && ri.itemListElement) {
      return flattenInstructions(ri.itemListElement);
    }
    if (ri.text) return String(ri.text).trim();
    if (ri.name) return String(ri.name).trim();
  }
  return "";
}

function firstOf(v) {
  return Array.isArray(v) ? v[0] : v;
}

function extractImage(img) {
  const v = firstOf(img);
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v.url) return v.url;
  return null;
}

function extractServings(y) {
  const v = firstOf(y);
  if (v == null) return null;
  const m = String(v).match(/\d+/);
  return m ? Number(m[0]) : null;
}

function extractKcal(nutrition) {
  if (!nutrition || !nutrition.calories) return null;
  const m = String(nutrition.calories).match(/[\d.]+/);
  return m ? Math.round(Number(m[0])) : null;
}

// Cherche récursivement un noeud Schema.org de type "Recipe" (gère @graph, tableaux imbriqués).
function findRecipe(node) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const n of node) { const r = findRecipe(n); if (r) return r; }
    return null;
  }
  if (typeof node !== "object") return null;
  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Recipe")) return node;
  if (node["@graph"]) return findRecipe(node["@graph"]);
  return null;
}

async function extractRecipe(targetUrl) {
  const resp = await fetch(targetUrl.toString(), {
    headers: { "user-agent": "Mozilla/5.0 (compatible; MonTableauDeVie/1.0; +recipe-import)" },
  });
  if (!resp.ok) return { ok: false, error: "fetch_failed" };
  let html = await resp.text();
  if (html.length > 3_000_000) html = html.slice(0, 3_000_000); // garde-fou taille

  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let recipe = null;
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1].trim());
      recipe = findRecipe(parsed);
      if (recipe) break;
    } catch (e) { /* bloc JSON invalide, on continue */ }
  }
  if (!recipe) return { ok: false, error: "not_found" };

  return {
    ok: true,
    name: recipe.name || null,
    image: extractImage(recipe.image),
    servings: extractServings(recipe.recipeYield),
    ingredients: Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [],
    instructions: flattenInstructions(recipe.recipeInstructions),
    kcalPerServing: extractKcal(recipe.nutrition),
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = { "access-control-allow-origin": "*" };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...corsHeaders, "access-control-allow-methods": "GET" } });
    }

    const stepsParam = url.searchParams.get("steps");
    if (stepsParam !== null) {
      const data = await importSteps(stepsParam, url.searchParams.get("token"));
      return Response.json(data, { status: data.ok ? 200 : 400, headers: corsHeaders });
    }

    const recipeParam = url.searchParams.get("recipe");
    if (recipeParam) {
      let targetUrl;
      try { targetUrl = new URL(recipeParam); }
      catch (e) { return Response.json({ ok: false, error: "invalid_url" }, { status: 400, headers: corsHeaders }); }
      if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
        return Response.json({ ok: false, error: "invalid_url" }, { status: 400, headers: corsHeaders });
      }
      if (isPrivateHostname(targetUrl.hostname)) {
        return Response.json({ ok: false, error: "domain_not_allowed" }, { status: 403, headers: corsHeaders });
      }
      try {
        const data = await extractRecipe(targetUrl);
        return Response.json(data, { headers: corsHeaders });
      } catch (e) {
        return Response.json({ ok: false, error: "extraction_failed" }, { status: 502, headers: corsHeaders });
      }
    }

    const target = url.searchParams.get("url");
    if (!target) {
      return new Response("Missing url or recipe parameter", { status: 400, headers: corsHeaders });
    }
    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (e) {
      return new Response("Invalid url parameter", { status: 400, headers: corsHeaders });
    }
    // Limite ce relais aux agendas Google — évite qu'il serve de proxy ouvert à n'importe
    // quelle adresse (abus, spam, contournement d'autres protections).
    if (targetUrl.hostname !== "calendar.google.com") {
      return new Response("Domain not allowed", { status: 403, headers: corsHeaders });
    }
    const resp = await fetch(targetUrl.toString());
    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        ...corsHeaders,
      },
    });
  },
};
