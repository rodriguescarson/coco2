// Central place for legal / compliance constants so the same wording and URLs
// are used everywhere (consent gate, profile, onboarding, privacy policy).

export const PRIVACY_POLICY_URL = 'https://coco.carsonrodrigues.com/privacy';
export const TERMS_OF_SERVICE_URL = 'https://coco.carsonrodrigues.com/terms';

// Auto-renewable subscription disclosure shown next to the paywall purchase
// CTA. Required by the FTC, California's Automatic Renewal Law, Apple App Store
// Guideline 3.1.2, and Google Play. Keep this copy in sync across surfaces.
export const AUTO_RENEW_DISCLOSURE =
  'Auto-renewable subscription. It renews automatically at the price shown above unless canceled at least 24 hours before the end of the current period. Manage or cancel anytime in your store account settings.';

// The third-party AI processor Coco's features rely on. Apple Guideline
// 5.1.1(i) / 5.1.2(i) require us to name who data is sent to.
export const AI_PROVIDER_NAME = 'Groq, Inc.';
export const AI_PROVIDER_URL = 'https://groq.com';
export const AI_MODEL_LABEL = 'Llama 3.3 (via Groq)';

// Account deletion (Apple Guideline 5.1.1(v) + GDPR/CCPA deletion rights).
// Kept calm and non-alarming — Coco is a mental-wellness app.
export const DELETE_ACCOUNT_CONFIRM_TITLE = 'Delete account?';
export const DELETE_ACCOUNT_CONFIRM_BODY =
  'This permanently deletes your account and all the data synced to it — your moods, journals, check-ins, chats, bookings, and any circle posts. This cannot be undone.';
export const DELETE_ACCOUNT_REQUIRES_RECENT_LOGIN =
  'For your security, please sign out and sign back in, then try deleting your account again. This confirms it’s really you.';
export const DELETE_ACCOUNT_FAILED =
  'We couldn’t finish deleting your account just now. Please check your connection and try again.';

// Short medical disclaimer reused across educational/wellness content.
export const MEDICAL_DISCLAIMER =
  'Coco offers educational wellness content and supportive conversation. It is not a medical device and does not provide medical diagnosis or treatment. It is not a substitute for professional care — talk to a doctor or licensed clinician about any medical decision, and call your local emergency number in a crisis.';
