# Coco — App Store & Play Store release runbook

Everything in `app.json` / `eas.json` is store-ready. What's left are the
one-time human steps that need accounts, keys, and console access — they can't
be done from code.

## 0. Prerequisites (one time)

- Logged into EAS: `npx eas-cli whoami` → should print `rodriguescarson`.
- Apple Developer Program membership ($99/yr) for iOS.
- Google Play Developer account ($25 one time) for Android.
- Local toolchain (already verified on this machine): Xcode + CocoaPods +
  fastlane (iOS), JDK 17 + Android SDK (Android).

## 1. Firebase config files

Coco uses Firebase for auth and backend services. The following files must be
present at the project root before any build — they are committed intentionally
(they contain non-secret per-project identifiers, per Firebase docs):

- `GoogleService-Info.plist` — iOS
- `google-services.json` — Android

If either file is missing, builds will fail at the native prebuild step.

## 2. Building

`appVersionSource` is `remote` — EAS owns the version/build numbers and
auto-increments on each production build, so you never bump them by hand.

### Cloud (recommended)
```
npm run build:android      # → .aab on EAS servers
npm run build:ios          # → .ipa on EAS servers
```

### Local (this machine has the full toolchain)
```
npm run build:android:local   # → ./build/coco.aab
npm run build:ios:local       # → ./build/coco.ipa  (needs signing creds)
```

First iOS build will ask to generate a Distribution Certificate + provisioning
profile — let EAS manage them (answer yes). The same credentials are reused by
cloud and local builds.

> **iOS local build in a non-interactive shell (CI / background):** the build
> can stop on interactive prompts and fail if stdin isn't a TTY (piping `yes`
> does **not** work). Use `--non-interactive` to skip optional setup steps:
> ```
> npx eas-cli build --platform ios --profile production --local \
>   --output ./build/coco.ipa --non-interactive
> ```
> Note: Coco's `app.json` has no `aps-environment` entitlement (no
> `expo-notifications`), so the "Would you like to set up Push Notifications?"
> prompt will not appear. The `--non-interactive` flag is still a safe default
> for unattended runs.

> **Version numbers:** both stores reject a build/version that already exists,
> so always build fresh before (re-)submitting. EAS auto-increments on each
> build: Android `versionCode` and iOS `buildNumber` advance independently.

## 3. iOS — App Store Connect

- App: bundle id `com.rodriguescarson.coco`, name "Coco"
- Numeric App ID: `6773467656`
- ASC API key: `credentials/AuthKey_95P9D8959L.p8` (key ID `95P9D8959L`,
  issuer `3a0248cc-5c1d-4eeb-813d-82e19a9cf785`) — already configured in
  `eas.json` → `submit.production.ios` and `fastlane/Fastfile`.

Submit. Two interchangeable paths upload the same `build/coco.ipa`:
- **EAS:** `npm run submit:ios` (uses `eas.json` → `submit.production.ios`).
- **fastlane:** `fastlane ios beta` (run from the project root). Lane defined
  in `fastlane/Fastfile`; uploads to TestFlight with the ASC API key, then
  stops (`skip_submission` — does not auto-submit for App Store review).

## 4. Android — Google Play

- Package: `com.rodriguescarson.coco`
- Service account key: `credentials/service-account-key.json` — already
  configured in `eas.json` → `submit.production.android` and `fastlane/Fastfile`.

The first upload to Play must be done manually in the console to accept the
app-signing terms; after that either path uploads `build/coco.aab` to the
internal track:
- **EAS:** `npm run submit:android` (uses `eas.json` → `submit.production.android`).
- **fastlane:** `fastlane android internal` (run from the project root). Lane
  defined in `fastlane/Fastfile`; uploads via the service account, metadata and
  images skipped (manage those in the console).

Promote internal → closed → production from the Play Console once tested.

Check track state read-only anytime:
```
node scripts/check_play_access.mjs credentials/service-account-key.json com.rodriguescarson.coco
```

## 5. Store listing assets you'll still need (uploaded in the consoles, not code)

- iOS screenshots: 6.7" (1290×2796) and 6.5" (1242×2688) minimum.
- Android screenshots: phone (min 2), 1024×500 feature graphic, 512×512 icon.
- Privacy policy URL (required by both stores), support URL.
- App Store privacy "nutrition label" + Play **Data safety** form. The app
  collects account data, journal/mood entries, and voice recordings. See
  `fastlane/datasafety/coco_datasafety.csv` for the Play data-safety answers.

## 6. Notes / decisions baked into config

- **Firebase:** `google-services.json` and `GoogleService-Info.plist` are
  committed at the project root and referenced in `app.json` — required for
  native prebuild.
- **Push notifications:** not yet enabled. No `aps-environment` entitlement,
  no `expo-notifications` dependency. Add `expo-notifications` and the
  entitlement in `app.json` when you're ready, then re-run `eas build`.
- **Android keystore (local builds):** configured in `credentials.json`,
  stored at `credentials/coco-dev.keystore` (gitignored). Cloud builds use
  EAS-managed credentials (no `credentialsSource: local` on iOS; Android
  production uses `credentialsSource: local` via `credentials.json`).
- **OTA updates:** `appVersionSource: remote`; ship JS-only fixes with
  `eas update --channel production` without a new store build.
