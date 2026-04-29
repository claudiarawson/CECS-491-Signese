## Goal
Have **Signese** install and run on your iPhone like a normal app (no laptop, no same-WiFi Expo Go), while still using the **hosted backend** and allowing easy updates later.

This uses:
- **EAS Development Build** (installed once on device)
- **EAS Update** later (push JS/UI updates without reinstalling)

---

## What you need today (15–45 min)

### 1) Host the translation backend (required for “no hassle”)
Your phone must be able to reach the inference server over the internet.

- Deploy your FastAPI inference server to a public host (Render / Fly.io / Railway / AWS / GCP).
- Confirm a stable URL like `https://your-backend.example.com`.
- Confirm from your phone browser that a health endpoint works (whatever your API exposes).

Then set it in `eas.json` (all profiles):
- `EXPO_PUBLIC_TRANSLATE_INFERENCE_URL=https://YOUR_BACKEND_HOST_HERE`

### 2) Install EAS CLI and log in
On your laptop:

```bash
npm i -g eas-cli
eas login
```

### 3) Initialize EAS (creates the Expo project linkage)
From `signese/`:

```bash
eas init
```

### 4) Build and install an iOS dev build
From `signese/`:

```bash
eas build --platform ios --profile development
```

- Install the build on your iPhone from the EAS link.
- The app will now launch from your home screen like a normal app.

---

## After the demo (to move toward “commercial app”)

### A) Switch from dev build → TestFlight
When you’re ready:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

This gets you TestFlight installs (and eventually App Store).

### B) Enable OTA updates for UI/content
Once your team is iterating frequently, use EAS Update:

```bash
eas update --channel preview --message "Update dictionary content and UI"
```

### C) Backend hardening (recommended)
- Add `/health` endpoint
- Add request timeouts + friendly “Backend offline” UI
- Add logging/metrics so demo failures are diagnosable

---

## Notes / gotchas
- `app.json` includes demo identifiers:
  - iOS bundle id: `com.signese.demo`
  - Android package: `com.signese.demo`
  Change these to your official ids before App Store/Play Store.
- If `expo start` prompts for ports, run it with an explicit port:

```bash
npx expo start --port 8082
```

