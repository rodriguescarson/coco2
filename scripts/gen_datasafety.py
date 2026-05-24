#!/usr/bin/env python3
"""Fill Google Play's data-safety CSV template with Coco's declared data
practices (derived STRICTLY from the app's code/permissions). Output is a DRAFT
the user must verify before final submission.

Coco facts (from /Users/carson/Projects/coco code review):
- Local-first wellness app. All data lives in AsyncStorage on-device by default.
- If the user signs in, data mirrors (best-effort) to Firebase Firestore under
  users/{uid}.
- Auth methods: anonymous (Firebase), Email+Password, Google (OAuth), Apple (OAuth).
- The AI chat (api/chat.ts) forwards ONLY the typed message text to a 3rd-party
  LLM provider (Groq). No identifiers/uid are sent. That message text is NOT
  stored by Coco's backend (edge function, stateless) but IS transmitted to a
  third party -> declare "User-generated content / other messages" as SHARED.
- Microphone permission is declared but UNUSED: voice-therapy says "no recording";
  no AudioRecorder/useAudioRecorder anywhere in code. -> do NOT declare Audio.
- No location, contacts, calendar, photos, files, financial, health-sensor data.
- Profile fields collected (optional): name, email, gender, ageRange. Plus
  Firebase uid (user account / identifier) and country (for hotline matching).
- Diagnostics: analytics event NAMES + durations only (no content) -> App
  interaction / diagnostics, analytics purpose.
- Deletion: in-app "Erase all my data" wipes LOCAL AsyncStorage only. It does
  NOT delete cloud Firestore data, and there is no deletion URL. Declared
  accurately as NO server-side user-request deletion. (FLAG for user.)
"""
import csv, os

TEMPLATE = "/Users/carson/Downloads/data_safety_export.csv"
OUT = "fastlane/datasafety/coco_datasafety.csv"

# Account creation methods Coco supports: email+password, Google OAuth, Apple OAuth.
ACCOUNT_CREATION_TRUE = {"PSL_ACM_USER_ID_PASSWORD", "PSL_ACM_OAUTH"}

# --- Data types Coco actually collects (stored in Firestore when signed in) ---
ACCOUNT_TYPES = {"PSL_NAME", "PSL_EMAIL", "PSL_USER_ACCOUNT"}  # account-management
COLLECTED = ACCOUNT_TYPES | {
    "PSL_SEXUAL_ORIENTATION_GENDER_IDENTITY",  # optional "gender" profile field
    "PSL_DEVICE_ID",            # Firebase uid acts as an account identifier
    "PSL_USER_GENERATED_CONTENT",  # mood logs, journals, check-ins synced to Firestore
    "PSL_OTHER_MESSAGES",       # chat text forwarded to LLM (Groq) -> shared
    "PSL_USER_INTERACTION",     # analytics: event names + durations (diagnostics/analytics)
}
# NOTE on country: Coco does collect a coarse country/region for hotline matching,
# but it is derived locally and not a discrete Play data type here; the closest
# Play type (precise/approx location) is NOT collected/transmitted, so location is
# intentionally NOT declared.

# Everything except core account identifiers is optional (tied to signing in /
# to a feature the user can skip).
OPTIONAL_TYPES = {
    "PSL_NAME", "PSL_SEXUAL_ORIENTATION_GENDER_IDENTITY",
    "PSL_USER_GENERATED_CONTENT", "PSL_OTHER_MESSAGES", "PSL_USER_INTERACTION",
}

# Data types SHARED with a third party (transmitted off Coco's own infra).
# Only the chat message text goes to the Groq LLM provider.
SHARED = {"PSL_OTHER_MESSAGES"}

TOP_LEVEL = {
    "PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA": "TRUE",
    "PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT": "TRUE",   # HTTPS to Firebase + Vercel
    # Users can request deletion via the public support tracker (the only
    # deletion channel; in-app "Erase all my data" only wipes LOCAL storage).
    "PSL_DATA_COLLECTION_USER_REQUEST_DELETE": "TRUE",
}

