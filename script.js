// =====================
// NOW. — JS pur + localStorage
// Flow: Objectif -> Catégorie -> Temps/Energie -> Action -> Done/Historique
// =====================

// Helpers UI
function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }
function qs(id){ return document.getElementById(id); }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

// Storage
function save(key, value){ localStorage.setItem(key, value); }
function load(key){ return localStorage.getItem(key); }
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function loadJSON(key, fallback){
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

// Elements
const screenGoal = qs("screen-goal");
const screenCategory = qs("screen-category");
const screenContext = qs("screen-context");
const screenAction = qs("screen-action");
const screenDone = qs("screen-done");

const goalInput = qs("goalInput");
const btnContinue = qs("btnContinue");
const goalError = qs("goalError");

const btnCatNext = qs("btnCatNext");
const btnCatBack = qs("btnCatBack");

const btnNext = qs("btnNext");
const contextError = qs("contextError");
const btnBackToCategory = qs("btnBackToCategory");

const actionMeta = qs("actionMeta");
const actionText = qs("actionText");
const btnDone = qs("btnDone");
const btnNewAction = qs("btnNewAction");
const btnReset = qs("btnReset");

const doneText = qs("doneText");
const historyList = qs("historyList");
const btnNextNow = qs("btnNextNow");
const btnReset2 = qs("btnReset2");

// State
let selectedCategory = null;  // health | study | work | home | creative | social
let selectedTime = null;      // 10 | 20 | 45
let selectedEnergy = null;    // fatigue | normal | motive

// Labels
const catLabel = {
  health: "Santé & Sport",
  study: "Études & Apprentissage",
  work: "Travail & Business",
  home: "Maison & Organisation",
  creative: "Créatif & Contenu",
  social: "Social & Relations"
};
const energyLabel = { fatigue: "Fatigué", normal: "Normal", motive: "Motivé" };

// Navigation
function goToGoal(){ show(screenGoal); hide(screenCategory); hide(screenContext); hide(screenAction); hide(screenDone); }
function goToCategory(){ hide(screenGoal); show(screenCategory); hide(screenContext); hide(screenAction); hide(screenDone); }
function goToContext(){ hide(screenGoal); hide(screenCategory); show(screenContext); hide(screenAction); hide(screenDone); }
function goToAction(){ hide(screenGoal); hide(screenCategory); hide(screenContext); show(screenAction); hide(screenDone); }
function goToDone(){ hide(screenGoal); hide(screenCategory); hide(screenContext); hide(screenAction); show(screenDone); }

// UI selection helpers
function selectButtons(selector, selectedBtn) {
  document.querySelectorAll(selector).forEach(b => b.classList.remove("selected"));
  selectedBtn.classList.add("selected");
}
function updateContextButton(){
  btnNext.disabled = !(selectedTime !== null && selectedEnergy !== null);
}
function updateCategoryButton(){
  btnCatNext.disabled = !selectedCategory;
}

// ---------- Action Library (par catégorie, temps, énergie) ----------
function actionLibrary(cat, goal){
  const g = goal.trim();

  const health = {
    fatigue: {
      10: [
        "2 min marche sur place → 2×10 squats lents → étirements 2 min.",
        "2 min mobilité (hanches/épaules) → 3×20 sec gainage → 2 min respiration.",
        "5 min marche + 20 fentes (10/10) + 1 min étirements."
      ],
      20: [
        "Circuit léger (2 tours) : 10 pompes (sur genoux ok), 15 squats, 20 mountain climbers, 30 sec gainage.",
        "Cardio soft : 12 min marche rapide + 4 min étirements + 4 min gainage léger.",
        "Renfo léger : 3×(12 squats, 10 pompes, 12 rowing avec sac, 30 sec gainage)."
      ],
      45: [
        "10 min échauffement + 25 min circuit facile (full body) + 10 min étirements.",
        "45 min marche rapide (dehors ou tapis) + 5 min étirements.",
        "15 min mobilité + 20 min renfo léger + 10 min étirements."
      ]
    },
    normal: {
      10: [
        "3×(10 pompes, 15 squats, 30 sec gainage).",
        "10 min cardio : 30 sec rapide / 30 sec lent ×10.",
        "Tabata 8 min (20/10) + 2 min récup."
      ],
      20: [
        "4 tours : 10 pompes, 15 squats, 12 fentes/jambe, 30 sec gainage.",
        "HIIT : 40 sec effort / 20 sec repos ×15.",
        "Core : 3 tours (dead bug 12, gainage 45s, crunch 15, side plank 30s/side)."
      ],
      45: [
        "10 échauffement + 25 renfo full body + 10 étirements.",
        "5 chauffe + 30 footing + 5 accélérations + 5 retour au calme.",
        "Séance maison : haut/bas alterné + finisher abdos 5 min."
      ]
    },
    motive: {
      10: [
        "AMRAP 10 min : 8 pompes + 12 squats + 10 mountain/side.",
        "10 min : 5 min cardio intense + 5 min renfo (pompes/squats/gainage).",
        "30 sec effort / 30 sec repos ×10."
      ],
      20: [
        "EMOM 20 : 12 squats / 10 pompes / 30s gainage / 12 fentes (×5).",
        "5 min chauffe + 12 min HIIT + 3 min gainage.",
        "4 tours : 12 pompes, 20 squats, 12 rowing sac, 45 sec gainage."
      ],
      45: [
        "10 chauffe + 30 séance (haut/bas) + 5 finisher abdos.",
        "5 chauffe + 35 run/HIIT + 5 étirements.",
        "Séance muscu : programme complet + note tes reps/charges."
      ]
    }
  };

  const study = {
    fatigue: {
      10: [
        `Ouvre le cours sur "${g}" et fais un mini résumé (5 lignes).`,
        `Relis 1 page sur "${g}" et surligne 5 points clés.`,
        `Crée 5 flashcards simples sur "${g}".`
      ],
      20: [
        `Pomodoro court : 15 min focus "${g}" + 5 min pause.`,
        `Fais 10 questions/réponses sur "${g}".`,
        `Fais une fiche 1 page sur "${g}".`
      ],
      45: [
        `25 min "${g}" + 5 pause + 15 min exercices.`,
        `Fiche complète + 10 min test sans regarder.`,
        `Cours → exercices → correction rapide (45 min).`
      ]
    },
    normal: {
      10: [
        `Mini quiz 10 questions sur "${g}".`,
        `Lis 2 pages et écris 3 choses à retenir sur "${g}".`,
        `Fais 1 exercice rapide sur "${g}".`
      ],
      20: [
        `10 min cours + 10 min exos sur "${g}".`,
        `Fiche synthèse (plan + définitions) sur "${g}".`,
        `Révise 20 flashcards sur "${g}".`
      ],
      45: [
        `Cours 20 + exos 20 + check 5 sur "${g}".`,
        `5 exercices sur "${g}" puis corrige.`,
        `Sujet type (chrono) sur "${g}".`
      ]
    },
    motive: {
      10: [
        `1 exercice difficile sur "${g}" (chrono 10).`,
        `15 flashcards + test immédiat sur "${g}".`,
        `Écris 10 questions pièges sur "${g}" et réponds.`
      ],
      20: [
        `Sprint exos : 20 min non-stop sur "${g}".`,
        `Apprends 1 notion puis explique-la à voix haute.`,
        `Quiz chrono sur "${g}" + note le score.`
      ],
      45: [
        `Deep work : exos difficiles sur "${g}" + correction.`,
        `Sujet complet sur "${g}" en conditions réelles.`,
        `Cours → exos → auto-test (45 min).`
      ]
    }
  };

  const work = {
    fatigue: {
      10: [
        `Note la prochaine étape de "${g}" (1 phrase) + prépare les outils.`,
        `Écris 3 idées concrètes pour "${g}".`,
        `Envoie 1 message important lié à "${g}" (court).`
      ],
      20: [
        `Améliore 1 chose visible (titre/pitch/offre) pour "${g}".`,
        `Liste 10 prospects / contacts liés à "${g}".`,
        `Fais une checklist (5 points) pour "${g}".`
      ],
      45: [
        `Crée 1 livrable (page/devis/offre) pour "${g}".`,
        `Prospection : 20 min recherche + 20 min messages + 5 min suivi.`,
        `Plan clair (étapes + dates) pour "${g}".`
      ]
    },
    normal: {
      10: [
        `Pitch 2 phrases pour "${g}".`,
        `Améliore ton profil/annonce 10 min pour "${g}".`,
        `Fais 1 micro-tâche “visible client” pour "${g}".`
      ],
      20: [
        `Écris un post/texte de vente simple pour "${g}".`,
        `Prépare un mini devis en 20 min pour "${g}".`,
        `Analyse 3 concurrents : 3 points forts/3 faiblesses.`
      ],
      45: [
        `Construis une page “offre” complète pour "${g}".`,
        `Pipeline : 10 prospects + 10 messages + suivi.`,
        `Améliore un process (template/checklist/script).`
      ]
    },
    motive: {
      10: [
        `Action argent : contacte 2 prospects maintenant.`,
        `Écris 1 script d’appel/DM pour "${g}".`,
        `Écris une offre claire + prix pour "${g}".`
      ],
      20: [
        `5 prospects ciblés + 5 messages qualitatifs.`,
        `Crée un mini portfolio (1 exemple) pour "${g}".`,
        `Landing simple : problème → solution → CTA.`
      ],
      45: [
        `Deep work : produit un livrable vendable sur "${g}".`,
        `Prospection intense : 15 recherches + 25 messages + follow-up.`,
        `Optimise ton offre : USP + preuves + prix + CTA.`
      ]
    }
  };

  const home = {
    fatigue: {
      10: ["Ramasse tout ce qui traîne dans 1 zone.", "Vaisselle express + essuie plan de travail.", "Sors la poubelle + range 10 objets."],
      20: ["Cuisine (surfaces + vaisselle + sol rapide).", "Salle de bain (lavabo + WC + miroir).", "Linge : lance machine + plie 10 vêtements."],
      45: ["Salon complet (ranger + poussière + sol).", "Chambre (linge + rangement + sol).", "Reset maison : 15/15/15 par zones."]
    },
    normal: {
      10: ["Ranger 1 tiroir/étagère.", "Aspirateur zone principale.", "Surfaces + poubelle."],
      20: ["Aspirer + serpillière rapide.", "Tri papiers/administratif.", "Préparer un repas simple (meal prep)."],
      45: ["Ménage complet par zones + check final.", "Tri 1 placard + sac à donner.", "Organisation : planning + to-do utiles."]
    },
    motive: {
      10: ["Speed clean chrono (ramasser + surfaces).", "Tri express 20 objets.", "Organiser une micro-zone."],
      20: ["Cuisine nickel (chrono).", "Salle de bain nickel (chrono).", "Linge + rangement rapide."],
      45: ["Gros nettoyage zone complète + check.", "Tri + organisation + sacs.", "Projet maison : réparer/améliorer un truc."]
    }
  };

  const creative = {
    fatigue: {
      10: ["Ouvre ton outil (Canva/CapCut) et prépare le projet (titre, fichiers, structure).",
           "Écris 5 idées de contenu/titres en 10 min.",
           "Fais une checklist de ton contenu (hook → valeur → CTA)."],
      20: ["Crée 1 brouillon (script 10 lignes) + 1 mini structure.",
           "Monte 1 séquence courte (20 min chrono).",
           "Fais 1 miniature simple + 1 titre + 1 description."],
      45: ["Fais 1 contenu complet (script + montage rapide).",
           "Produis 1 post + 3 variantes de hook.",
           "Crée 3 assets : 1 visuel, 1 story, 1 mini short."]
    },
    normal: {
      10: ["Écris un hook puissant (3 variantes).", "Fais 1 visuel simple.", "Plan de contenu : 3 points clés."],
      20: ["Écris un script complet (court).", "Monte une vidéo courte (20).", "Optimise : titre + description + tags."],
      45: ["Crée un contenu fini + export + plan de publication.",
           "Batch : prépare 3 scripts courts.",
           "Portfolio : ajoute 1 réalisation présentable."]
    },
    motive: {
      10: ["Crée 1 contenu “postable” (version simple) maintenant.", "Hook + tournage rapide 10 min.", "Mini montage + export."],
      20: ["Tourne + monte 1 short complet.", "Écris 2 scripts + 1 visuel.", "Crée 1 carrousel complet."],
      45: ["Deep work : 1 pièce majeure (vidéo/post) finie.",
           "Batch : 5 hooks + 3 scripts + 1 montage.",
           "Refonte branding : 45 min (couleurs, typos, templates)."]
    }
  };

  const social = {
    fatigue: {
      10: ["Réponds à 3 messages importants.", "Envoie un message simple à quelqu’un (prise de nouvelles).", "Planifie 1 rendez-vous (2 messages)."],
      20: ["Appelle 1 personne (10 min) + envoie 1 message de suivi.", "Organise une sortie : propose 2 dates.", "Fais 1 démarche : mail + pièce jointe."],
      45: ["Règle un sujet en attente : appel + mail + suivi.", "Planifie la semaine sociale (famille/amis).", "Admin perso : 45 min (rdv, papiers, appels)."]
    },
    normal: {
      10: ["Envoie 1 message utile (merci, relance, info).", "Réponds aux messages en attente.", "Note 3 personnes à contacter."],
      20: ["Relance 5 personnes (pro/perso).", "Prépare un message long et clair (une fois).", "Planifie 1 RDV + confirmation."],
      45: ["Appels importants + suivi écrit.", "Organisation complète d’un événement simple.", "Traitement des tâches sociales/admin en retard."]
    },
    motive: {
      10: ["Fais 1 appel maintenant.", "Envoie 3 messages ciblés.", "Relance 1 gros sujet en attente."],
      20: ["Appel + suivi + plan d’action.", "Organise une sortie complète (lieu + date + participants).", "Admin : traite 3 démarches."],
      45: ["Deep work social/admin : tout vider (messages, appels, RDV).", "Résoudre un conflit : message clair + proposition.", "Préparer un échange important (script + points)."]
    }
  };

  const map = { health, study, work, home, creative, social };
  return map[cat] || work;
}

// Anti-répétition (garde les 5 dernières actions par catégorie)
function decideAction(cat, time, energy, goal){
  const lib = actionLibrary(cat, goal);
  const bucket = lib?.[energy]?.[time] || [];

  if (bucket.length === 0) return `Avance sur "${goal}" pendant ${time} minutes.`;

  const lastKey = `now_last_actions_${cat}`;
  const last = loadJSON(lastKey, []);
  const filtered = bucket.filter(a => !last.includes(a));
  const chosen = filtered.length ? pick(filtered) : pick(bucket);

  saveJSON(lastKey, [chosen, ...last].slice(0, 5));
  return chosen;
}

// History
function addToHistory(entry){
  const history = loadJSON("now_history", []);
  history.unshift(entry);
  saveJSON("now_history", history.slice(0, 20));
}

function renderHistory(){
  const history = loadJSON("now_history", []);
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Aucune action terminée pour l’instant.";
    historyList.appendChild(li);
    return;
  }

  history.forEach(item => {
    const li = document.createElement("li");
    const date = new Date(item.at).toLocaleString("fr-FR");
    li.innerHTML = `
      ${item.action}
      <small>${catLabel[item.cat]} • ${item.time} min • ${energyLabel[item.energy]} • ${date}</small>
    `;
    historyList.appendChild(li);
  });
}

