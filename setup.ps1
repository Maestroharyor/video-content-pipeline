# One-shot setup for Windows (PowerShell 5+). Safe to re-run.
#   powershell -ExecutionPolicy Bypass -File setup.ps1
# Installs Node 22, ffmpeg and whisper.cpp with winget, then npm install, shared assets, skill links and a health check.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Log($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function NodeOk { if (-not (Have node)) { return $false }; $v = (node -v).TrimStart('v').Split('.'); return ([int]$v[0] -gt 22 -or ([int]$v[0] -eq 22 -and [int]$v[1] -ge 12)) }
if (-not (Have winget)) { Write-Host "winget is required (App Installer from the Microsoft Store)"; exit 1 }

if (-not (NodeOk)) { Log "installing Node 22 LTS"; winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements }
if (-not (Have ffmpeg)) { Log "installing ffmpeg"; winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements }
if (-not (Have whisper-cli)) {
  Log "installing whisper.cpp (prebuilt release)"
  $dir = Join-Path $env:LOCALAPPDATA 'whisper.cpp'; New-Item -ItemType Directory -Force $dir | Out-Null
  $rel = Invoke-RestMethod 'https://api.github.com/repos/ggml-org/whisper.cpp/releases/latest'
  $asset = $rel.assets | Where-Object { $_.name -match 'bin-x64\.zip$' } | Select-Object -First 1
  if (-not $asset) { Write-Host "no prebuilt whisper.cpp asset found; build it from https://github.com/ggml-org/whisper.cpp and put whisper-cli.exe on PATH"; }
  else {
    $zip = Join-Path $dir $asset.name
    Invoke-WebRequest $asset.browser_download_url -OutFile $zip
    Expand-Archive -Force $zip $dir
    $exe = Get-ChildItem $dir -Recurse -Filter 'whisper-cli.exe' | Select-Object -First 1
    $bin = $exe.DirectoryName
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($userPath -notlike "*$bin*") { [Environment]::SetEnvironmentVariable('Path', "$userPath;$bin", 'User') }
    $env:Path = "$env:Path;$bin"
  }
}
# refresh PATH for tools installed above in this session
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path
if (-not (NodeOk)) { Write-Host "node >= 22.12 not found on PATH yet: open a new terminal and re-run setup.ps1"; exit 1 }
Log "npm install (also downloads Chrome for Testing once)"
npm install --no-fund --no-audit
Log "shared assets + skill links + health check"
node scripts/setup.js --no-install
