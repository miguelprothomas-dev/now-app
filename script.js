/* ======================
   NOW 2.0 — PRO READY
   - Category -> Goal (avec suggestions) -> Context -> Action IA
   - Anti-spam, retry, cache, anti-répétition via historique
====================== */

const $ = (id) => document.getElementById(id);

const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback = null) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};

/* ====== Screens ====== */
const screenCategory = $("screen-category");
const screenGoal = $("screen-goal");
const screenContext = $("screen-context");
const screenAction = $("screen-action");
const screenDone = $("screen-done");

/* ====== Screen 1: Category ====== */
const btnCatNext = $("btnCatNext");

/* ====== Screen 2: Goal ====== */
const goalInput = $("goalInput");
const goalSuggestions = $("goalSuggestions");
const btnContinue = $("btnContinue");
const goalError = $("goalError");
const btnGoalBack = $("btnGoalBack");

/* ====== Screen 3: Context ====== */
const btnNext = $("btnNext");
const contextError = $("contextError");
const btnBackToGoal = $("btnBackToGoal");

/* ====== Screen 4: Action ====== */
const actionMeta = $("actionMeta");
const actionText = $("actionText");
const btnDone = $("btnDone");
const btnNewAction = $("btnNewAction");
const btnReset = $("btnReset");

/* ====== Screen 5: Done ====== */
const doneText = $("doneText");
const historyList = $("historyList");
const btnNextNow = $("btnNextNow");
const btnReset2 = $("btnReset2");

/* ====== Storage keys ====== */
const K = {
  category: "now_category",
  goal: "now_goal",
  time: "now_time",
  energy: "now_energy",
  currentAction: "now_current_action",
  history: "now_history",
  cache: "now_cache" // petit cache d’actions (évite trop d’appels)
};

let state = {
  category: load(K.category, ""),
  goal: load(K.goal, ""),
  time: load(K.time, null),
  energy: load(K.energy, ""),
  currentAction: load(K.currentAction, ""),
  history: load(K.history, []),
  cache: load(K.cache, {}) // clé = JSON.stringify(context) ; valeur = [actions]
};

function persist() {
  save(K.category, state.category);
  save(K.goal, state.goal);
  save(K.time, state.time);
  save(K.energy, state.energy);
  save(K.currentAction, state.currentAction);
  save(K.history, state.history);
  save(K.cache, state.cache);
}

/* ====== UI helpers ====== */
function showScreen(s) {
  [screenCategory, screenGoal, screenContext, screenAction, screenDone].forEach(x => x.classList.add("hidden"));
  s.classList.remove("hidden");
}

function setGoalError(show) {
  goalError.classList.toggle("hidden", !show);
}

function setContextError(show) {
  contextError.classList.toggle("hidden", !show);
}

function setSelected(buttons, selectedBtn) {
  buttons.forEach(b => b.classList.remove("selected"));
  if (selectedBtn) selectedBtn.classList.add("selected");
}

function updateCatNext() {
  btnCatNext.disabled = !state.category;
}

function updateContextNext() {
  btnNext.disabled = !(state.time && state.energy);
}

function renderHistory() {
  historyList.innerHTML = "";
  const items = Array.isArray(state.history) ? state.history : [];
  items.slice().reverse().forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    historyList.appendChild(li);
  });
}

const CAT_LABEL = {
  health: "Santé & Sport",
  study: "Études & Apprentissage",
  work: "Travail & Business",
  home: "Maison & Organisation",
  creative: "Créatif & Contenu",
  social: "Social & Relations",
};

const GOAL_SUGGESTIONS = {
  health: ["Reprendre le sport", "Perdre un peu de poids", "Être plus en forme", "Mieux dormir"],
  study: ["Réviser", "Apprendre l’anglais", "Comprendre un cours", "Mémoriser un chapitre"],
  work: ["Trouver des clients", "Avancer sur un dossier", "Faire un devis", "Planifier la semaine"],
  home: ["Ranger", "Faire le ménage", "Organiser mes papiers", "Préparer la journée"],
  creative: ["Créer un post", "Monter une vidéo", "Trouver des idées", "Écrire un script"],
  social: ["Répondre à quelqu’un", "Prendre des nouvelles", "Planifier une sortie", "Envoyer un message important"],
};

function refreshGoalSuggestions() {
  goalSuggestions.innerHTML = "";
  const list = GOAL_SUGGESTIONS[state.category] || [];
  list.forEach(txt => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = txt;
    b.addEventListener("click", () => {
      goalInput.value = txt;
      goalInput.focus();
      setGoalError(false);
    });
    goalSuggestions.appendChild(b);
  });
}

function fallbackAction() {
  return `Avance sur "${state.goal}" pendant ${state.time} minutes, sans distraction.`;
}

