# App Store resubmission — Coco 1.0 (build 11)

Submission ID: d247b1ca-8567-4b3d-8948-ddbcd03880ff

Four issues were raised on 4 June 2026. Below: what was changed, plus copy-paste
text for App Store Connect and the reply to App Review.

---

## ① 1.4.1 — Add medical disclaimer to the app **description**

This is a metadata change in App Store Connect → App Information / Version → Description.
Append the following paragraph to the end of the description:

> **Important:** Coco offers educational wellness content and supportive conversation. It is not a medical device and does not provide medical diagnosis or treatment, and it is not a substitute for professional care. Always seek the advice of a doctor or licensed clinician about any medical condition or before making medical decisions. If you are in crisis, contact your local emergency number or a crisis line — the in-app SOS screen lists several.

(An equivalent disclaimer now also appears in-app: onboarding, the Articles screen,
each article, and the Breathe tool.)

---

## ② 1.4.1 — Citations for medical/health information  (CODE — done)

- Every article now opens to a full read with a tappable **Sources** list
  (APA, NHS, CDC, AASM, WHO, Stanford Medicine / Cell Reports Medicine, Pennebaker, etc.).
- Breathing tools now show a **Sources** link for the selected technique (Cleveland Clinic, NIH/NCCIH, the Stanford cyclic-sighing study) and unsourced/absolute claims were softened ("Used by Navy SEALs", "fastest way", "resets your nervous system" → cited, measured language).
- A medical disclaimer footer appears on Articles and Tools.

In the reply, point the reviewer to: **Connect tab → Articles & guides → open any article → Sources**, and **Tools → Breathe → select a pattern → Sources**.

---

## ③ 2.1(a) — "Articles buttons did not display the full texts"  (CODE — done)

Root cause: the article cards were not tappable and there was no detail screen — they
were summary stubs. Added a full article reader (`app/blog/[id].tsx`); tapping any
article card now opens the complete text plus its sources.

---

## ④ 5.1.1(i) / 5.1.2(i) — Third-party AI disclosure & consent  (CODE + metadata — done)

The AI companion and voice journaling use **Groq, Inc.** (groq.com) to generate replies
and transcribe audio. We added:

- A **first-use consent gate** on the Coco chat and on Voice journaling. Nothing is sent
  to Groq until the user taps "I agree — start". The gate states what is sent (typed
  messages + first name if set; recorded audio), who it goes to (Groq, Inc.), and what is
  not sent, and links to the Privacy Policy and to Groq.
- Consent can be withdrawn anytime in **You → Privacy**.
- The Privacy screen now accurately names Groq and links the Privacy Policy.
- A Privacy Policy hosted at **https://coco.carsonrodrigues.com/privacy** that identifies
  the data collected, how it is collected, all uses, and the third-party AI sharing
  (with retention details and Groq's equal-protection commitment).

**App Store Connect to-dos:**
1. Set the **Privacy Policy URL** to `https://coco.carsonrodrigues.com/privacy`
   (App Information → Privacy Policy URL). Publish `docs/privacy.html` at that URL first.
2. In **App Review Information → Notes**, paste the reply below.

---

## Reply to paste into App Store Connect

> Thank you for the detailed review. We've addressed all four items in build 12:
>
> **1.4.1 (disclaimer):** We added a medical disclaimer to the app description reminding
> users that Coco is not a substitute for professional care and to consult a doctor before
> making medical decisions. The same disclaimer also appears in-app (onboarding, Articles,
> and the Breathe tool).
>
> **1.4.1 (citations):** All health/wellness information is now cited with tappable links to
> sources. To see this: Connect tab → "Articles & guides" → open any article → "Sources"; and
> Tools → "Breathe" → select a technique → "Sources". Sources include the APA, NHS, CDC,
> the American Academy of Sleep Medicine, WHO, Cleveland Clinic, NIH/NCCIH, and Stanford
> Medicine's cyclic-sighing study.
>
> **2.1(a) (articles bug):** Article cards were not opening a full reading view. We fixed
> this — tapping any article now opens the complete text plus its sources.
>
> **5.1.1(i) / 5.1.2(i) (third-party AI):** Coco's AI companion and voice journaling use
> Groq, Inc. (groq.com) to generate replies and transcribe audio. The app now shows a
> consent screen the first time you open the Coco chat or Voice journaling. It discloses
> exactly what is sent (the messages you type and your first name if set; for voice, the
> audio you record), names the recipient (Groq, Inc.), and requires the user to tap
> "I agree — start" before anything is transmitted. To review the permission request:
> open the Coco tab (center button) on a fresh install — the consent screen appears before
> the first message. Consent can be withdrawn in You → Privacy. Our Privacy Policy
> (https://coco.carsonrodrigues.com/privacy) identifies the data collected, how it is
> collected, all uses, and the third-party AI sharing with retention details.
>
> Please let us know if anything else would help.
