# Coco — ASO-Optimized Store Listing

Single source of truth for App Store Connect (iOS) and Google Play Console (Android)
copy. Optimized for App Store Optimization (ASO). All copy is grounded in the real app
(see `README.md`, `app.json`, `STORE_RELEASE.md`, `docs/app-store-review-resubmission.md`,
`fastlane/metadata/`). Every character count below was validated programmatically.

- **App:** Coco — a calm mental-health companion (Expo SDK 54 / React Native)
- **Bundle id / package:** `com.rodriguescarson.coco`
- **Category:** Health & Fitness (primary) · Lifestyle (secondary)
- **Pricing:** Free · **Content rating:** 12+
- **Real features (verified in repo):** AI listener chat (Groq, crisis-aware), daily
  check-ins + streaks, mood tracker with weekly trends, journal + voice journaling,
  breathing exercises (Box / 4-7-8 / Coherent / Physiological Sigh), grounding 5-4-3-2-1,
  meditation library + sleep sounds, therapy bookings, places & people directory, crisis
  SOS hotlines, sourced articles. On-device by default; optional sync.

> ASO note: iOS and Play rank differently. iOS indexes **title + subtitle + the hidden
> 100-char keyword field** (description is NOT indexed). Play has **no keyword field** —
> Google indexes **title + short description + full description by keyword frequency**.
> The two full descriptions below are deliberately different; the Play one is
> keyword-dense by design.

---

## APPLE — App Store

### Title — 27/30 ✅
```
Coco: Mental Health Journal
```
Brand + top keywords (`mental health`, `journal`), colon separator. No "app/free", no
category-name word ("Health & Fitness" is the category — "Mental Health" is a distinct
search phrase, not the category name).

### Subtitle — 28/30 ✅
```
Mood Tracker, Anxiety & Calm
```
Net-new keywords only — **zero token overlap** with the title (no coco/mental/health/journal).
Adds `mood`, `mood tracker`, `tracker`, `anxiety`, `calm`.

### Keywords — 97/100 ✅
```
depression,stress,wellness,mindfulness,meditation,breathe,sleep,gratitude,diary,therapy,relax,cbt
```
Comma-separated, **no space after commas**, singular forms, no title/subtitle repeats, no
category-name words (no "health"/"fitness"). Apple auto-combines these tokens with title +
subtitle tokens to form search phrases.

### Promotional Text — 138/170 ✅
```
Meet Coco: a calm AI listener, mood tracker, journal, breathing and sleep tools, plus one-tap crisis support — private and on your device.
```

### Description — 2334/4000 ✅
First 170 chars = CTA + value + differentiator (AI listener that surfaces real crisis help),
bullets after. Includes the **medical disclaimer** and **Groq third-party-AI disclosure**
required by App Review (per `docs/app-store-review-resubmission.md`).
```
Meet Coco, a calm companion for your mind. Track your mood, journal your thoughts, breathe through anxiety, and talk to an AI listener that quietly surfaces real crisis help when you need it.

Coco is calm by design — no streaks shouting at you, no feeds, no ads. Just gentle tools for the heavy days and the fine ones.

WHAT'S INSIDE
• Talk to Coco — an AI listener built to reflect, not lecture. Crisis-aware: it surfaces real hotlines automatically when something serious comes up.
• Daily check-ins — a soft prompt that changes every day, with a streak you keep at your own pace.
• Mood tracker — log how you feel in a tap and watch your weekly trends take shape.
• Journal — write freely with prompts you can shuffle. Entries stay private on your device unless you sign in to sync. Record a voice entry and Coco turns it into text.
• Breathing exercises — an animated guide for Box, 4-7-8, Coherent, and the Physiological Sigh.
• Grounding 5-4-3-2-1 — for the moments that pull you under.
• Meditation library and sleep sounds — wind down, drift off, reset.
• Therapy bookings — browse clinicians, pick a slot, hold a session.
• Places & people — a directory of clinics, helplines, support groups, and wellness centres.
• Crisis SOS — one tap to local hotlines plus a guided grounding tool.

PRIVACY FIRST
Everything in Coco lives on your device by default. Nothing is uploaded until you choose to sign in. Even then, Coco only syncs your own data under your account — never sold, never handed to advertisers. The AI companion and voice journaling use Groq, Inc. to generate replies and transcribe audio, and only after you agree on first use; you can withdraw consent anytime in You → Privacy.

You can erase your on-device data anytime from Profile.

Important: Coco offers educational wellness content and supportive conversation. It is not a medical device and does not provide medical diagnosis or treatment, and it is not a substitute for professional care. Always seek the advice of a doctor or licensed clinician about any medical condition or before making medical decisions. If you are in crisis, contact your local emergency number or a crisis line — the in-app SOS screen lists several.

Coco began as the Green Ribbon Army's submission to Smart India Hackathon 2022. It is the part of that work we refused to let go.
```

