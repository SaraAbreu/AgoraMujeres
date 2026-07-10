# Ejecuta este script desde PowerShell en C:\Users\Usuario\AgoraMujeres
# > .\deploy-ahora.ps1

Set-Location "C:\Users\Usuario\AgoraMujeres"

# 1. Commit app.json corregido + deploy.sh
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "Lock eliminado" -ForegroundColor Yellow
}

git add app-agora/app.json deploy.sh
git commit -m "fix: app.json JSON valido sin tildes + deploy.sh rutas correctas"
git push origin main

Write-Host ""
Write-Host "Ahora abre Git Bash y ejecuta:" -ForegroundColor Green
Write-Host "  cd ~/AgoraMujeres && bash deploy.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Eso compilara el frontend, subira todo al servidor y reiniciara el backend." -ForegroundColor White
