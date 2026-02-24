const functions = require("@google-cloud/functions-framework");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET;
const DEXCOM_REDIRECT_URI = process.env.DEXCOM_REDIRECT_URI;
const DEXCOM_BASE_URL =
  process.env.DEXCOM_BASE_URL || "https://sandbox-api.dexcom.com";
const APP_REDIRECT =
  process.env.DEXCOM_APP_REDIRECT || "snapdose://dexcom-connected";

functions.http("dexcomAuth", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  const path = req.path;

  if (path === "/auth-url") return handleAuthUrl(req, res);
  if (path === "/callback") return handleCallback(req, res);
  if (path === "/status") return handleStatus(req, res);
  if (path === "/egvs") return handleEgvs(req, res);

  res.status(404).json({ error: "Not found" });
});

function handleAuthUrl(req, res) {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const params = new URLSearchParams({
    client_id: DEXCOM_CLIENT_ID,
    redirect_uri: DEXCOM_REDIRECT_URI,
    response_type: "code",
    scope: "offline_access",
    state: userId,
  });

  const url = `${DEXCOM_BASE_URL}/v3/oauth2/login?${params.toString()}`;
  res.json({ url });
}

async function handleCallback(req, res) {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).send("Missing code or state parameter");
  }

  const userId = state;

  try {
    const tokenResponse = await fetch(`${DEXCOM_BASE_URL}/v2/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DEXCOM_CLIENT_ID,
        client_secret: DEXCOM_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: DEXCOM_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Dexcom token exchange failed:", errorText);
      return res.status(502).send("Failed to exchange authorization code");
    }

    const tokens = await tokenResponse.json();

    await db
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("dexcom")
      .set(
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          connectedAt: Date.now(),
          connected: true,
        },
        { merge: true },
      );

    res.redirect(302, APP_REDIRECT);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Internal error during Dexcom authentication");
  }
}

async function handleStatus(req, res) {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const doc = await db
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("dexcom")
      .get();

    const connected = doc.exists && doc.data().connected === true;
    res.json({ connected });
  } catch (err) {
    console.error("Status check error:", err);
    res.json({ connected: false });
  }
}

async function handleEgvs(req, res) {
  const { userId, startDate, endDate } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const accessToken = await getValidAccessToken(userId);

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const url = `${DEXCOM_BASE_URL}/v3/users/self/egvs?${params.toString()}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dexcom EGV fetch failed:", errorText);
      return res
        .status(response.status)
        .json({ error: "Failed to fetch glucose data" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("EGV fetch error:", err);
    if (err.message === "Dexcom not connected") {
      return res.status(401).json({ error: "Dexcom not connected" });
    }
    res.status(500).json({ error: "Internal error fetching glucose data" });
  }
}

async function getValidAccessToken(userId) {
  const doc = await db
    .collection("users")
    .doc(userId)
    .collection("integrations")
    .doc("dexcom")
    .get();

  if (!doc.exists || !doc.data().connected) {
    throw new Error("Dexcom not connected");
  }

  const { accessToken, refreshToken, expiresAt } = doc.data();

  if (Date.now() < expiresAt - 60000) {
    return accessToken;
  }

  const tokenResponse = await fetch(`${DEXCOM_BASE_URL}/v2/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DEXCOM_CLIENT_ID,
      client_secret: DEXCOM_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Token refresh failed:", errorText);
    throw new Error("Token refresh failed");
  }

  const tokens = await tokenResponse.json();

  await db
    .collection("users")
    .doc(userId)
    .collection("integrations")
    .doc("dexcom")
    .set(
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      },
      { merge: true },
    );

  return tokens.access_token;
}
