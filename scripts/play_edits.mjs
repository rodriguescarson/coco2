// Drive the Play Developer Edits API with the service account for Coco.
// Usage: node scripts/play_edits.mjs inspect   (read-only: prints details + tracks)
//        node scripts/play_edits.mjs apply     (set contact details, commit)
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const PKG = "com.rodriguescarson.coco";
const MODE = process.argv[2] || "inspect";
const SA = JSON.parse(readFileSync("credentials/service-account-key.json", "utf8"));
const BASE = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;

// Contact details. No support email exists in the codebase; using the developer's
// known contact email + the app's web home (base of the privacy-policy URL).
const CONTACT = {
  contactEmail: "rodriguescarson@gmail.com",
  contactWebsite: "https://coco.carsonrodrigues.com",
};

const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const c = b64url(JSON.stringify({ iss: SA.client_email, scope: "https://www.googleapis.com/auth/androidpublisher", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const s = createSign("RSA-SHA256"); s.update(`${h}.${c}`);
  const jwt = `${h}.${c}.${b64url(s.sign(SA.private_key))}`;
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  const j = await r.json(); if (!j.access_token) throw new Error(JSON.stringify(j)); return j.access_token;
}
async function api(t, method, path, body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = txt; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${txt}`);
  return j;
}

const t = await token();
const edit = await api(t, "POST", "/edits");
console.log("editId:", edit.id);
const details = await api(t, "GET", `/edits/${edit.id}/details`);
console.log("\ncurrent details:", JSON.stringify(details));

if (MODE === "apply") {
  await api(t, "PATCH", `/edits/${edit.id}/details`, CONTACT);
  console.log("\nset contact details", JSON.stringify(CONTACT));
  const c = await api(t, "POST", `/edits/${edit.id}:commit`);
  console.log("\ncommitted edit", c.id || edit.id);
} else {
  await api(t, "DELETE", `/edits/${edit.id}`);
  console.log("\n(inspect only - edit discarded)");
}
