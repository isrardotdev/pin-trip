# Release Signing — WanderPin Android

## What exists

| File | Tracked in git? | Purpose |
|---|---|---|
| `app/release.keystore` | **No** (gitignored) | The upload key. RSA 4096, alias `wanderpin-upload`, valid ~27 years. |
| `keystore.properties` | **No** (gitignored) | Store/key passwords, read by `app/build.gradle` at configure time. |
| `app/debug.keystore` | Yes | Shared throwaway debug key. Unchanged. |

`app/build.gradle` loads `keystore.properties` if present and signs `release` with it.
If the file is missing (fresh clone, CI without secrets) it falls back to debug
signing rather than failing the build — so **always confirm the signer** before
uploading anything. See "Verify before upload" below.

## Back this up NOW

Copy **both** `app/release.keystore` and `keystore.properties` somewhere outside
this repo — a password manager entry or encrypted cloud folder. They are not in
git, so a lost laptop loses them.

The password is in `keystore.properties`:

```bash
cat apps/mobile/android/keystore.properties
```

## What losing the keystore actually costs

Because this is an **upload key** and Play App Signing holds the real app signing
key, losing it is recoverable: you can request an upload-key reset in the Play
Console and Google issues a new one. Annoying, not fatal.

That safety net only exists if Play App Signing is enabled (it is by default for
all new apps). If you ever opt out, this keystore becomes irreplaceable and
losing it means never updating the app again under the same listing.

## Building

```bash
cd apps/mobile/android

# AAB for Play — this is what you upload
./gradlew bundleRelease
# → app/build/outputs/bundle/release/app-release.aab

# Universal APK for sideload testing
./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

Avoid `./gradlew clean`. With the new architecture enabled it wipes the generated
codegen directories inside library modules, and CMake configures before codegen
regenerates them — the build fails with
`add_subdirectory given source .../codegen/jni/ which is not an existing directory`.
If it happens, recover with:

```bash
./gradlew generateCodegenArtifactsFromSchema assembleRelease
```

## Verify before upload

```bash
APKSIGNER=$(find ~/Library/Android/sdk/build-tools -name apksigner | sort -V | tail -1)
$APKSIGNER verify --print-certs app/build/outputs/apk/release/app-release.apk
```

The SHA-1 must match the upload key below — **not** the debug key
`5e8f1606...`, which Play rejects.

Upload key SHA-1 / SHA-256: see `keytool -list -v -keystore app/release.keystore`.

## Google Sign-In

Google Sign-In matches the signing certificate's SHA-1 against the Android OAuth
client. Three fingerprints may need registering in the Google Cloud console:

1. **Debug key** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` — local test builds
2. **Upload key** — from `release.keystore`, for APKs you sideload from a release build
3. **Play app signing key** — shown in Play Console → Setup → App signing, **after** the first upload

Miss #3 and Google Sign-In fails with `DEVELOPER_ERROR` for everyone who installs
from the Play Store, while working fine on your sideloaded build. This is the most
common post-launch break — register it as soon as the first AAB is uploaded.

## Version codes

`app/build.gradle` hardcodes `versionCode 1` / `versionName "1.0.0"`. Local Gradle
builds do not auto-increment (the `appVersionSource: "remote"` + `autoIncrement`
settings in `eas.json` only apply to EAS builds). Play rejects a versionCode that
has already been used, so bump it manually for each upload — and keep
`profile.tsx`'s hardcoded version string in sync.
