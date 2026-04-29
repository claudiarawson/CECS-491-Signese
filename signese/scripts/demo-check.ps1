param(
    [string]$ServerHost = "127.0.0.1",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$healthUrl = "http://$ServerHost`:$Port/health"
$predictUrl = "http://$ServerHost`:$Port/predict"

Write-Host "[demo-check] Health: $healthUrl"
$health = Invoke-RestMethod -Uri $healthUrl -Method Get

if (-not $health.ok) {
    throw "Health check did not return ok=true."
}

Write-Host "[demo-check] Model: $($health.model_id)"
Write-Host "[demo-check] Expected input: $($health.expected_input -join 'x')"

$payload = @{
    clip_id = "demo-smoke-check"
    values = @(0.25, 0.40, 0.30, 0.20, 0.10)
    shape = @(1, 5, 1, 1)
    metadata = @{ source = "demo-check" }
} | ConvertTo-Json -Depth 5

$predict = Invoke-RestMethod -Uri $predictUrl -Method Post -ContentType "application/json" -Body $payload

if (-not $predict.raw_top_k -or $predict.raw_top_k.Count -eq 0) {
    throw "Predict check failed: raw_top_k missing."
}

$top = $predict.raw_top_k[0]
Write-Host "[demo-check] Top prediction: $($top.label) ($([Math]::Round([double]$top.score, 4)))"
Write-Host "[demo-check] Demo backend is ready."