// Generate
function generateAndShowAction(){
  const goal = load("now_goal") || goalInput.value.trim();
  const cat = load("now_category");
  const time = Number(load("now_time"));
  const energy = load("now_energy");

  const action = decideAction(cat, time, energy, goal);
  actionMeta.textContent = `${catLabel[cat]} • ${time} min • ${energyLabel[energy]}`;
  actionText.textContent = action;
  save("now_current_action", action);

  goToAction();
}

// Reset
function resetAll(){
  Object.keys(localStorage)
    .filter(k => k.startsWith("now_"))
    .forEach(k => localStorage.removeItem(k));

  goalInput.value = "";
  goalError.classList.add("hidden");
  contextError.classList.add("hidden");

  selectedCategory = null;
  selectedTime = null;
  selectedEnergy = null;

  btnCatNext.disabled = true;
  btnNext.disabled = true;

  document.querySelectorAll("[data-cat],[data-time],[data-energy]").forEach(b => b.classList.remove("selected"));

  goToGoal();
}

// Init
(function init(){
  goToGoal();
})();

// ---------------- EVENTS ----------------

// Screen 1: objective
btnContinue.addEventListener("click", () => {
  const goal = goalInput.value.trim();
  if (!goal){
    goalError.classList.remove("hidden");
    return;
  }
  goalError.classList.add("hidden");
  save("now_goal", goal);
  goToCategory();
});
goalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnContinue.click();
});

