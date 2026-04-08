# Translate MVP Sign Pipeline

This module implements the first constrained isolated-sign recognition scaffold for Signese.

## Pre-Demo Checklist (Quick)

Run these in order:

1. Find your laptop LAN IP (use this value as `<LAN_IP>`):

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254*'
  } |
  Select-Object InterfaceAlias,IPAddress
```

2. Set `.env.local` in `signese`:

```env
EXPO_PUBLIC_TRANSLATE_INFERENCE_MODE=backend
EXPO_PUBLIC_TRANSLATE_INFERENCE_URL=http://<LAN_IP>:8000/predict
```

3. Start backend:

```powershell
cd signese
npm run inference:start
```

4. If npm script is unavailable, use fallback:

```powershell
cd signese
powershell -ExecutionPolicy Bypass -File .\ml\scripts\start_inference_api.ps1
```

5. Verify backend from laptop:

```powershell
Invoke-RestMethod -Uri "http://<LAN_IP>:8000/health"
```

6. Start Expo:

```powershell
cd signese
npx expo start -c --lan
```

7. Verify backend from phone browser:

```text
http://<LAN_IP>:8000/health
```

## Quick Run (Already Set Up)

If `.env.local` is already correct and dependencies are installed:

1. Terminal A (backend)

```powershell
cd signese
npm run inference:start
```

2. Terminal B (Expo)

```powershell
cd signese
npx expo start -c --lan
```

Fallback backend start command:

```powershell
cd signese
powershell -ExecutionPolicy Bypass -File .\ml\scripts\start_inference_api.ps1
```

## Scope

- Isolated sign classification only (not sentence-level translation)
- Starter vocabulary:
  - Alphabet A-Z
  - Numbers 1-20
  - Greeting/introduction signs (HELLO, GOOD-MORNING, GOOD-NIGHT, WELCOME, NICE, MEET, YOU, HOW, NAME, MY)
- Caption output appends gloss-like tokens in sequence
- Ambiguous outputs can emit `label1/label2`

## Runtime Pipeline

1. Camera preview runs through Expo Camera in the Translate screen.
2. Short temporal clips are sampled from live frames (mocked in this milestone).
3. Preprocessor converts clips into normalized model input.
4. Inference adapter predicts label probabilities.
5. Postprocessor applies:
   - EMA smoothing
   - confidence threshold
   - duplicate cooldown suppression
   - top-2 ambiguity fallback
6. UI appends accepted tokens to the captions buffer.

## Adapter Strategy

- `MockInferenceAdapter`: active for MVP flow testing
- `LocalModelInferenceAdapter`: TODO placeholder for on-device model execution
- `BackendInferenceAdapter`: TODO placeholder for server inference

## Dataset Strategy

- Single source of truth manifest in `model/dataset.manifest.json`
- Manifest-derived helpers in `model/manifest.ts` and `model/supportedSigns.ts`
- Training-export helpers in `model/preprocess.ts`

## Quick Start (Backend Inference)

Use two terminals:

1. Terminal A (Expo app)

```powershell
cd signese
npx expo start -c --lan
```

2. Terminal B (inference backend)

```powershell
cd signese
npm run inference:start
```

If `npm run inference:start` is not available in your shell, use this robust fallback command:

```powershell
cd signese
powershell -ExecutionPolicy Bypass -File .\ml\scripts\start_inference_api.ps1
```

Optional stop command:

```powershell
cd signese
npm run inference:stop
```

Robust stop fallback:

```powershell
cd signese
powershell -ExecutionPolicy Bypass -File .\ml\scripts\stop_inference_api.ps1
```

Required env vars in `.env.local`:

```env
EXPO_PUBLIC_TRANSLATE_INFERENCE_MODE=backend
EXPO_PUBLIC_TRANSLATE_INFERENCE_URL=http://<LAN_IP>:8000/predict
```

Find `<LAN_IP>` on Windows (PowerShell):

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254*'
  } |
  Select-Object InterfaceAlias,IPAddress
```

Quick health check:

```powershell
Invoke-RestMethod -Uri "http://<LAN_IP>:8000/health"
```

Hotspot demo checklist (phone + laptop):

- Connect your laptop and phone to the same hotspot.
- Put your hotspot network profile as `Private` in Windows.
- Start backend first, then Expo.
- Confirm phone browser opens `http://<LAN_IP>:8000/health` before testing Translate.
- If health check fails on phone, allow inbound TCP `8000` in Windows Firewall.