---

## ANDROID — Google Play

> Play has no keyword field. These three fields are all keyword-indexed by frequency, so
> the full description repeats the primary phrases naturally. This file's Play copy is
> mirrored in `fastlane/metadata/android/en-US/{title,short_description,full_description}.txt`
> (the files `scripts/push_listing.mjs` actually uploads).

### Title — 26/30 ✅
```
Coco: Mental Health & Mood
```
Indexed by Google — packs the two highest-value phrases (`mental health`, `mood`).

### Short Description — 75/80 (indexed) ✅
```
Mood tracker, journal, breathing & an AI listener for calmer mental health.
```

### Full Description — 2829/4000 (indexed, keyword-dense) ✅
Validated keyword frequency (the Android ranking lever):
| Phrase | Occurrences |
|---|---|
| `mental health` | 7 |
| `mood tracker` | 6 |
| `journal` (incl. journaling) | 9 |
| `anxiety` | 5 |
| `mood` (total) | 9 |

```
Coco is a calm mental health app and a quiet companion for your mind. Track your mood, keep a private journal, breathe through anxiety, and talk to an AI listener whenever you need someone to listen.

Coco brings your everyday mental health tools into one gentle place — a mood tracker, a journal, breathing exercises, sleep sounds, and supportive AI chat. No streaks shouting at you, no feeds, no ads. Just calm.

WHY COCO FOR YOUR MENTAL HEALTH
Looking after your mental health should feel light, not like another chore. Coco gives you a soft daily check-in, a fast mood tracker, and a judgment-free journal so you can notice patterns in your mood and ease anxiety before it builds.

WHAT'S INSIDE
• AI listener — talk to Coco, an AI companion built to reflect, not lecture. It is crisis-aware and surfaces real mental health hotlines automatically when something serious comes up.
• Mood tracker — log how you feel in a tap and watch your weekly mood trends take shape.
• Journal — write freely with shuffleable prompts, or record a voice journal entry and let Coco turn it into text. Entries stay private on your device unless you sign in.
• Daily check-ins — a soft prompt that changes every day, with a gentle streak.
• Breathing exercises for anxiety — an animated guide for Box breathing, 4-7-8, Coherent, and the Physiological Sigh.
• Grounding 5-4-3-2-1 — for moments of anxiety and panic.
• Meditation library and sleep sounds — wind down, drift off, reset.
• Therapy bookings — browse clinicians, pick a slot, hold a session.
• Places & people — a directory of clinics, helplines, support groups, and wellness centres.
• Crisis SOS — one tap to local hotlines plus a guided grounding tool.

A MOOD TRACKER AND JOURNAL THAT RESPECT YOU
Your mood tracker and journal in Coco are private by default. Everything lives on your device until you choose to sign in, and Coco never sells your data or hands it to advertisers. The AI companion and voice journaling use Groq, Inc. to generate replies and transcribe audio, only after you agree on first use — you can withdraw consent anytime in You → Privacy. Erase your on-device data anytime from Profile.

A NOTE ON WHAT COCO IS
Coco offers educational wellness content and supportive conversation for your mental health. It is not a medical device and does not diagnose, treat, or replace professional care. Always seek the advice of a doctor or licensed clinician about any condition. If you are in crisis, contact your local emergency number or a crisis line — Coco's SOS screen lists several.

Whether you want a daily mood tracker, a calming journal, breathing exercises for anxiety, or just an AI listener at 2am, Coco is mental health support that stays quiet, private, and on your side.

Coco began as the Green Ribbon Army's submission to Smart India Hackathon 2022.
```

