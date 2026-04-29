# Signese Demo Quickstart

This guide is for teammates to run the Translate demo with minimal setup.

## Prerequisites

- Windows PowerShell
- Node + npm
- Python virtual environment at `.venv` inside `signese`
- Model checkpoint at:
  - `data/processed/models/first_signese_baseline/model_checkpoint.pt`

## 1) Install app dependencies

```powershell
cd signese
npm install
```

## 2) Start the demo backend

```powershell
cd signese
npm run demo:start
```

What this does:
- checks Python inference dependencies (installs if missing)
- detects LAN IP
- writes `.env.local` with:
  - `EXPO_PUBLIC_TRANSLATE_INFERENCE_MODE=backend`
  - `EXPO_PUBLIC_TRANSLATE_INFERENCE_URL=http://<LAN_IP>:8000/predict`
- starts FastAPI inference backend on port `8000`

Keep this terminal open while demoing.

## Shortcut: start backend + Expo automatically

If you prefer one command that opens both in separate windows:

```powershell
cd signese
npm run demo:all
```

This opens:
- `Signese Demo Backend`
- `Signese Demo Expo`

## 3) Verify backend quickly (optional but recommended)

```powershell
cd signese
npm run demo:check
```

## 4) Start Expo for phone demo

Open a second terminal:

```powershell
cd signese
npx expo start -c --lan
```

Scan the QR code with Expo Go on iPhone.

## 5) Confirm phone can reach backend

Open on phone browser:

```text
http://<LAN_IP>:8000/health
```

If this fails, allow inbound TCP `8000` on Windows firewall and ensure laptop + phone are on same network.

## Stop backend

```powershell
cd signese
npm run demo:stop
```

