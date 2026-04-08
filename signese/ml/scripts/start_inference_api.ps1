param(
    [string]$BindHost = "0.0.0.0",
    [int]$Port = 8000
)

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pythonExe = Join-Path $projectRoot ".venv\Scripts\python.exe"
$serverScript = Join-Path $projectRoot "ml\scripts\serve_first_model_api.py"

if (-not (Test-Path $pythonExe)) {
    Write-Error "Python executable not found at $pythonExe"
    exit 1
}

if (-not (Test-Path $serverScript)) {
    Write-Error "Server script not found at $serverScript"
    exit 1
}

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
    foreach ($listener in $listeners) {
        if ($listener.OwningProcess -ne $PID) {
            try {
                Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
                Write-Host "Stopped stale process on port $Port (PID $($listener.OwningProcess))."
            } catch {
                Write-Warning "Failed to stop PID $($listener.OwningProcess) on port ${Port}: $($_.Exception.Message)"
            }
        }
    }
}

Write-Host "Starting inference API on $BindHost`:$Port"
& $pythonExe $serverScript --host $BindHost --port $Port