/* ====== IA call (anti-spam + retry + history) ====== */
async function fetchAIAction() {
  // anti double-clic: une requête à la fois
  if (fetchAIAction._inFlight) return fetchAIAction._inFlight;

  fetchAIAction._inFlight = (async () => {
    const body = {
      goal: state.goal,
      category: state.category,
      time: state.time,
      energy: state.energy,
      recent: (Array.isArray(state.history) ? state.history : []).slice(-6) // anti répétition
    };

    // 1) appel normal
    let res = await fetch("/.netlify/functions/now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // 2) retry si rate limit / temporaire
    if (res.status === 429 || res.status === 503) {
      await new Promise(r => setTimeout(r, 900));
      res = await fetch("/.netlify/functions/now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        data?.details?.error?.message ||
        data?.error ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const action = String(data.action || "").trim();
    if (!action) throw new Error("Empty AI action");
    return action;
  })();

  try {
    return await fetchAIAction._inFlight;
  } finally {
    fetchAIAction._inFlight = null;
  }
}

/* ====== Cache (évite trop d’appels) ====== */
function cacheKey() {
  return JSON.stringify({
    goal: state.goal.toLowerCase(),
    category: state.category,
    time: state.time,
    energy: state.energy
  });
}

function pullFromCache() {
  const key = cacheKey();
  const arr = state.cache[key];
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.shift();
  }
  return null;
}

function pushToCache(action) {
  const key = cacheKey();
  if (!Array.isArray(state.cache[key])) state.cache[key] = [];
  // on garde 3 max
  if (state.cache[key].length < 3) state.cache[key].push(action);
}

/* ====== Generate action ====== */
async function generateAndShowAction({ forceDifferent = false } = {}) {
  actionMeta.textContent = `${CAT_LABEL[state.category] || state.category} • ${state.time} min • ${state.energy}`;
  actionText.textContent = "Je réfléchis…";

  btnNewAction.disabled = true;
  btnDone.disabled = true;

  showScreen(screenAction);

  const last = state.currentAction;

  // 1) cache first
  let cached = pullFromCache();
  if (cached) {
    if (!forceDifferent || !last || cached.toLowerCase() !== last.toLowerCase()) {
      state.currentAction = cached;
      persist();
      actionText.textContent = cached;
      btnNewAction.disabled = false;
      btnDone.disabled = false;
      return;
    }
  }

  try {
    let action = await fetchAIAction();

    // évite doublon exact
    if (forceDifferent && last && action.toLowerCase() === last.toLowerCase()) {
      action = await fetchAIAction();
    }

    // alimente cache (petite réserve)
    pushToCache(action);

    state.currentAction = action;
    persist();
    actionText.textContent = action;
  } catch (e) {
    const fb = fallbackAction();
    state.currentAction = fb;
    persist();
    actionText.textContent = fb;

    // debug discret: utile si quota / paiement
    actionMeta.textContent = `${CAT_LABEL[state.category] || state.category} • ${state.time} min • ${state.energy}  |  IA: ${String(e.message)}`;
  } finally {
    btnNewAction.disabled = false;
    btnDone.disabled = false;
  }
}

/* ====== Bindings ====== */

// Screen 1: Category
const catButtons = Array.from(document.querySelectorAll("[data-cat]"));
catButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.category = btn.dataset.cat;
    persist();
    setSelected(catButtons, btn);
    updateCatNext();
  });
});

btnCatNext.addEventListener("click", () => {
  if (!state.category) return;
  refreshGoalSuggestions();
  showScreen(screenGoal);
});

// Screen 2: Goal
btnContinue.addEventListener("click", () => {
  const g = (goalInput.value || "").trim();
  if (!g) return setGoalError(true);

  setGoalError(false);
  state.goal = g;
  persist();

  showScreen(screenContext);
});

btnGoalBack.addEventListener("click", () => showScreen(screenCategory));

// Screen 3: Context
const timeButtons = Array.from(document.querySelectorAll("[data-time]"));
timeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.time = Number(btn.dataset.time);
    persist();
    setSelected(timeButtons, btn);
    setContextError(false);
    updateContextNext();
  });
});

const energyButtons = Array.from(document.querySelectorAll("[data-energy]"));
energyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.energy = btn.dataset.energy; // fatigue | normal | motive
    persist();
    setSelected(energyButtons, btn);
    setContextError(false);
    updateContextNext();
  });
});

btnNext.addEventListener("click", async () => {
  if (!(state.time && state.energy)) return setContextError(true);
  setContextError(false);
  await generateAndShowAction();
});

btnBackToGoal.addEventListener("click", () => {
  refreshGoalSuggestions();
  showScreen(screenGoal);
});

// Screen 4: Action
btnDone.addEventListener("click", () => {
  const a = String(state.currentAction || "").trim();
  if (a) {
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.push(a);
    persist();
  }

  doneText.textContent = "Action terminée. Bien joué.";
  renderHistory();
  showScreen(screenDone);
});

btnNewAction.addEventListener("click", async () => {
  await generateAndShowAction({ forceDifferent: true });
});

function resetAll() {
  state = { category: "", goal: "", time: null, energy: "", currentAction: "", history: [], cache: {} };
  persist();
  goalInput.value = "";
  btnCatNext.disabled = true;
  btnNext.disabled = true;
  showScreen(screenCategory);
}

btnReset.addEventListener("click", resetAll);

// Screen 5: Done
btnNextNow.addEventListener("click", async () => {
  await generateAndShowAction({ forceDifferent: true });
});

btnReset2.addEventListener("click", resetAll);

/* ====== Init ====== */
function init() {
  goalInput.value = state.goal || "";

  if (state.category) {
    const sel = catButtons.find(b => b.dataset.cat === state.category);
    setSelected(catButtons, sel);
  }
  if (state.time) {
    const sel = timeButtons.find(b => Number(b.dataset.time) === Number(state.time));
    setSelected(timeButtons, sel);
  }
  if (state.energy) {
    const sel = energyButtons.find(b => b.dataset.energy === state.energy);
    setSelected(energyButtons, sel);
  }

  updateCatNext();
  updateContextNext();
  renderHistory();

  if (!state.category) return showScreen(screenCategory);
  if (!state.goal) {
    refreshGoalSuggestions();
    return showScreen(screenGoal);
  }
  if (!(state.time && state.energy)) return showScreen(screenContext);

  if (state.currentAction) {
    actionMeta.textContent = `${CAT_LABEL[state.category] || state.category} • ${state.time} min • ${state.energy}`;
    actionText.textContent = state.currentAction;
    return showScreen(screenAction);
  }

  showScreen(screenContext);
}

init();
