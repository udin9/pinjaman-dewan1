# Check for Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Starting local server using Python..." -ForegroundColor Cyan
    Write-Host "URL: http://localhost:8080" -ForegroundColor Green
    python -m http.server 8080
} 
# Fallback to Node.js / npx
elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    Write-Host "Starting local server using npx serve..." -ForegroundColor Cyan
    Write-Host "URL: http://localhost:3000" -ForegroundColor Green
    npx serve .
} 
# Error if neither found
else {
    Write-Host "Error: Neither Python nor Node.js (npx) was found on your system." -ForegroundColor Red
    Write-Host "To run this web locally, please install Python or Node.js." -ForegroundColor Yellow
    Write-Host "Alternatively, you can just double-click 'index.html' to open it directly." -ForegroundColor White
    Read-Host "Press Enter to exit..."
}
