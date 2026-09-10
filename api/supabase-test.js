export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    return res.status(500).json({
      ok: false,
      error: "Missing Supabase environment variables"
    });
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/current_state?select=*&limit=1`,
      {
        headers: {
          apikey: key
        }
      }
    );

    const body = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: body
      });
    }

    return res.status(200).json({
      ok: true,
      message: "WTFisHappening successfully connected to Supabase",
      current_state: JSON.parse(body)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
