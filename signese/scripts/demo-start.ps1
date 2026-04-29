param(
    [int]$Port = 8000,
    [switch]$SkipDependencyInstall
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pythonExe = Join-Path $projectRoot ".venv\Scripts\python.exe"
$requirementsPath = Join-Path $projectRoot "ml\requirements-inference.txt"
$checkpointPath = Join-Path $projectRoot "data\processed\models\first_signese_baseline\model_checkpoint.pt"
$envFilePath = Join-Path $projectRoot ".env.local"

function Get-LanIp {
    $candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254*" -and
            $_.PrefixOrigin -ne "WellKnown"
        } |
        Sort-Object -Property InterfaceMetric |
        Select-Object -First 1

    if (-not $candidate) {
        throw "Unable to detect LAN IPv4 address. Set EXPO_PUBLIC_TRANSLATE_INFERENCE_URL manually."
    }
    return $candidate.IPAddress
}

if (-not (Test-Path $pythonExe)) {
    throw "Python virtual environment not found at $pythonExe. Create .venv first."
}

if (-not (Test-Path $checkpointPath)) {
    throw "Model checkpoint not found at $checkpointPath. Train or copy demo checkpoint first."
}

if (-not $SkipDependencyInstall) {
    Write-Host "[demo] Checking inference dependencies..."
    $depCheck = & $pythonExe -c "import fastapi, uvicorn, torch, mediapipe, cv2" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[demo] Installing inference dependencies..."
        & $pythonExe -m pip install -r $requirementsPath
    } else {
        Write-Host "[demo] Inference dependencies already available."
    }
}

$lanIp = Get-LanIp
$inferenceUrl = "http://$lanIp:$Port/predict"

@(
    "EXPO_PUBLIC_TRANSLATE_INFERENCE_MODE=backend"
    "EXPO_PUBLIC_TRANSLATE_INFERENCE_URL=$inferenceUrl"
) | Set-Content -Path $envFilePath -Encoding UTF8

Write-Host "[demo] Wrote .env.local with backend URL: $inferenceUrl"
Write-Host "[demo] Starting inference API..."

& (Join-Path $projectRoot "ml\scripts\start_inference_api.ps1") -BindHost "0.0.0.0" -Port $Port