// Screen 2: category
document.querySelectorAll("[data-cat]").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedCategory = btn.dataset.cat;
    save("now_category", selectedCategory);
    selectButtons("[data-cat]", btn);
    updateCategoryButton();
  });
});
btnCatBack.addEventListener("click", goToGoal);
btnCatNext.addEventListener("click", () => {
  if (!selectedCategory) return;
  goToContext();
});

// Screen 3: context
document.querySelectorAll("[data-time]").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedTime = Number(btn.dataset.time);
    save("now_time", String(selectedTime));
    selectButtons("[data-time]", btn);
    updateContextButton();
  });
});
document.querySelectorAll("[data-energy]").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedEnergy = btn.dataset.energy;
    save("now_energy", selectedEnergy);
    selectButtons("[data-energy]", btn);
    updateContextButton();
  });
});
btnBackToCategory.addEventListener("click", goToCategory);
btnNext.addEventListener("click", () => {
  if (selectedTime === null || selectedEnergy === null){
    contextError.classList.remove("hidden");
    return;
  }
  contextError.classList.add("hidden");
  generateAndShowAction();
});

// Screen 4: action
btnNewAction.addEventListener("click", generateAndShowAction);

btnDone.addEventListener("click", () => {
  const entry = {
    action: load("now_current_action") || actionText.textContent,
    cat: load("now_category"),
    time: Number(load("now_time")),
    energy: load("now_energy"),
    at: new Date().toISOString()
  };

  addToHistory(entry);
  doneText.textContent = "Action terminée. Tu avances.";
  renderHistory();
  goToDone();
});

btnReset.addEventListener("click", resetAll);
btnReset2.addEventListener("click", resetAll);

// Screen 5: next action
btnNextNow.addEventListener("click", generateAndShowAction);
