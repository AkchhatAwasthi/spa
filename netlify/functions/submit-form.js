// netlify/functions/submit-form.js
// Requires: environment variables set in Netlify (see Step 4)

// MongoDB
const { MongoClient } = require("mongodb");

// Reuse the client between invocations (faster)
let cachedClient = null;
async function getClient() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

// Simple CORS helper
function cors(extra = {}) {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extra,
  };
}

// OPTIONAL: WhatsApp (Meta Cloud API). Skip if not configured.
async function sendWhatsApp({ to, text }) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return; // skip if not set

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${err}`);
  }
}

exports.handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors() };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors(), body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    // Basic validation — adjust to your form fields
    const { name, phone, message } = body;
    if (!name || !phone) {
      return {
        statusCode: 400,
        headers: cors({ "Content-Type": "application/json" }),
        body: JSON.stringify({ error: "name and phone are required" }),
      };
    }

    // 1) Save to MongoDB
    const dbName = process.env.MONGODB_DB; // e.g., "spawell"
    const cli = await getClient();
    const db = cli.db(dbName);
    const result = await db.collection("bookings").insertOne({
      name,
      phone,
      message: message || "",
      createdAt: new Date(),
    });

    // 2) Send WhatsApp confirmation (optional)
    await sendWhatsApp({
      to: phone, // e.g., "91XXXXXXXXXX"
      text: `Hey ${name}, we received your form. We'll get back to you soon!`,
    });

    return {
      statusCode: 200,
      headers: cors({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ok: true, id: String(result.insertedId) }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: cors({ "Content-Type": "application/json" }),
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};
