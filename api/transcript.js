// GET /api/transcript?url=<youtube link> -> { transcript, lang }   (YouTube captions only)
export default async function handler(req, res) {
  try {
    const m = String(req.query.url || "").match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
    if (!m) return res.status(400).json({ error: "Only YouTube links are supported right now." });
    const page = await (await fetch("https://www.youtube.com/watch?v=" + m[1], { headers: { "Accept-Language": "en", "User-Agent": "Mozilla/5.0" } })).text();
    const t = page.match(/"captionTracks":(\[.*?\])/);
    if (!t) return res.status(404).json({ error: "No captions found for this video." });
    const tracks = JSON.parse(t[1]);
    const tr = tracks.find(x => x.languageCode.startsWith("hi")) || tracks.find(x => x.languageCode.startsWith("en")) || tracks[0];
    const u = new URL(tr.baseUrl.replace(/\\u0026/g, "&"));
    if (!u.hostname.endsWith("youtube.com")) return res.status(400).json({ error: "bad track" });
    u.searchParams.set("fmt", "json3");
    const j = await (await fetch(u)).json();
    const transcript = j.events.filter(e => e.segs).map(e => e.segs.map(s => s.utf8).join("")).join(" ").replace(/\s+/g, " ").trim();
    res.status(200).json({ transcript, lang: tr.languageCode });
  } catch (e) { res.status(500).json({ error: "Could not fetch the transcript." }); }
}
