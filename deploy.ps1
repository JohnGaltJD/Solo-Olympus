# deploy.ps1
# Deployment script for Family Mount Olympus Bank
# This script helps set up the application for local access

param (
    [string]$Port = "8000",
    [switch]$OpenBrowser = $true,
    [switch]$GenerateIcons = $false
)

Write-Host "Family Mount Olympus Bank - Deployment Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
$pythonInstalled = $false
try {
    $pythonVersion = python --version
    $pythonInstalled = $true
    Write-Host "Python detected: $pythonVersion" -ForegroundColor Green
} catch {
    try {
        $pythonVersion = python3 --version
        $pythonInstalled = $true
        $pythonCommand = "python3"
        Write-Host "Python3 detected: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "Python not detected. Please install Python to use the built-in HTTP server." -ForegroundColor Yellow
    }
}

# Get local IP address for easy device access
$ipAddress = Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress
Write-Host "Local IP Address: $ipAddress" -ForegroundColor Green

# Function to start a simple HTTP server
function Start-SimpleServer {
    if ($pythonInstalled) {
        Write-Host "Starting HTTP server on port $Port..." -ForegroundColor Green
        
        # Determine the Python command to use
        $cmd = if ($pythonCommand -eq "python3") { "python3" } else { "python" }
        
        # Start the server
        Write-Host "Server starting at http://localhost:$Port"
        Write-Host "On other devices, access using: http://${ipAddress}:$Port"
        Write-Host "Press Ctrl+C to stop the server."
        
        if ($OpenBrowser) {
            Start-Process "http://localhost:$Port"
        }
        
        & $cmd -m http.server $Port
    } else {
        Write-Host "Cannot start HTTP server. Python is not installed." -ForegroundColor Red
        Write-Host "Alternative options:" -ForegroundColor Yellow
        Write-Host "1. Install Python from https://www.python.org/" -ForegroundColor Yellow
        Write-Host "2. Use Visual Studio Code with Live Server extension" -ForegroundColor Yellow
        Write-Host "3. Configure IIS on Windows to host the application" -ForegroundColor Yellow
    }
}

# Function to replace placeholder images
function Replace-PlaceholderImages {
    Write-Host "Checking for placeholder images..." -ForegroundColor Yellow
    
    # Check if icon placeholders exist and warn if they do
    $placeholders = @(
        "images/app-icons/icon-72x72.png",
        "images/app-icons/icon-96x96.png",
        "images/app-icons/icon-128x128.png",
        "images/app-icons/icon-144x144.png",
        "images/app-icons/icon-152x152.png",
        "images/app-icons/icon-192x192.png",
        "images/app-icons/icon-384x384.png",
        "images/app-icons/icon-512x512.png"
    )
    
    $missingIcons = $false
    foreach ($placeholder in $placeholders) {
        if (-not (Test-Path $placeholder)) {
            $missingIcons = $true
            break
        }
    }
    
    if ($missingIcons) {
        Write-Host "Some app icons are missing. Consider generating them using the Node.js script:" -ForegroundColor Yellow
        Write-Host "1. Make sure Node.js is installed" -ForegroundColor Yellow
        Write-Host "2. Run: npm install canvas sharp" -ForegroundColor Yellow  
        Write-Host "3. Run: node js/generate-icons.js" -ForegroundColor Yellow
        
        if ($GenerateIcons) {
            Write-Host "Attempting to create basic placeholder icons..." -ForegroundColor Yellow
            $baseIconPath = "images/app-icons/icon-base.svg"
            
            if (Test-Path $baseIconPath) {
                try {
                    # Create app-icons directory if it doesn't exist
                    if (-not (Test-Path "images/app-icons")) {
                        New-Item -Path "images/app-icons" -ItemType Directory -Force | Out-Null
                    }
                    
                    # For each missing placeholder, create a copy of the base icon
                    # This is a very basic approach - the icons won't be properly sized
                    # Better to use the Node.js script for proper icon generation
                    foreach ($placeholder in $placeholders) {
                        if (-not (Test-Path $placeholder)) {
                            # Create a simple HTML file that can be used as a placeholder
                            $iconSize = [regex]::Match($placeholder, "icon-(\d+)x\d+").Groups[1].Value
                            $iconContent = @"
<!DOCTYPE html>
<html>
<head>
<style>
body { margin: 0; padding: 0; background-color: #3949ab; width: ${iconSize}px; height: ${iconSize}px; overflow: hidden; }
.icon-text { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; color: white; font-family: Arial; font-weight: bold; }
</style>
</head>
<body>
<div class="icon-text">OB</div>
</body>
</html>
"@
                            $tempHtmlPath = [System.IO.Path]::GetTempFileName() + ".html"
                            $iconContent | Out-File -FilePath $tempHtmlPath -Encoding utf8
                            
                            # Alert the user that proper icon generation requires additional tools
                            Write-Host "Created basic placeholder for $placeholder" -ForegroundColor Yellow
                            Write-Host "This is just a simple placeholder. For proper icons, use the Node.js script." -ForegroundColor Yellow
                        }
                    }
                } catch {
                    Write-Host "Error creating placeholder icons: $_" -ForegroundColor Red
                }
            } else {
                Write-Host "Base icon not found at $baseIconPath. Cannot create placeholders." -ForegroundColor Red
            }
        } else {
            Write-Host "All app icons are present." -ForegroundColor Green
        }
    }
}

# Main script execution
Replace-PlaceholderImages
Start-SimpleServer 