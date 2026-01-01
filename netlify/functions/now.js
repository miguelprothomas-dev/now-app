export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Use POST" }) };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "OPENAI_API_KEY missing in Netlify env vars" }) };
    }

    const payload = JSON.parse(event.body || "{}");
    const goal = String(payload.goal || "").trim();
    const category = String(payload.category || "").trim();
    const time = Number(payload.time);
    const energy = String(payload.energy || "").trim();
    const recent = Array.isArray(payload.recent) ? payload.recent.slice(-6) : [];

    if (!goal || !category || !time || !energy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing fields (goal, category, time, energy)" }),
      };
    }

    const recentTxt = recent.length ? recent.map(a => `- ${a}`).join("\n") : "Aucun.";

    const prompt = `
Tu es NOW. 2.0 (coach d’exécution).
But: proposer UNE seule action faisable MAINTENANT.

Règles STRICTES:
- 1 seule phrase impérative
- pas de liste, pas d'explication
- max 18 mots
- action concrète, immédiatement faisable
- respecte le temps dispo
- adapte au niveau d'énergie
- ne répète PAS une action déjà faite si possible

Historique récent (à ne pas répéter):
${recentTxt}

Contexte:
Objectif: ${goal}
Catégorie: ${category}
Temps: ${time} minutes
Énergie: ${energy}

Réponds uniquement par l'action.
`.trim();

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.75,
        max_output_tokens: 80,
      }),
    });

    const data = await resp.json();
    const text = data.output_text || (data.output?.[0]?.content?.[0]?.text) || "";

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({ error: "OpenAI error", status: resp.status, details: data }),
      };
    }

    const action = String(text).trim();
    if (!action) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Empty AI response" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ action }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error", details: String(err) }) };
  }
}
