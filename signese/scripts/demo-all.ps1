param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backendTitle = "Signese Demo Backend"
$expoTitle = "Signese Demo Expo"

$backendCommand = @"
Set-Location '$projectRoot'
npm run demo:start -- --Port $Port
"@

$expoCommand = @"
Set-Location '$projectRoot'
npx expo start -c --lan
"@

Write-Host "[demo-all] Opening backend and Expo in separate windows..."

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "`$Host.UI.RawUI.WindowTitle = '$backendTitle'; $backendCommand"
)

Start-Sleep -Milliseconds 700

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "`$Host.UI.RawUI.WindowTitle = '$expoTitle'; $expoCommand"
)

Write-Host "[demo-all] Started:"
Write-Host "  - $backendTitle"
Write-Host "  - $expoTitle"
Write-Host "[demo-all] Run 'npm run demo:check' after backend is up."
