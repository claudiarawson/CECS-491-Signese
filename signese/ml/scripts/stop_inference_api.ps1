param(
    [int]$Port = 8000
)

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $listeners) {
    Write-Host "No listener found on port $Port."
    exit 0
}

foreach ($listener in $listeners) {
    try {
        Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
        Write-Host "Stopped process on port $Port (PID $($listener.OwningProcess))."
    } catch {
        Write-Warning "Failed to stop PID $($listener.OwningProcess): $($_.Exception.Message)"
    }
}
