// POST /api/ai  { prompt } -> { text }   (Gemini; key stays on the server)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string" || prompt.length > 200000) return res.status(400).json({ error: "bad request" });
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"; // check Google AI Studio for the current free model name
  if (!key) return res.status(500).json({ error: "missing GEMINI_API_KEY" });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: "upstream" });
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    res.status(200).json({ text });
  } catch (e) { res.status(500).json({ error: "failed" }); }
}
