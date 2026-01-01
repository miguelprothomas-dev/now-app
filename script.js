/* ======================
   NOW 2.0 — SCRIPT COMPLET (compatible avec TON index.html)
   - Flow: Goal -> Category -> Context -> Action -> Done
   - IA via Netlify Function: /.netlify/functions/now (POST)
   - Fallback si IA KO
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

/* ======================
   ELEMENTS (IDs from your HTML)
====================== */
const screenGoal = $("screen-goal");
const screenCategory = $("screen-category");
const screenContext = $("screen-context");
const screenAction = $("screen-action");
const screenDone = $("screen-done");

const goalInput = $("goalInput");
const btnContinue = $("btnContinue");
const goalError = $("goalError");

const btnCatNext = $("btnCatNext");
const btnCatBack = $("btnCatBack");

const btnNext = $("btnNext");
const contextError = $("contextError");
const btnBackToCategory = $("btnBackToCategory");

const actionMeta = $("actionMeta");
const actionText = $("actionText");
const btnDone = $("btnDone");
const btnNewAction = $("btnNewAction");
const btnReset = $("btnReset");

const doneText = $("doneText");
const historyList = $("historyList");
const btnNextNow = $("btnNextNow");
const btnReset2 = $("btnReset2");

/* ======================
   STATE
====================== */
const STATE_KEYS = {
  goal: "now_goal",
  category: "now_category",
  time: "now_time",
  energy: "now_energy",
  currentAction: "now_current_action",
  history: "now_history"
};

let state = {
  goal: load(STATE_KEYS.goal, ""),
  category: load(STATE_KEYS.category, ""),
  time: load(STATE_KEYS.time, null),     // number
  energy: load(STATE_KEYS.energy, ""),   // "fatigue" | "normal" | "motive"
  currentAction: load(STATE_KEYS.currentAction, ""),
  history: load(STATE_KEYS.history, [])
};

/* ======================
   UI HELPERS
====================== */
function showScreen(screenEl) {
  [screenGoal, screenCategory, screenContext, screenAction, screenDone].forEach(s => {
    s.classList.add("hidden");
  });
  screenEl.classList.remove("hidden");
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
  if (items.length === 0) return;

  for (const item of items.slice().reverse()) {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  }
}

function persistState() {
  save(STATE_KEYS.goal, state.goal);
  save(STATE_KEYS.category, state.category);
  save(STATE_KEYS.time, state.time);
  save(STATE_KEYS.energy, state.energy);
  save(STATE_KEYS.currentAction, state.currentAction);
  save(STATE_KEYS.history, state.history);
}

/* ======================
   IA CALL
====================== */
async function getAIAction({ goal, category, time, energy }) {
  const res = await fetch("/.netlify/functions/now", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, category, time, energy })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Exemple: { error: "OPENAI_API_KEY missing..." }
    throw new Error(data?.error || "AI request failed");
  }

  const action = (data.action || "").trim();
  if (!action) throw new Error("Empty AI response");
  return action;
}

function fallbackAction({ goal, time }) {
  // Fallback minimaliste
  const mins = Number(time) || 10;
  return `Avance sur "${goal}" pendant ${mins} minutes, sans distraction.`;
}

/* ======================
   GENERATE + DISPLAY ACTION
====================== */
async function generateAndShowAction({ allowNew = false } = {}) {
  // Meta
  const catLabel = {
    health: "Santé & Sport",
    study: "Études & Apprentissage",
    work: "Travail & Business",
    home: "Maison & Organisation",
    creative: "Créatif & Contenu",
    social: "Social & Relations"
  }[state.category] || state.category;

  actionMeta.textContent = `${catLabel} • ${state.time} min • ${state.energy}`;

  // UI loading
  actionText.textContent = "Je réfléchis…";
  showScreen(screenAction);

  // Optional: avoid exact repeats if user asks "new action"
  const last = state.currentAction;

  try {
    let action = await getAIAction({
      goal: state.goal,
      category: state.category,
      time: state.time,
      energy: state.energy
    });

    if (allowNew && last && action.toLowerCase() === last.toLowerCase()) {
      // petite tentative supplémentaire
      action = await getAIAction({
        goal: state.goal,
        category: state.category,
        time: state.time,
        energy: state.energy
      });
    }

    state.currentAction = action;
    persistState();
    actionText.textContent = action;
  } catch (err) {
    const fb = fallbackAction({ goal: state.goal, time: state.time });
    state.currentAction = fb;
    persistState();
    actionText.textContent = fb;
  }
}

