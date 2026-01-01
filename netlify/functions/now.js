export async function handler(event) {
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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Use POST" }),
    };
  }

  try {
    const { goal, category, time, energy } = JSON.parse(event.body || "{}");

    if (!goal || !category || !time || !energy) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing fields: goal, category, time, energy" }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "OPENAI_API_KEY missing in Netlify env" }),
      };
    }

    const prompt = `
Tu es NOW. 2.0.
Tu dois donner UNE seule action faisable MAINTENANT.
Règles:
- 1 phrase impérative
- pas de liste
- max 18 mots
- adapté au temps dispo et à l’énergie
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
        temperature: 0.6,
        max_output_tokens: 60,
      }),
    });

    const data = await resp.json();

    const text =
      data.output_text ||
      (data.output?.[0]?.content?.[0]?.text) ||
      "";

    if (!resp.ok) {
      return {
        statusCode: 500,
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) };
  }
}

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message: "Function NOW fonctionne 👍"
    })
  };
}
