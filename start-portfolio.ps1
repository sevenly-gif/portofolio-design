$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverScript = Join-Path $root "serve-portfolio.js"
$healthPath = "/__portfolio_health"
$port = 0
$serverProcess = $null

function Test-PortfolioServer {
    param([int]$Port)

    try {
        $response = Invoke-WebRequest `
            -Uri "http://127.0.0.1:$Port$healthPath" `
            -Method Get `
            -UseBasicParsing `
            -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content -match '"hegel-prayoga-portfolio"'
    }
    catch {
        return $false
    }
}

$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js is required. Install Node.js, then run start-portfolio.bat again."
    exit 1
}

for ($candidate = 8769; $candidate -le 8785; $candidate++) {
    if (Test-PortfolioServer -Port $candidate) {
        $port = $candidate
        break
    }

    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $candidate)
    try {
        $listener.Start()
        $listener.Stop()
        $port = $candidate
        break
    }
    catch {
        $listener.Stop()
    }
}

if ($port -eq 0) {
    Write-Error "No available portfolio port was found between 8769 and 8785."
    exit 1
}

if (-not (Test-PortfolioServer -Port $port)) {
    $env:PORT = "$port"
    try {
        $serverProcess = Start-Process `
            -FilePath $node.Source `
            -ArgumentList ('"' + $serverScript + '"') `
            -WorkingDirectory $root `
            -WindowStyle Hidden `
            -PassThru
    }
    catch {
        Write-Error "Could not launch the portfolio server: $($_.Exception.Message)"
        exit 1
    }

    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if (Test-PortfolioServer -Port $port) {
            $ready = $true
            break
        }

        if ($serverProcess.HasExited) {
            break
        }

        Start-Sleep -Milliseconds 250
    }

    if (-not $ready) {
        Write-Error "The portfolio server did not start. Make sure Node.js is installed and try again."
        exit 1
    }
}

$url = "http://127.0.0.1:$port/"
Start-Process $url
Write-Output "Portfolio opened at $url"
