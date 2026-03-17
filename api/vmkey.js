const SESSION_DURATION = 900; // 15 minutes

export default async function handler(req, res) {
  const { action, sessionId, keyNumber } = req.body;

  // Map keys: Key 1 → HYPERBEAM_API_KEY, others → HYPERBEAM_KEY_2/3
  let API_KEY;
  if (keyNumber === "1") {
    API_KEY = process.env.HYPERBEAM_API_KEY; // default first key
  } else {
    API_KEY = process.env[`HYPERBEAM_KEY_${keyNumber}`]; // numbered keys
  }

  if (!API_KEY) {
    return res.status(500).json({ error: `Missing API key for keyNumber ${keyNumber}` });
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
          timeout: { absolute: SESSION_DURATION }
        })
      });

      const data = await hb.json();
      const sessionId = data.session_id || data.id;
      const embedUrl = data.embed_url || data.embedUrl;

      if (!sessionId || !embedUrl) {
        console.error('Hyperbeam create returned bad payload', data);
        return res.status(502).json({ error: 'Hyperbeam create response missing session_id/embed_url', details: data });
      }

      return res.json({ session_id: sessionId, embed_url: embedUrl });
    }

    if (action === "delete") {
      await fetch(`https://engine.hyperbeam.com/v0/vm/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${API_KEY}` }
      });

      return res.json({});
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('vmkey API error', err);
    return res.status(500).json({ error: err.message });
  }
}