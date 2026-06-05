# Coco

A quiet companion for your mind — built on Expo SDK 54.

**Now available:**
[App Store](https://apps.apple.com/app/coco-calm-mental-health/id6773467656)
· [Google Play](https://play.google.com/store/apps/details?id=com.rodriguescarson.coco)

This repo is the unified successor of [`Coco`](https://github.com/rodriguescarson/Coco)
(archived prototype) and the older `coco2` app. Everything has been rewritten
on a modern stack: Expo SDK 54, React 19, React Native 0.81, Expo Router,
Reanimated 4, with a Vercel Edge function powering the AI companion.

## What's inside

| Area | Files |
|---|---|
| Onboarding | `app/onboarding.tsx` |
| Tabs (Home / Tools / Connect / You) | `app/(tabs)/*` |
| AI chatbot (Groq + guardrails) | `app/chat.tsx`, `api/chat.ts` |
| Breathing exercises (animated) | `app/breathe.tsx` |
| Mood tracker (graph) | `app/mood.tsx` |
| Journal | `app/journal/*` |
| Daily check-in + streaks | `app/checkin.tsx` |
| Grounding 5-4-3-2-1 | `app/grounding.tsx` |
| Meditate, Sleep, Sleep sounds | `app/meditate.tsx`, `app/sleep.tsx` |
| Crisis SOS (hotlines) | `app/sos.tsx` |
| Therapists, Places (clinics, helplines, groups) | `app/therapists.tsx`, `app/places.tsx` |
| Voice therapy, Blog, Community | `app/voice-therapy.tsx`, `app/blog.tsx`, `app/community.tsx` |
| Design system | `components/ui/*`, `lib/theme.ts` |
| Local storage | `lib/storage.ts` |

## Run the app

```sh
npm install
npm start          # Expo DevTools
npm run ios        # iOS simulator (needs Xcode)
npm run android    # Android emulator
npm run web
```

## Run the chatbot API locally

```sh
# 1. Get a free Groq key: https://console.groq.com/keys
echo "GROQ_API_KEY=gsk_..." > .env

# 2. Run the Vercel dev server (proxies api/chat.ts on localhost:3000)
npx vercel dev
```

Point the app at it during development:

```sh
EXPO_PUBLIC_API_URL=http://localhost:3000 npm start
```

## Deploy the chatbot API to Vercel

```sh
npx vercel link
npx vercel env add GROQ_API_KEY   # production + preview
npx vercel deploy --prod
```

Then update `app.json > expo.extra.apiBaseUrl` to your Vercel URL.

## Guardrails

The Groq function in `api/chat.ts` enforces:

- A strong mental-health system prompt (no diagnosis, no medication advice,
  no method-of-harm responses, no impersonation, no prompt-leak).
- Pre-flight regex screen for crisis signals — short, steady reply with SOS
  resources and no probing questions.
- Hard refusal layer for prompt-injection and harmful method requests.
- Server trims to last 16 turns and clamps each message to 4 KB to bound
  context and cost.
- Client-side `lib/chat.ts` runs the same crisis regex so the SOS banner
  appears even before the server responds.

## Privacy posture

Every mood log, journal entry, check-in, and chat history line is stored
locally with `AsyncStorage`. Nothing syncs to a backend by default. The
chat endpoint receives only the conversation text; no identifiers are
attached. The user can erase everything from `Profile → Erase all my data`.