/* ======================
   RESET
====================== */
function resetAll() {
  state = {
    goal: "",
    category: "",
    time: null,
    energy: "",
    currentAction: "",
    history: []
  };
  persistState();

  // reset UI selections
  goalInput.value = "";
  setGoalError(false);
  setContextError(false);

  // disable next buttons
  btnCatNext.disabled = true;
  btnNext.disabled = true;

  showScreen(screenGoal);
}

/* ======================
   EVENT BINDINGS
====================== */

// Screen 1: Goal
btnContinue.addEventListener("click", () => {
  const g = (goalInput.value || "").trim();
  if (!g) {
    setGoalError(true);
    return;
  }
  setGoalError(false);

  state.goal = g;
  persistState();

  // move to category
  updateCatNext();
  showScreen(screenCategory);
});

// Screen 2: Category
const catButtons = Array.from(document.querySelectorAll("[data-cat]"));
catButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.category = btn.dataset.cat;
    persistState();
    setSelected(catButtons, btn);
    updateCatNext();
  });
});

btnCatNext.addEventListener("click", () => {
  if (!state.category) return;
  showScreen(screenContext);
});

btnCatBack.addEventListener("click", () => {
  showScreen(screenGoal);
});

// Screen 3: Context (time + energy)
const timeButtons = Array.from(document.querySelectorAll("[data-time]"));
timeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.time = Number(btn.dataset.time);
    persistState();
    setSelected(timeButtons, btn);
    setContextError(false);
    updateContextNext();
  });
});

const energyButtons = Array.from(document.querySelectorAll("[data-energy]"));
energyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    state.energy = btn.dataset.energy; // "fatigue" | "normal" | "motive"
    persistState();
    setSelected(energyButtons, btn);
    setContextError(false);
    updateContextNext();
  });
});

btnNext.addEventListener("click", async () => {
  if (!(state.time && state.energy)) {
    setContextError(true);
    return;
  }
  setContextError(false);
  await generateAndShowAction();
});

btnBackToCategory.addEventListener("click", () => {
  showScreen(screenCategory);
});

// Screen 4: Action
btnDone.addEventListener("click", () => {
  const action = (state.currentAction || "").trim();
  if (action) {
    state.history = Array.isArray(state.history) ? state.history : [];
    state.history.push(action);
    persistState();
  }

  doneText.textContent = "Action terminée. Continue comme ça.";
  renderHistory();
  showScreen(screenDone);
});

btnNewAction.addEventListener("click", async () => {
  await generateAndShowAction({ allowNew: true });
});

btnReset.addEventListener("click", resetAll);

// Screen 5: Done
btnNextNow.addEventListener("click", async () => {
  // Action suivante = nouvelle action IA avec mêmes paramètres
  await generateAndShowAction({ allowNew: true });
});

btnReset2.addEventListener("click", resetAll);

/* ======================
   INIT (restore session)
====================== */
function init() {
  // restore inputs
  goalInput.value = state.goal || "";

  // restore selections visually
  if (state.category) {
    const selectedCat = catButtons.find(b => b.dataset.cat === state.category);
    setSelected(catButtons, selectedCat);
  }
  if (state.time) {
    const selectedTime = timeButtons.find(b => Number(b.dataset.time) === Number(state.time));
    setSelected(timeButtons, selectedTime);
  }
  if (state.energy) {
    const selectedEnergy = energyButtons.find(b => b.dataset.energy === state.energy);
    setSelected(energyButtons, selectedEnergy);
  }

  updateCatNext();
  updateContextNext();
  renderHistory();

  // Decide which screen to show
  if (!state.goal) return showScreen(screenGoal);
  if (!state.category) return showScreen(screenCategory);
  if (!(state.time && state.energy)) return showScreen(screenContext);

  // If we already have a current action, show action screen
  if (state.currentAction) {
    // update meta and show action
    const catLabel = {
      health: "Santé & Sport",
      study: "Études & Apprentissage",
      work: "Travail & Business",
      home: "Maison & Organisation",
      creative: "Créatif & Contenu",
      social: "Social & Relations"
    }[state.category] || state.category;

    actionMeta.textContent = `${catLabel} • ${state.time} min • ${state.energy}`;
    actionText.textContent = state.currentAction;
    return showScreen(screenAction);
  }

  // otherwise go to context
  showScreen(screenContext);
}

init();
