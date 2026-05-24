// POST Coco's data-safety CSV to the Play Developer API
// (applications.dataSafety). Auths the service account via a signed JWT.
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const PKG = "com.rodriguescarson.coco";
const SA = JSON.parse(readFileSync("credentials/service-account-key.json", "utf8"));
const csv = readFileSync("fastlane/datasafety/coco_datasafety.csv", "utf8");

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: SA.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = b64url(signer.sign(SA.private_key));
  const jwt = `${header}.${claim}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("token error: " + JSON.stringify(j));
  return j.access_token;
}

const token = await getToken();
const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}/dataSafety`;
const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ safetyLabels: csv }),
});
const text = await res.text();
console.log("HTTP", res.status);
console.log(text || "(empty body = success)");
process.exit(res.ok ? 0 : 1);
