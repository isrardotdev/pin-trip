# Social Login — Implementation Guide

Branch: `social-login-implementation`

---

## What Was Implemented

### Backend
- **`OAuthAccount` model** — new Prisma table linking a user to one or more social providers. Stores `provider` ("apple" | "google"), `providerId` (the sub from the token), and optional `email`. Migration `add_oauth_accounts` has been applied.
- **`passwordHash` made nullable** — users who sign up via social login have no password. Email/password login returns a clear error if the account is social-only.
- **`POST /auth/apple`** — receives Apple's `identityToken` from the device, verifies the RS256 signature using Apple's public JWKS (`https://appleid.apple.com/auth/keys`), validates issuer + audience, finds/creates the user, returns a PinTrip JWT.
- **`POST /auth/google`** — receives a Google `idToken` from the device, verifies it using `google-auth-library`, extracts email/name/avatar, finds/creates the user, returns a PinTrip JWT.
- **3-step account linking logic** (both providers share this):
  1. Look up `OAuthAccount` by `(provider, providerId)` → found = return existing user
  2. Look up `User` by email → found = link this provider to the existing account (merges email/password + social)
  3. Neither found = create new user + OAuthAccount
- **New packages added:** `jwks-rsa`, `google-auth-library`

### Mobile
- **`expo-apple-authentication`** and **`@react-native-google-signin/google-signin`** installed
- **`app.json`** — both packages added as Expo plugins. Google plugin needs your reversed iOS Client ID (placeholder currently in place).
- **`authStore.ts`** — two new actions: `loginWithApple` and `loginWithGoogle`. Google SDK configured at module level.
- **`welcome.tsx`** — redesigned CTA section:
  - Native Apple Sign In button (iOS only, shown only if available)
  - Google Sign In button (white, branded)
  - "or" divider
  - "Continue with email" text link (fallback to existing login/register screens)

---

## What You Need to Do

### Google Cloud Console
- [ ] Create a project called "PinTrip"
- [ ] Set up OAuth consent screen (External, scopes: email, profile, openid)
- [ ] Create three OAuth Client IDs:
  - **iOS** — Bundle ID: `app.pintrip.mobile`
  - **Android** — Package: `app.pintrip.mobile` (add SHA-1 fingerprint later via `eas credentials`)
  - **Web** — gives you the Web Client ID + Secret used for backend verification
- [ ] Save the **iOS Client ID** and **Web Client ID**

### Apple Developer ($99/year account required)
- [ ] Go to Certificates, Identifiers & Profiles → Identifiers
- [ ] Register App ID with Bundle ID: `app.pintrip.mobile`
- [ ] Enable the **Sign In with Apple** capability
- [ ] Note your **Team ID** from the Membership tab
- [ ] No private key needed — native flow uses Apple's public JWKS

### Environment Variables

**`apps/backend/.env`** — add these two lines:
```
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
APPLE_BUNDLE_ID=app.pintrip.mobile
```

**`apps/mobile/.env`** — add these two lines:
```
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

### `app.json` — one placeholder to replace
Find this line:
```
"iosUrlScheme": "com.googleusercontent.apps.REPLACE_WITH_REVERSED_IOS_CLIENT_ID"
```
Replace with your reversed iOS Client ID. If your iOS Client ID is `123456789-abc.apps.googleusercontent.com`, the reversed form is:
```
com.googleusercontent.apps.123456789-abc
```

---

## Steps to Go Live

1. **Complete the Google Cloud Console setup** (above) — takes ~10 min
2. **Update both `.env` files** with your credentials
3. **Update `app.json`** with the reversed iOS Client ID
4. **If you have the Apple Developer account** — register the App ID and enable Sign In with Apple
5. **Trigger an EAS dev build** — social login requires a native build, it will not work in Expo Go:
   ```bash
   cd apps/mobile
   eas build -p ios --profile development
   # or for Android:
   eas build -p android --profile development
   ```
6. **Install the build on your device** and test:
   - Tap "Sign in with Google" → Google account picker appears → lands on map
   - Tap "Sign in with Apple" (iOS only) → Apple sheet appears → lands on map
   - Sign out → sign back in → same account, same pins
   - Register with email first, then sign in with Google using same email → should merge to same account

---

## Notes
- Apple Sign In button only renders on iOS and only when the device supports it (iOS 13+). On Android only Google + email are shown.
- Apple may return a relay email (e.g. `abc@privaterelay.appleid.com`) — this is normal and stored as-is.
- On the first Apple sign-in, the user's name is returned. On every subsequent sign-in Apple sends no name — this is expected, the name is stored on first sign-in only.
- The backend runs zero migrations on your local DB from this branch — the migration `add_oauth_accounts` must be re-applied when you merge: `npx prisma migrate deploy`
