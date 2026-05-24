// Push Coco's store listing (title/short/full) + listing images (icon,
// feature graphic) to Google Play via the Edits API. Works even when the app
// has NO releases on any track (fastlane supply crashes in that case).
// Usage: node scripts/push_listing.mjs
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const PKG = "com.rodriguescarson.coco";
const LANG = "en-US";
const META = "fastlane/metadata/android/en-US";
const SA = JSON.parse(readFileSync("credentials/service-account-key.json", "utf8"));
const BASE = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;

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
async function uploadImage(t, editId, imageType, file) {
  const bytes = readFileSync(file);
  const url = `${UPLOAD}/edits/${editId}/listings/${LANG}/${imageType}?uploadType=media`;
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "image/png" }, body: bytes });
  const txt = await r.text();
  if (!r.ok) throw new Error(`upload ${imageType} -> ${r.status} ${txt}`);
  return JSON.parse(txt);
}

const t = await token();
const title = readFileSync(`${META}/title.txt`, "utf8").trim();
const shortDescription = readFileSync(`${META}/short_description.txt`, "utf8").trim();
const fullDescription = readFileSync(`${META}/full_description.txt`, "utf8").trim();

const edit = await api(t, "POST", "/edits");
console.log("editId:", edit.id);

const listing = await api(t, "PUT", `/edits/${edit.id}/listings/${LANG}`, {
  language: LANG, title, shortDescription, fullDescription,
});
console.log("listing set:", listing.title, "| short", listing.shortDescription.length, "| full", listing.fullDescription.length);

const icon = await uploadImage(t, edit.id, "icon", `${META}/images/icon.png`);
console.log("icon uploaded sha1:", icon.image?.sha1);
const fg = await uploadImage(t, edit.id, "featureGraphic", `${META}/images/featureGraphic.png`);
console.log("featureGraphic uploaded sha1:", fg.image?.sha1);

const committed = await api(t, "POST", `/edits/${edit.id}:commit`);
console.log("committed edit:", committed.id || edit.id);
