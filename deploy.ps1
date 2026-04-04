Write-Host "Compilando..."
Set-Location frontend
npx expo export --platform web

Write-Host "Subiendo al servidor..."
scp -r dist/* root@agoramujeres.syntexia-solutions.es:/var/www/agora-frontend/

Set-Location ..
Write-Host "Listo!"