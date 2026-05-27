// App Store Connect metadata for Coco via the ASC API (ES256 JWT with the .p8 EC key).
// Usage: node scripts/asc_metadata.mjs inspect|apply
// Adapted from amorelle/apps/mobile/scripts/asc_metadata.mjs (read-only reference).
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const KEY_ID = "95P9D8959L";
const ISSUER = "3a0248cc-5c1d-4eeb-813d-82e19a9cf785";
const P8 = readFileSync("credentials/AuthKey_95P9D8959L.p8", "utf8");
const BUNDLE = "com.rodriguescarson.coco";
const MODE = process.argv[2] || "inspect";
const API = "https://api.appstoreconnect.apple.com/v1";

// App Store description: reuse Coco's Play full_description (keeps the
// "not a doctor/therapist" disclaimer). Under the 4000-char App Store limit.
const description = readFileSync(
  "fastlane/metadata/android/en-US/full_description.txt",
  "utf8",
).trim();

const META = {
  // appInfoLocalization (app-level)
  name: "Coco: Calm & Mental Health", // 26 chars (<=30)
  subtitle: "Mood, journal & calm", // 20 chars (<=30)
  privacyPolicyUrl: "https://coco.carsonrodrigues.com/privacy",
  // appStoreVersionLocalization (version-level)
  description,
  keywords:
    "calm,mood,journal,meditation,sleep,mental health,anxiety,breathing,wellbeing,mindfulness", // 89 chars (<=100)
  promotionalText:
    "A quiet companion for your mind. Track moods, breathe, journal, and talk to a calm AI listener — no streaks, no ads.", // 116 chars (<=170)
  supportUrl: "https://coco.carsonrodrigues.com",
  marketingUrl: "https://coco.carsonrodrigues.com",
};

const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "ES256", kid: KEY_ID, typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iss: ISSUER, iat: now, exp: now + 1000, aud: "appstoreconnect-v1" }));
  const s = createSign("SHA256"); s.update(`${header}.${payload}`);
  const sig = b64url(s.sign({ key: P8, dsaEncoding: "ieee-p1363" }));
  return `${header}.${payload}.${sig}`;
}
const TOKEN = jwt();
async function api(method, path, body) {
  const r = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    method, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = txt; }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${txt}`);
  return j;
}

// Resolve app
const apps = await api("GET", `/apps?filter[bundleId]=${BUNDLE}`);
const app = apps.data?.[0];
if (!app) throw new Error("app not found for " + BUNDLE);
console.log("app:", app.id, app.attributes.name);

// App info + its localizations
const infos = await api("GET", `/apps/${app.id}/appInfos`);
const appInfo = infos.data?.[0];
console.log("appInfo:", appInfo?.id, "state:", appInfo?.attributes?.appStoreState || appInfo?.attributes?.state);
const infoLocs = await api("GET", `/appInfos/${appInfo.id}/appInfoLocalizations`);
console.log("appInfo locales:", infoLocs.data.map((l) => l.attributes.locale).join(","));

// App store versions (editable one)
const versions = await api("GET", `/apps/${app.id}/appStoreVersions?limit=5`);
console.log("versions:", versions.data.map((v) => `${v.attributes.versionString}:${v.attributes.appStoreState}`).join("  "));
const EDITABLE = ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY", "WAITING_FOR_REVIEW"];
let version = versions.data.find((v) => EDITABLE.includes(v.attributes.appStoreState));
console.log("editable version:", version?.id, version?.attributes?.versionString, version?.attributes?.appStoreState);

if (MODE === "apply") {
  // Ensure an editable version exists (create 1.0 only if none)
  if (!version) {
    const created = await api("POST", `/appStoreVersions`, { data: { type: "appStoreVersions",
      attributes: { platform: "IOS", versionString: "1.0" },
      relationships: { app: { data: { type: "apps", id: app.id } } } } });
    version = created.data;
    console.log("created version:", version.id, "1.0");
  }
  // appInfoLocalization (name, subtitle, privacy url) for en-US
  let il = infoLocs.data.find((l) => l.attributes.locale === "en-US") || infoLocs.data[0];
  await api("PATCH", `/appInfoLocalizations/${il.id}`, { data: { type: "appInfoLocalizations", id: il.id,
    attributes: { name: META.name, subtitle: META.subtitle, privacyPolicyUrl: META.privacyPolicyUrl } } });
  console.log("✓ set appInfo localization (name/subtitle/privacy)");
  // appStoreVersionLocalization (description, keywords, etc.) for en-US
  const vlocs = await api("GET", `/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
  let vl = vlocs.data.find((l) => l.attributes.locale === "en-US") || vlocs.data[0];
  await api("PATCH", `/appStoreVersionLocalizations/${vl.id}`, { data: { type: "appStoreVersionLocalizations", id: vl.id,
    attributes: { description: META.description, keywords: META.keywords, promotionalText: META.promotionalText,
      supportUrl: META.supportUrl, marketingUrl: META.marketingUrl } } });
  console.log("✓ set version localization (description/keywords/promo/support/marketing)");
  console.log("\n✅ App Store metadata applied for", BUNDLE);
}