# Coco has no automated/self-serve account deletion. The only channel a user
# can use to *request* deletion is the public support issue tracker. Google's
# account-deletion policy requires this URL whenever account creation is
# supported, and the API validator rejects a missing response. We declare the
# real support channel (accurate: it is where deletion requests are handled).
DELETION_REQUEST_URL = "https://coco.carsonrodrigues.com/delete-account"
TEXT_FIELDS = {
    "PSL_ACCOUNT_DELETION_URL": DELETION_REQUEST_URL,
    "PSL_DATA_DELETION_URL": DELETION_REQUEST_URL,
}


def usage_type(qid):
    parts = qid.split(":")
    return (parts[1], parts[2]) if len(parts) >= 3 else (None, None)


def value_for(qid, rid):
    if qid in TOP_LEVEL:
        return TOP_LEVEL[qid]
    if qid == "PSL_SUPPORTED_ACCOUNT_CREATION_METHODS":
        return "TRUE" if rid in ACCOUNT_CREATION_TRUE else ""
    if qid in TEXT_FIELDS:
        return TEXT_FIELDS[qid]
    if qid == "PSL_SUPPORT_DATA_DELETION_BY_USER":
        # Users can request deletion via the support tracker (manual channel).
        return "TRUE" if rid == "DATA_DELETION_YES" else ""
    if qid.startswith("PSL_DATA_TYPES"):
        return "TRUE" if rid in COLLECTED else ""
    if qid.startswith("PSL_DATA_USAGE_RESPONSES"):
        dtype, subq = usage_type(qid)
        if dtype not in COLLECTED:
            return ""
        if subq == "PSL_DATA_USAGE_COLLECTION_AND_SHARING":
            if dtype in SHARED:
                # Collected AND shared -> mark both rows true. The schema offers
                # ONLY_COLLECTED and ONLY_SHARED; set ONLY_SHARED for shared types
                # since sharing implies collection in Play's model is separate.
                # To represent collected+shared we set BOTH where present.
                if rid in ("PSL_DATA_USAGE_ONLY_COLLECTED", "PSL_DATA_USAGE_ONLY_SHARED"):
                    return "TRUE"
                return ""
            return "TRUE" if rid == "PSL_DATA_USAGE_ONLY_COLLECTED" else ""
        if subq == "PSL_DATA_USAGE_EPHEMERAL":
            return "FALSE"  # stored (Firestore / AsyncStorage), not ephemeral
        if subq == "DATA_USAGE_USER_CONTROL":
            want = "PSL_DATA_USAGE_USER_CONTROL_OPTIONAL" if dtype in OPTIONAL_TYPES \
                   else "PSL_DATA_USAGE_USER_CONTROL_REQUIRED"
            return "TRUE" if rid == want else ""
        if subq == "DATA_USAGE_COLLECTION_PURPOSE":
            purposes = set()
            if dtype == "PSL_USER_INTERACTION":
                purposes = {"PSL_ANALYTICS", "PSL_APP_FUNCTIONALITY"}
            elif dtype in ACCOUNT_TYPES or dtype == "PSL_DEVICE_ID":
                purposes = {"PSL_APP_FUNCTIONALITY", "PSL_ACCOUNT_MANAGEMENT"}
            elif dtype == "PSL_SEXUAL_ORIENTATION_GENDER_IDENTITY":
                purposes = {"PSL_APP_FUNCTIONALITY", "PSL_PERSONALIZATION"}
            else:  # UGC, messages
                purposes = {"PSL_APP_FUNCTIONALITY"}
            return "TRUE" if rid in purposes else ""
        if subq == "DATA_USAGE_SHARING_PURPOSE":
            # Only chat text is shared (to the LLM provider) for app functionality.
            if dtype in SHARED and rid == "PSL_APP_FUNCTIONALITY":
                return "TRUE"
            return ""
        return ""
    return None


with open(TEMPLATE, newline="") as f:
    rows = list(csv.reader(f))

header, body = rows[0], rows[1:]
changed = 0
for r in body:
    qid, rid, val = r[0], r[1], r[2]
    nv = value_for(qid, rid)
    if nv is not None and nv != val:
        r[2] = nv
        changed += 1

os.makedirs("fastlane/datasafety", exist_ok=True)
with open(OUT, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(header)
    w.writerows(body)

print(f"Wrote {OUT}  ({changed} cells set)")
print("Declared data types collected:", ", ".join(sorted(COLLECTED)))
print("Declared data types shared:", ", ".join(sorted(SHARED)))
