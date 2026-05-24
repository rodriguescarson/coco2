// Verify a service account can access a Play app. Read-only.
// Usage: node check_play_access.mjs <sa-json-path> <packageName>
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const [SA_PATH, PKG] = process.argv.slice(2);
const SA = JSON.parse(readFileSync(SA_PATH, "utf8"));
const BASE = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
async function token() {
  const now = Math.floor(Date.now()/1000);
  const h=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const c=b64url(JSON.stringify({iss:SA.client_email,scope:"https://www.googleapis.com/auth/androidpublisher",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
  const s=createSign("RSA-SHA256"); s.update(`${h}.${c}`);
  const jwt=`${h}.${c}.${b64url(s.sign(SA.private_key))}`;
  const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})});
  const j=await r.json(); if(!j.access_token) throw new Error("token: "+JSON.stringify(j)); return j.access_token;
}
const t=await token();
console.log("SA:", SA.client_email);
const r=await fetch(`${BASE}/edits`,{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"}});
const txt=await r.text();
if(!r.ok){ console.log("❌ NO ACCESS to", PKG, "->", r.status, txt); process.exit(1); }
const edit=JSON.parse(txt);
const det=await (await fetch(`${BASE}/edits/${edit.id}/details`,{headers:{Authorization:`Bearer ${t}`}})).json();
const trk=await (await fetch(`${BASE}/edits/${edit.id}/tracks`,{headers:{Authorization:`Bearer ${t}`}})).json();
await fetch(`${BASE}/edits/${edit.id}`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`}});
console.log("✅ ACCESS OK to", PKG);
console.log("details:", JSON.stringify(det));
console.log("tracks:", (trk.tracks||[]).map(x=>`${x.track}[${(x.releases||[]).map(r=>r.name+":"+r.status).join(",")}]`).join("  "));
