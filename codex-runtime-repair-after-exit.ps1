$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$skillScript = "C:\Users\wangjian02\.codex\skills\repair-computer-use\scripts\Repair-CodexBundledComputerUse.ps1"
$logPath = Join-Path $projectRoot "codex-runtime-repair-after-exit.log"
$donePath = Join-Path $projectRoot "codex-runtime-repair-DONE.txt"

function Write-RepairLog {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
}

function Show-RepairMessage {
    param(
        [string]$Title,
        [string]$Message
    )
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($Message, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    }
    catch {
        Write-RepairLog ("Message box failed: " + $_.Exception.Message)
    }
}

Write-RepairLog "Waiting for Codex processes to exit."

while (Get-Process -Name "codex" -ErrorAction SilentlyContinue) {
    Start-Sleep -Seconds 2
}

Write-RepairLog "Codex processes exited. Starting repair."

try {
    $output = & powershell -ExecutionPolicy Bypass -File $skillScript -Repair -SetRuntimeEnv 2>&1
    $exitCode = $LASTEXITCODE
    Add-Content -LiteralPath $logPath -Value $output -Encoding UTF8
    Write-RepairLog "Repair finished with exit code $exitCode."

    if ($exitCode -eq 0) {
        $message = "Codex runtime repair finished successfully. Reopen Codex and continue the task. Log: $logPath"
        Set-Content -LiteralPath $donePath -Value $message -Encoding UTF8
        Show-RepairMessage -Title "Codex repair complete" -Message $message
    }
    else {
        $message = "Codex runtime repair finished with exit code $exitCode. Reopen Codex and share the log if Node REPL still fails. Log: $logPath"
        Set-Content -LiteralPath $donePath -Value $message -Encoding UTF8
        Show-RepairMessage -Title "Codex repair needs review" -Message $message
    }
    exit $exitCode
}
catch {
    $message = "Codex runtime repair failed: $($_.Exception.Message). Log: $logPath"
    Write-RepairLog $message
    Set-Content -LiteralPath $donePath -Value $message -Encoding UTF8
    Show-RepairMessage -Title "Codex repair failed" -Message $message
    exit 1
}
