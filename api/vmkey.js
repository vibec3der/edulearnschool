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
        }
      });

      const data = await hb.json();

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

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}