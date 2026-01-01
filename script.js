/* ======================
   NOW 2.0 — SCRIPT COMPLET (compatible avec TON index.html)
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
const screenGoal = $("screen-goal");
const screenCategory = $("screen-category");
const screenContext = $("screen-context");
const screenAction = $("screen-action");
const screenDone = $("screen-done");

/* ====== Screen 1 ====== */
const goalInput = $("goalInput");
const btnContinue = $("btnContinue");
const goalError = $("goalError");

/* ====== Screen 2 ====== */
const btnCatNext = $("btnCatNext");
const btnCatBack = $("btnCatBack");

/* ====== Screen 3 ====== */
const btnNext = $("btnNext");
const contextError = $("contextError");
const btnBackToCategory = $("btnBackToCategory");

/* ====== Screen 4 ====== */
const actionMeta = $("actionMeta");
const actionText = $("actionText");
const btnDone = $("btnDone");
const btnNewAction = $("btnNewAction");
const btnReset = $("btnReset");

/* ====== Screen 5 ====== */
const doneText = $("doneText");
const historyList = $("historyList");
const btnNextNow = $("btnNextNow");
const btnReset2 = $("btnReset2");

/* ====== Storage keys ====== */
const K = {
  goal: "now_goal",
  category: "now_category",
  time: "now_time",
  energy: "now_energy",
  currentAction: "now_current_action",
  history: "now_history",
};

let state = {
  goal: load(K.goal, ""),
  category: load(K.category, ""),
  time: load(K.time, null),      // number
  energy: load(K.energy, ""),    // "fatigue" | "normal" | "motive"
  currentAction: load(K.currentAction, ""),
  history: load(K.history, []),
};

function persist() {
  save(K.goal, state.goal);
  save(K.category, state.category);
  save(K.time, state.time);
  save(K.energy, state.energy);
  save(K.currentAction, state.currentAction);
  save(K.history, state.history);
}

/* ====== UI helpers ====== */
function showScreen(s) {
  [screenGoal, screenCategory, screenContext, screenAction, screenDone].forEach(x => x.classList.add("hidden"));
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

function fallbackAction() {
  return `Avance sur "${state.goal}" pendant ${state.time} minutes, sans distraction.`;
}

/* ====== IA call ====== */
async function getAIAction() {
  const res = await fetch("/.netlify/functions/now", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goal: state.goal,
      category: state.category,
      time: state.time,
      energy: state.energy,
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // on remonte une erreur lisible (si quota/clé manquante, etc.)
    const msg = data?.error || data?.details?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const action = String(data.action || "").trim();
  if (!action) throw new Error("Empty AI action");
  return action;
}

/* ====== Generate action ====== */
async function generateAndShowAction({ forceDifferent = false } = {}) {
  actionMeta.textContent = `${CAT_LABEL[state.category] || state.category} • ${state.time} min • ${state.energy}`;
  actionText.textContent = "Je réfléchis…";

  // désactive boutons pendant le chargement
  btnNewAction.disabled = true;
  btnDone.disabled = true;

  showScreen(screenAction);

  const last = state.currentAction;

  try {
    let action = await getAIAction();

    // si l’utilisateur veut une autre action, on évite le doublon exact
    if (forceDifferent && last && action.toLowerCase() === last.toLowerCase()) {
      action = await getAIAction();
    }

    state.currentAction = action;
    persist();

    actionText.textContent = action;
  } catch (e) {
    // fallback
    const fb = fallbackAction();
    state.currentAction = fb;
    persist();
    actionText.textContent = fb;

    // affiche l'erreur en petit dans meta (utile pour debug)
    actionMeta.textContent = `${CAT_LABEL[state.category] || state.category} • ${state.time} min • ${state.energy}  |  IA: ${String(e.message)}`;
  } finally {
    btnNewAction.disabled = false;
    btnDone.disabled = false;
  }
}

/* ====== Buttons bindings ====== */

// Screen 1
btnContinue.addEventListener("click", () => {
  const g = (goalInput.value || "").trim();
  if (!g) return setGoalError(true);

  setGoalError(false);
  state.goal = g;
  persist();

  updateCatNext();
  showScreen(screenCategory);
});

// Screen 2
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
  showScreen(screenContext);
});

btnCatBack.addEventListener("click", () => showScreen(screenGoal));

// Screen 3
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

btnBackToCategory.addEventListener("click", () => showScreen(screenCategory));

// Screen 4
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
  state = { goal: "", category: "", time: null, energy: "", currentAction: "", history: [] };
  persist();
  goalInput.value = "";
  btnCatNext.disabled = true;
  btnNext.disabled = true;
  showScreen(screenGoal);
}

btnReset.addEventListener("click", resetAll);

// Screen 5
btnNextNow.addEventListener("click", async () => {
  await generateAndShowAction({ forceDifferent: true });
});

btnReset2.addEventListener("click", resetAll);

/* ====== Init restore ====== */
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

  if (!state.goal) return showScreen(screenGoal);
  if (!state.category) return showScreen(screenCategory);
  if (!(state.time && state.energy)) return showScreen(screenContext);

  if (state.currentAction) {
    actionMeta.textContent = `${CAT_LABEL[state.category] || state.category} • ${state.time} min • ${state.energy}`;
    actionText.textContent = state.currentAction;
    return showScreen(screenAction);
  }

  showScreen(screenContext);
}

init();
