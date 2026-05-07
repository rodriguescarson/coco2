# Coco — Store Listing Cheatsheet

Single source of truth for App Store Connect + Google Play Console copy
and asset paths. Update here, not in the consoles.

---

## Identity

| Field | Value |
|---|---|
| Name | Coco |
| Tagline | A quiet companion for your mind |
| Bundle ID (iOS) | com.rodriguescarson.coco |
| Package (Android) | com.rodriguescarson.coco |
| Category (primary) | Health & Fitness |
| Category (secondary) | Lifestyle |
| Content rating | 12+ (mental-health discussion, crisis resources) |
| Pricing | Free |

---

## Short copy

**Subtitle / short description (30 chars iOS, 80 chars Android)**

> A quiet space for your mind.

**Promotional text (170 chars iOS)**

> Mood, journal, breathing, sleep, daily check-ins, an AI listener, and a worldwide directory of crisis support — all in one calm app.

**Long description**

> Coco is a quiet companion for your mind. Track how you feel, breathe through the hard parts, and talk to Coco when you need someone to listen.
>
> What's inside:
> • Talk to Coco — an AI listener trained to reflect, not advise. Crisis-aware: surfaces hotlines automatically when something serious comes up.
> • Daily check-ins with streaks, gentle prompts that change every day.
> • Mood tracker with weekly trends.
> • Journal with prompts you can shuffle, kept private and on-device unless you sign in to sync.
> • Breathing exercises with an animated guide — Box, 4-7-8, Coherent, Physiological Sigh.
> • Grounding 5-4-3-2-1 for the moments that pull you under.
> • Meditation library and sleep sounds.
> • Therapy bookings — browse vetted clinicians, pick a slot, hold a session.
> • Places & people directory — clinics, helplines, support groups, wellness centres worldwide.
> • Crisis SOS — one tap to local hotlines plus a guided grounding tool.
>
> Privacy-first: everything is stored on your device until you explicitly sign in. Even then, Coco only syncs encrypted data under your account, never to advertisers, never sold.
>
> Coco started life as the Green Ribbon Army's submission to Smart India Hackathon 2022. It is the part of that work I refused to let go.

**Keywords (iOS, comma-separated, 100 chars)**

> mood,journal,breathing,meditation,sleep,anxiety,therapy,wellness,mindfulness,calm

---

## Assets

| Use | Path | Size | Alpha allowed |
|---|---|---|---|
| iOS App Store icon | `assets/store/ios-app-icon-1024.png` | 1024×1024 | NO |
| iOS launch icon (in-app) | `assets/icon.png` | 1024×1024 | yes |
| Android Play Store icon (hi-res) | `assets/store/play-icon-512.png` | 512×512 | yes |
| Android adaptive icon foreground | `assets/adaptive-icon.png` | 1024×1024 | yes |
| Android adaptive icon background | hex `#0E8A5F` (in app.json) | — | — |
| Android feature graphic | `assets/store/play-feature-graphic.png` | 1024×500 | NO |
| Web favicon | `assets/favicon.png` | 196×196 | yes |
| Splash screen logo | `assets/splash-icon.png` | 600×600 | yes |
| Source SVGs (editable) | `assets/source/*.svg` | vector | — |

---

## Screenshots — what you still need to capture

The stores want device-frame screenshots that show real screens. These
need to be captured against a running build. Required minimums:

### iOS App Store Connect (per language)

| Device | Pixels | Min count | Recommended count |
|---|---|---|---|
| iPhone 6.9" (16 Pro Max) | 1320×2868 | 3 | 5–8 |
| iPhone 6.5" (11 Pro Max / etc) | 1284×2778 | 3 (only if no 6.9") | — |
| iPad 13" (Pro M4) | 2064×2752 | only if you ship iPad | 3 |

### Google Play Console

| Device | Pixels | Min count | Recommended count |
|---|---|---|---|
| Phone | 1080×1920 (or 9:16) | 2 | 4–8 |
| Feature graphic | 1024×500 | 1 (provided) | 1 |
| 7" tablet | optional | — | — |
| 10" tablet | optional | — | — |

### Suggested screenshot scenes (in order)

1. Home dashboard with hero check-in card and mood picker.
2. Coco chat — show a warm assistant reply, the "Get support now" SOS chip visible.
3. Breathing screen mid-cycle (animated orb at full inhale, label reading "Inhale").
4. Mood tracker with the weekly bar graph filled in.
5. Therapist booking — calendar + selected time slot + "Confirm" button.
6. Places directory filtered to "Crisis" with a Call button visible.
7. Your activity dashboard showing time-spent bars.

Tip: capture on the iOS Simulator with Cmd+S after `npx expo run:ios`,
and on Android Emulator with the snapshot button. Names: `screenshot-01.png` … `screenshot-08.png`.

---

## Permissions you'll need to declare

| Permission | Why | Where in code |
|---|---|---|
| Microphone (iOS) | Anonymous voice journaling | future feature; declared in `app.json` |
| Network access (Android) | API calls to Vercel + Firestore | INTERNET, ACCESS_NETWORK_STATE in `app.json` |
| Vibrate (Android) | Haptic feedback | VIBRATE in `app.json` |
| App Tracking Transparency (iOS) | Not used. Declared dummy text in case Apple flags. | NSUserTrackingUsageDescription |

No location, no contacts, no calendar, no photos.

---

## Build commands

```sh
# Production iOS build (uploads to App Store Connect)
eas build -p ios --profile production
eas submit -p ios --latest

# Production Android build (uploads to Play Console)
eas build -p android --profile production
eas submit -p android --latest
```

Set up `eas.json` first via `eas build:configure`. The bundle identifiers
are already set in `app.json`.

---

## Privacy disclosures

For App Store privacy "nutrition labels" and Play Store data-safety:

| Data type | Collected | Linked to identity | Tracking | Purpose |
|---|---|---|---|---|
| Email address | optional (sign-in) | yes | no | Auth |
| User ID | yes (Firebase uid) | yes | no | Auth, sync |
| Coarse age range | optional | yes | no | Personalization |
| Gender | optional | yes | no | Personalization |
| Country | optional | yes | no | Local hotline matching |
| Mood logs | yes (only if signed in) | yes | no | App functionality |
| Journal entries | yes (only if signed in) | yes | no | App functionality |
| Crash data | no | — | — | — |
| Diagnostics | yes (event names + durations only) | yes | no | App improvement |

Encryption at rest: Firestore default (Google-managed keys).
Encryption in transit: HTTPS to Firebase + Vercel.
Data deletion: in-app under Profile → Erase all my data.

Privacy policy URL: https://carsonrodrigues.com/coco/privacy (TODO)
Support URL: https://github.com/rodriguescarson/coco2/issues
