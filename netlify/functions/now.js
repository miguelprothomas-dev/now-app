export async function handler(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // On veut uniquement POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Use POST on /.netlify/functions/now" }),
    };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "OPENAI_API_KEY missing in Netlify env vars" }),
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const goal = String(payload.goal || "").trim();
    const category = String(payload.category || "").trim();
    const time = Number(payload.time);
    const energy = String(payload.energy || "").trim();

    if (!goal || !category || !time || !energy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing fields (goal, category, time, energy)",
          received: { goal, category, time, energy },
        }),
      };
    }

    // Prompt ULTRA cadré (NOW.)
    const prompt = `
Tu es NOW. 2.0.
Objectif: donner UNE seule action faisable MAINTENANT.

Contraintes:
- Une seule phrase impérative
- Pas de liste, pas d'explication
- Max 18 mots
- Adaptée au temps dispo et à l'énergie
- Très concrète (une action réelle)

Contexte:
- Objectif utilisateur: ${goal}
- Catégorie: ${category}
- Temps dispo: ${time} minutes
- Énergie: ${energy}

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
        temperature: 0.7,
        max_output_tokens: 80,
      }),
    });

    const data = await resp.json();

    // Récupère le texte
    const text =
      data.output_text ||
      (data.output?.[0]?.content?.[0]?.text) ||
      "";

    if (!resp.ok) {
      // renvoie l'erreur OpenAI telle quelle (utile si quota/clé)
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({
          error: "OpenAI error",
          status: resp.status,
          details: data,
        }),
      };
    }

    const action = String(text).trim();
    if (!action) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Empty AI response", details: data }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ action }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details: String(err) }),
    };
  }
}
