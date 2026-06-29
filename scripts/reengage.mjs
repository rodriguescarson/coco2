// Coco re-engagement — gentle daily win-back.
//
// Coco has NO server / Cloud Functions, so this runs as a scheduled GitHub
// Action (see .github/workflows/reengage.yml) using the Firebase Admin SDK.
//
// MENTAL-HEALTH SAFETY (deliberate):
//   • No "streak" or daily-pressure nudges — only soft lapsed/dormant win-backs.
//   • Copy is supportive and pressure-free, safe even for someone struggling
//     ("we're here when you're ready", "no pressure").
//   • Low frequency: at most one nudge per user per 5 days.
//   • There is currently no server-side crisis/SOS flag (SOS is client-side), so
//     we can't exclude a specific in-crisis user — the gentle copy is the
//     safeguard. If a crisis flag is later written to users/{uid}.inCrisisUntil,
//     add a skip for it below.
//
// Requires env FIREBASE_SERVICE_ACCOUNT = the JSON of a Firebase service-account
// key (a FRESH one — the previously-committed key must be revoked). If the env
// is empty the script exits cleanly so the schedule never error-spams.

import admin from "firebase-admin";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const DAY = 86_400_000;

const COPY = {
  lapsed: {
    title: "We're here when you're ready 🌱",
    body: "Take a mindful minute today — your space in Coco is waiting.",
  },
  dormant: {
    title: "A gentle check-in 💚",
    body: "No pressure — Coco's here whenever you'd like a calm moment.",
  },
};

function initFirebase() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || !raw.trim()) {
    console.log("FIREBASE_SERVICE_ACCOUNT not set — skipping (add a fresh key to enable).");
    process.exit(0);
  }
  const cred = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(cred) });
  return admin.firestore();
}

const isExpoToken = (t) =>
  typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));

async function lastActiveMs(db, uid) {
  const latest = async (sub) => {
    try {
      const snap = await db.collection(`users/${uid}/${sub}`).orderBy("at", "desc").limit(1).get();
      return snap.empty ? 0 : Number(snap.docs[0].data().at) || 0;
    } catch {
      return 0;
    }
  };
  const [m, j, c] = await Promise.all([latest("moods"), latest("journals"), latest("checkins")]);
  return Math.max(m, j, c);
}

function segment(days) {
  if (days >= 3 && days <= 7) return "lapsed";
  if (days >= 8 && days <= 21) return "dormant";
  return null; // active / barely-lapsed (no daily pressure) / too dormant
}

async function sendExpo(messages) {
  let delivered = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
    if (res.ok) delivered += chunk.length;
  }
  return delivered;
}

async function main() {
  const db = initFirebase();
  const now = Date.now();
  const users = await db.collection("users").get();

  const messages = [];
  const stamp = [];
  const counts = { lapsed: 0, dormant: 0 };

  for (const userDoc of users.docs) {
    const uid = userDoc.id;
    const data = userDoc.data() || {};

    // frequency cap — at most one nudge per 5 days
    if (data.lastReengagedAt && now - Number(data.lastReengagedAt) < 5 * DAY) continue;

    const lastAt = await lastActiveMs(db, uid);
    if (!lastAt) continue; // never active
    const seg = segment(Math.floor((now - lastAt) / DAY));
    if (!seg) continue;

    const tokSnap = await db.collection(`users/${uid}/pushTokens`).get();
    const tokens = tokSnap.docs.map((d) => d.id).filter(isExpoToken);
    if (!tokens.length) continue;

    const { title, body } = COPY[seg];
    for (const to of tokens) {
      messages.push({ to, title, body, sound: "default", data: { type: "reengage", segment: seg } });
    }
    stamp.push(userDoc.ref);
    counts[seg] += 1;
  }

  const delivered = messages.length ? await sendExpo(messages) : 0;
  // stamp everyone we attempted so the cap holds
  await Promise.all(stamp.map((ref) => ref.set({ lastReengagedAt: now }, { merge: true })));

  console.log(`reengage: users=${stamp.length} messages=${messages.length} delivered=${delivered}`, counts);
}

main().catch((e) => {
  console.error("reengage failed:", e);
  process.exit(1);
});
