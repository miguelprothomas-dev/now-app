/* =========================
   HELPERS
========================= */
const qs = (id) => document.getElementById(id);
const save = (k, v) => localStorage.setItem(k, v);
const load = (k) => localStorage.getItem(k);

/* =========================
   ELEMENTS
========================= */
const goalInput = qs("goalInput");
const btnContinue = qs("btnContinue");
const actionText = qs("actionText");

/* =========================
   STATE
========================= */
let goal = "";
let category = "";
let time = "";
let energy = "";

/* =========================
   API IA
========================= */
async function getAIAction(goal, category, time, energy) {
  const res = await fetch("/.netlify/functions/now", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, category, time, energy })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "IA indisponible");
  return data.action;
}

/* =========================
   FLOW
========================= */

// Étape 1 — Objectif
btnContinue.addEventListener("click", () => {
  goal = goalInput.value.trim();
  if (!goal) return alert("Entre un objectif");

  save("goal", goal);
});

// Étape 2 — Catégorie
document.querySelectorAll("[data-cat]").forEach(btn => {
  btn.addEventListener("click", () => {
    category = btn.dataset.cat;
    save("category", category);
  });
});

// Étape 3 — Temps
document.querySelectorAll("[data-time]").forEach(btn => {
  btn.addEventListener("click", () => {
    time = btn.dataset.time;
    save("time", time);
  });
});

// Étape 4 — Énergie
document.querySelectorAll("[data-energy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    energy = btn.dataset.energy;
    save("energy", energy);

    await generateAction();
  });
});

/* =========================
   GENERATION ACTION
========================= */
async function generateAction() {
  const g = load("goal");
  const c = load("category");
  const t = load("time");
  const e = load("energy");

  actionText.textContent = "Je réfléchis…";

  try {
    const action = await getAIAction(g, c, t, e);
    actionText.textContent = action;
  } catch (err) {
    actionText.textContent = `Avance sur "${g}" pendant ${t} minutes, sans distraction.`;
  }
}