---

## Screenshot captions (5–6, 3–7 words)

Reinforce the core keywords that the stores can't index from images alone:

1. Your calm mental-health home
2. Talk to an AI listener
3. Track your mood daily
4. Breathe through anxiety
5. Private journal, on your device
6. One-tap crisis support

(Map to scenes in `STORE_RELEASE.md`: Home → Coco chat → Mood graph → Breathe → Journal → SOS / Places.)

---

## ASO reasoning — indexed search combinations

**iOS** — Apple cross-combines tokens from title + subtitle + keyword field, so these
fields are chosen for *combinatorial* coverage, not standalone phrases:
- From title+subtitle: `mental health`, `health journal`, `mental health journal`,
  `mood tracker`, `journal mood`, `anxiety journal`, `calm mood`, `mental health tracker`.
- From keyword field × title/subtitle: `depression tracker`, `anxiety journal`,
  `stress journal`, `meditation mood`, `sleep tracker`, `cbt journal`, `mindfulness mood`,
  `therapy journal`, `gratitude journal`, `mood diary`, `breathe anxiety`.
- No token is wasted on repeats, "app", "free", or the category words health/fitness.

**Android** — no keyword field, so ranking is driven by phrase *frequency* in the three
indexed fields. The full description deliberately repeats the four primary phrases
(`mental health` ×7, `mood tracker` ×6, `journal` ×9, `anxiety` ×5) inside natural
sentences and section headers, plus the title and short description both lead with
`mental health` + `mood`. This is the Play ranking lever and is treated as first-class —
the Play full description is a distinct, denser piece of copy than the Apple one (Apple's
description is not indexed, so it optimizes for conversion instead).

---

## How this wires into `scripts/push_listing.mjs`

`scripts/push_listing.mjs` pushes the **Google Play** listing via the Android Publisher
Edits API. It reads exactly three text files plus two images — it does **not** read this
markdown file:

```
fastlane/metadata/android/en-US/title.txt              ← Play Title (above)
fastlane/metadata/android/en-US/short_description.txt  ← Play Short Description (above)
fastlane/metadata/android/en-US/full_description.txt   ← Play Full Description (above)
fastlane/metadata/android/en-US/images/icon.png        ← uploaded as listing icon
fastlane/metadata/android/en-US/images/featureGraphic.png ← uploaded as feature graphic
```

Those three `.txt` files have **already been updated** with the optimized Play copy above,
so the wiring is done — just run:

```bash
node scripts/push_listing.mjs
```

The script PUTs the listing and commits the edit; it logs the resulting short/full lengths.

**iOS is NOT covered by this script.** There is no fastlane `deliver` metadata for iOS in
the repo (only `fastlane/metadata/en-US/release_notes.txt`), and `fastlane ios submit_review`
explicitly does not touch the listing. Enter the Apple Title / Subtitle / Keywords /
Promotional Text / Description above **manually in App Store Connect** (or add them to a
`fastlane deliver` Deliverfile if you want them version-controlled). Also remember the open
App-Review to-do from `docs/app-store-review-resubmission.md`: set the Privacy Policy URL to
`https://coco.carsonrodrigues.com/privacy`.
