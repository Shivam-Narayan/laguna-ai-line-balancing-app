param (
    [string]$bump = "",
    [string]$version = "",
    [switch]$amd
)

$ErrorActionPreference = "Stop"

# Change to project root directory
Set-Location -Path (Join-Path $PSScriptRoot "..")
# Configuration
$IMAGE_NAME = "laguna-ai-line-balancing"

# Helpers
function Write-Log($Message) { Write-Host "[INFO]  $Message" -ForegroundColor Cyan }
function Write-Ok($Message) { Write-Host "[OK]    $Message" -ForegroundColor Green }
function Write-Warn($Message) { Write-Host "[WARN]  $Message" -ForegroundColor Yellow }
function Write-Err($Message) { Write-Host "[ERROR] $Message" -ForegroundColor Red; exit 1 }

# Validate Arguments
if ($bump -and $version) {
    Write-Err "Cannot use -bump and -version together. Pick one."
}

if ($version -and $version -notmatch "^\d+\.\d+\.\d+$") {
    Write-Err "Invalid version format: $version. Expected X.Y.Z (e.g., 1.2.3)"
}

# Determine Version
$packageJsonPath = Join-Path $PWD "package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Err "package.json not found in current directory."
}

$pkg = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$currentVersion = $pkg.version

if ($bump) {
    $parts = $currentVersion.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]

    switch ($bump.ToLower()) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
        default { Write-Err "Invalid bump type: $bump. Use major, minor, or patch." }
    }

    $newVersion = "$major.$minor.$patch"
    Write-Log "Bumping version: $currentVersion -> $newVersion"
    $pkg.version = $newVersion
    
    # Save formatted JSON back
    $pkg | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8

    Write-Log "Committing version bump..."
    git add package.json
    git commit -m "chore: bump version to v$newVersion"
    Write-Log "Creating git tag v$newVersion..."
    git tag -a "v$newVersion" -m "Release v$newVersion"
    Write-Log "Pushing to remote..."
    git push
    git push --tags
    Write-Ok "Git tag v$newVersion created and pushed"

    $FINAL_VERSION = $newVersion
} elseif ($version) {
    $FINAL_VERSION = $version
    Write-Log "Using custom version: $FINAL_VERSION"
} else {
    $FINAL_VERSION = $currentVersion
    Write-Log "Using current version from package.json: $FINAL_VERSION"
}

# Build Docker Image
Write-Log "Building Docker image: ${IMAGE_NAME}:${FINAL_VERSION}"

$buildArgs = @("build", "-t", "${IMAGE_NAME}:${FINAL_VERSION}", "-t", "${IMAGE_NAME}:latest")
if ($amd) {
    $buildArgs += "--platform", "linux/amd64"
    Write-Log "Target platform: linux/amd64"
}
$buildArgs += "."

Write-Host ""
Write-Host "======================================================="
Write-Host "  Image:    ${IMAGE_NAME}"
Write-Host "  Version:  ${FINAL_VERSION}"
Write-Host "  Tags:     ${IMAGE_NAME}:${FINAL_VERSION}, ${IMAGE_NAME}:latest"
if ($amd) { Write-Host "  Platform: linux/amd64" }
Write-Host "======================================================="
Write-Host ""

& docker $buildArgs
if ($LASTEXITCODE -ne 0) { Write-Err "Docker build failed." }

Write-Ok "Docker image built successfully!"
Write-Host ""

# Push Docker Image
Write-Log "Pushing Docker images..."
& docker push "${IMAGE_NAME}:${FINAL_VERSION}"
& docker push "${IMAGE_NAME}:latest"

Write-Ok "Docker images pushed successfully!"
Write-Host ""
Write-Host "======================================================="
Write-Host "  [OK] Build complete!"
Write-Host "  [+] ${IMAGE_NAME}:${FINAL_VERSION}"
Write-Host "  [+] ${IMAGE_NAME}:latest"
Write-Host "  [>] web app:  http://localhost:5173/"
Write-Host "======================================================="
