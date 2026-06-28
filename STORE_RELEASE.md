# Store Release — coco

How to build and ship this app to the **App Store** (iOS) and **Google Play** (Android)
with fastlane. Signing is unattended via the App Store Connect API key (`.p8`) and the
Android keystore — no interactive Apple/Google login needed.

> Run everything from the project root:
> ```bash
> cd ~/Projects/coco
> ```

## App specifics
| | |
|---|---|
| iOS scheme / workspace | `Coco` / `ios/Coco.xcworkspace` |
| iOS bundle id | `com.rodriguescarson.coco` |
| Android package | `com.rodriguescarson.coco` |
| ASC API key (.p8) | `credentials/AuthKey_95P9D8959L.p8` (key id `95P9D8959L`) |
| Play service account | `credentials/service-account-key.json` |
| Android keystore | coco-dev keystore wired via android/gradle.properties (COCO_* props) — fully self-contained |
| Current version | `1.0.1` |

---

## iOS

```bash
# 1. (Expo CNG apps) regenerate the native project + CocoaPods.
#    Skips on bare projects that commit ios/. Fixes the stale-Pods
#    "PrivacyInfo.xcprivacy ... no such file" build error.
npx expo prebuild --clean -p ios

# 2. Build a signed .ipa and upload to TestFlight (skip_submission).
fastlane ios release          # = build + upload to TestFlight

# 3. Submit the uploaded build to App Store review (manual release after approval).
fastlane ios submit_review
```

**Version / build-number rules (App Store Connect):**
- If you see `Invalid Pre-Release Train. The train version 'X' is closed`, that
  version is already released — **bump the marketing version** in `app.json` /
  `app.config.ts` (and the Info.plist) to a new value, then rebuild.
- If you see `The bundle version must be higher than the previously uploaded version: N`,
  set `CFBundleVersion` (build number) above N.
- First-ever submission requires a **complete App Store listing** (description,
  keywords, screenshots per device size, support/privacy URLs, age rating). Create it
  in App Store Connect once; after that `submit_review` works directly.
- `submit_review` uploads only release notes from a clean dir; it does **not** touch
  your existing listing/screenshots, and sets export-compliance (non-exempt encryption = false).

---

## Android (Google Play — production)

```bash
# 1. (Expo CNG apps) generate the native android project.
npx expo prebuild --clean -p android

# 2. Ensure release signing is wired (see "Android keystore" above):
#    credentials/keystore.properties must contain
#      storeFile=<path-to-keystore>   storePassword=...   keyAlias=...   keyPassword=...
#    and android/app/build.gradle's release buildType uses signingConfigs.release.

# 3. Build the signed .aab.
fastlane android build        # -> ./build/<app>.aab  (or ./android/app/build/outputs/bundle/release/app-release.aab)

# 4. Upload to the Play production track (as a draft you publish from the console).
fastlane android production   # if defined; otherwise:
fastlane run upload_to_play_store package_name:com.rodriguescarson.coco \
  json_key:credentials/service-account-key.json \
  aab:android/app/build/outputs/bundle/release/app-release.aab \
  track:production release_status:draft \
  skip_upload_apk:true skip_upload_metadata:true skip_upload_changelogs:true \
  skip_upload_images:true skip_upload_screenshots:true
```

**Android rules:**
- `Version code N has already been used` → bump `versionCode` in `android/app/build.gradle`
  (and `app.config.ts`) above N.
- `The Android App Bundle was signed with the wrong key` → you signed with the wrong
  keystore. The app's real upload key is **EAS-managed**. Fetch it:
  `eas credentials` → Android → *Download existing keystore*, then point
  `keystore.properties` at it (match the alias + passwords it prints).
- A brand-new Play app needs its **listing + content rating** created in the Play
  Console before the first production upload is accepted.

---

## Prerequisites
- `fastlane` and Xcode installed; Android needs JDK 17 + the Android SDK.
- `credentials/AuthKey_95P9D8959L.p8` and `credentials/service-account-key.json` present (gitignored).
- Free disk: iOS builds accumulate large DerivedData/Archives — clear with
  `rm -rf ~/Library/Developer/Xcode/DerivedData/* ~/Library/Developer/Xcode/Archives/*`.
- These lanes upload **drafts / to review** — nothing auto-releases to the public; you
  do the final publish from App Store Connect / Play Console.

---

## Release status — 2026-06-28 (growth rollout)

**Merged to `main` (ship on the next build):**
- Smart review prompt (after a breathing session) — PR #7
- Shareable gentle streak card — PR #8
- Gentle referral loop (Firestore) — PR #9. `firestore.rules` **DEPLOYED** to `coco-sih`.
- ASO listing optimized — `STORE_LISTING.md`; push Android metadata with `node scripts/push_listing.mjs`.

Backend is live; client features activate with the new build.

---

## Ship the growth build — verified commands (2026-06-28)

Local EAS build (no cloud credits) → Play internal / TestFlight (draft). Coco uses
`autoIncrement: true`, so versionCode/buildNumber bump automatically from the store.
Run on a Mac with Java 17 + Android SDK + Xcode, `eas whoami` logged in, ~50 GB free
disk (clear `~/Library/Developer/Xcode/DerivedData` if low).

```
EAS_NO_VCS=1 npx eas build --platform android --profile production --local --output ./build/coco.aab
npx eas submit --platform android --profile production --path ./build/coco.aab    # → Play internal (draft)

EAS_NO_VCS=1 npx eas build --platform ios --profile production --local --output ./build/coco.ipa
npx eas submit --platform ios --profile production --path ./build/coco.ipa         # → TestFlight
```
Ships: review prompt (#7), share card (#8), referral loop (#9). Firestore rules already deployed.
