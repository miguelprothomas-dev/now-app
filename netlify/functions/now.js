export async function handler(event) {
    // 🔎 TEST TEMPORAIRE SANS CONSOLE
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: "Function IA accessible ✅"
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message: "Function NOW fonctionne 👍"
    })
  };
}
