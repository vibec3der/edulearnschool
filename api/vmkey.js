const SESSION_DURATION = 900; // 15 minutes

export default async function handler(req, res) {
  const { action, sessionId } = req.body;
  const API_KEY = process.env.HYPERBEAM_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    if (action === "create") {
      const hb = await fetch("https://engine.hyperbeam.com/v0/vm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          timeout: SESSION_DURATION // 🔥 THIS is the real limiter
        })
      });

      const data = await hb.json();

      if (!data || !data.id || !data.embed_url) {
        console.error('Hyperbeam create returned bad payload', data);
        return res.status(502).json({ error: 'Hyperbeam create response missing id/embed_url', details: data });
      }

      return res.json({
        session_id: data.id,
        embed_url: data.embed_url
      });
    }

    if (action === "delete") {
      await fetch(`https://engine.hyperbeam.com/v0/vm/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      });

      return res.json({});
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('vmkey API error', err);
    return res.status(500).json({ error: err.message });
  }
}