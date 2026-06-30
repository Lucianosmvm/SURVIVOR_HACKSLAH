# deploy.ps1 — sobe o CACHE_VERSION do sw.js, commita e da push.
# Uso:
#   .\deploy.ps1                 -> bump + commit "deploy: bump cache vN" + push
#   .\deploy.ps1 "minha msg"     -> usa tua mensagem de commit
#
# Por que: o service worker so entrega arquivos novos se CACHE_VERSION mudar.
# Esquecer disso = usuario continua vendo a versao velha em cache.

param([string]$Message = "")

$ErrorActionPreference = "Stop"
$swPath = Join-Path $PSScriptRoot "sw.js"

if (-not (Test-Path $swPath)) { Write-Error "sw.js nao encontrado em $swPath"; exit 1 }

$content = Get-Content $swPath -Raw

# acha cronicas-vN e incrementa N
$m = [regex]::Match($content, "cronicas-v(\d+)")
if (-not $m.Success) { Write-Error "Nao achei 'cronicas-vN' no sw.js"; exit 1 }

$old = [int]$m.Groups[1].Value
$new = $old + 1
$content = $content -replace "cronicas-v\d+", "cronicas-v$new"

# escreve sem BOM, mantendo UTF-8
[System.IO.File]::WriteAllText($swPath, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "CACHE_VERSION: cronicas-v$old -> cronicas-v$new" -ForegroundColor Green

if ([string]::IsNullOrWhiteSpace($Message)) { $Message = "deploy: bump cache v$new" }

git add -A
git commit -m $Message
if ($?) { git push; Write-Host "`nDeploy enviado. Usuarios pegam o update na proxima vez que abrirem o app." -ForegroundColor Cyan }
