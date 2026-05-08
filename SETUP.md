# Setup checklist

Authoritative state of identifiers and what's wired vs. still manual.

## Bundle / package identifier

`com.rodriguescarson.coco` — used everywhere consistently.

| Surface | Status |
|---|---|
| Expo `app.json` → `ios.bundleIdentifier` | ✅ |
| Expo `app.json` → `android.package` | ✅ |
| Firebase iOS app (id `1:522896815441:ios:12d7392fe869a7a7a8cf70`) | ✅ |
| Firebase Android app (id `1:522896815441:android:d629e3148f5ba8afa8cf70`) | ✅ |
| `GoogleService-Info.plist` BUNDLE_ID | ✅ |
| `google-services.json` package_name | ✅ |
| Apple Developer App ID with Sign in with Apple capability | ⚠️ **manual — see below** |

## Firebase

| Item | Status | Where |
|---|---|---|
| Project | ✅ `coco-sih`, us-central, native Firestore |
| Anonymous auth | ✅ enabled |
| Email/password auth | ✅ enabled |
| Google auth | ✅ enabled |
| Apple auth | ✅ enabled (provider toggle); needs Apple Service ID for prod |
| Firestore security rules | ✅ deployed (`firestore.rules`) |
| Web app | ✅ `1:522896815441:web:6e29e18ad700b390a8cf70` |
| iOS app | ✅ `1:522896815441:ios:12d7392fe869a7a7a8cf70` |
| Android app (new) | ✅ `1:522896815441:android:d629e3148f5ba8afa8cf70` |
| Android SHA-1 fingerprint (debug) | ⚠️ add after first dev build |
| Android SHA-1 fingerprint (release) | ⚠️ add before Play Store |

## Google OAuth (auto-created by Firebase)

| Client | ID | Status |
|---|---|---|
| Web | `522896815441-s2bvu8ng4kc4qvpulrcu7au1bia33d2e.apps.googleusercontent.com` | ✅ in `app.json` extra |
| iOS | `522896815441-5as5ihtg0sll3cduopqcop1f43phub0b.apps.googleusercontent.com` | ✅ in `app.json` extra; URL scheme registered in `infoPlist.CFBundleURLTypes` |
| Android | needs SHA-1 to generate | ⚠️ create after `npx expo run:android` produces a debug SHA-1 |

## What you still need to do manually

### 1. Apple Developer Console (paid Apple Developer account needed)

Apple Team ID: `AT45DRFG4P` (already wired in `app.json` → `ios.appleTeamId`).

For Apple Sign-In to work end-to-end on a real device, the App ID
`com.rodriguescarson.coco` needs the **Sign In with Apple**
capability turned on.

> ⚠️ The App ID `com.rodriguescarson.coco` already exists on this
> account from a previous Coco submission. **Do not try to recreate
> it** — Apple will refuse with "The App ID 'AT45DRFG4P.com.rodriguescarson.coco'
> appears to be in use by the App Store, so it can not be removed".
> Edit the existing one instead.

1. https://developer.apple.com/account/resources/identifiers/list
2. Filter dropdown → **App IDs**
3. Find `com.rodriguescarson.coco` and click it (or use the deep
   link `https://developer.apple.com/account/resources/identifiers/bundleId/edit?bundleId=com.rodriguescarson.coco`)
4. In Capabilities, tick **Sign In with Apple** → **Save**

Optional but recommended for a polished setup:

- **+ Service ID** with description "Coco Apple Sign-In"
- Identifier: `com.rodriguescarson.coco.apple`
- Configure: domain `coco-sih.firebaseapp.com`, return URL `https://coco-sih.firebaseapp.com/__/auth/handler`

The `expo-apple-authentication` plugin (now in `app.json`) wires the
`com.apple.developer.applesignin` entitlement automatically when you
prebuild, so once the App ID has the capability ticked Apple will
issue tokens with `aud = com.rodriguescarson.coco`.

### 2. Build a dev client (Apple Sign-In does **not** work in Expo Go)

Inside Expo Go the ID token always carries `aud = host.exp.Exponent`
which Firebase rejects. Switch to a dev build:

```sh
cd /Users/carson/Projects/coco

# Local — fastest, free, runs on your simulator/device
npx expo prebuild --clean
npx expo run:ios            # for simulator
npx expo run:ios --device   # for a connected iPhone

# OR cloud — works for sharing, doesn't need Xcode:
eas build --profile development --platform ios
# then install via the link EAS gives you
```

After this builds, the binary carries `com.rodriguescarson.coco`,
Firebase accepts the Apple token, and Sign In with Apple works.

### 3. Android SHA-1 (after first Android build)

After you run `npx expo run:android` once, grab the debug SHA-1:

```sh
keytool -keystore ~/.android/debug.keystore -list -v \
  -alias androiddebugkey -storepass android | grep SHA1
```

Then:
1. https://console.firebase.google.com/project/coco-sih/settings/general → Coco Android → Add fingerprint → paste it
2. Re-run `firebase apps:sdkconfig ANDROID 1:522896815441:android:d629e3148f5ba8afa8cf70 --project coco-sih --out ./google-services.json` to refresh the local file
3. Note the auto-created Android OAuth client at https://console.cloud.google.com/apis/credentials?project=coco-sih and paste its id into `app.json` → `extra.googleClientIdAndroid`

For the Play Store, repeat with the release SHA-1 from your upload key.

### 4. Per-platform Firebase config (committed)

`GoogleService-Info.plist` and `google-services.json` are checked
into the repo. Per Firebase docs, the values inside are non-secret
per-project identifiers — security is enforced by Firestore rules
and the auth providers, not by hiding the config. EAS Build needs
them at native prebuild time so committing is the simplest path.

If you ever swap to a different Firebase project, regenerate via:

```sh
npx firebase apps:sdkconfig IOS 1:522896815441:ios:12d7392fe869a7a7a8cf70 \
  --project coco-sih --out ./GoogleService-Info.plist

npx firebase apps:sdkconfig ANDROID 1:522896815441:android:d629e3148f5ba8afa8cf70 \
  --project coco-sih --out ./google-services.json
```
