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
          // Hyperbeam expects timeout object values, not a numeric timeout value.
          timeout: {
            absolute: SESSION_DURATION
          },
          // You can add optional session options here:
          // start_url: "about:blank",
          // region: "NA",
          // adblock: true
        })
      });

      const data = await hb.json();

      // Hyperbeam may return session_id or id depending on API version.
      const sessionId = data.session_id || data.id;
      const embedUrl = data.embed_url || data.embedUrl;

      if (!sessionId || !embedUrl) {
        console.error('Hyperbeam create returned bad payload', data);
        return res.status(502).json({ error: 'Hyperbeam create response missing session_id/embed_url', details: data });
      }

      return res.json({
        session_id: sessionId,
        embed_url: embedUrl
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