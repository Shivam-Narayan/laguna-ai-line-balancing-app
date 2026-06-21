#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
IMAGE_NAME="laguna-ai-line-balancing"

# ──────────────────────────────────────────────────────────────────────────────
# Defaults
# ──────────────────────────────────────────────────────────────────────────────
BUMP_TYPE=""
CUSTOM_VERSION=""
USE_AMD=false

# ──────────────────────────────────────────────────────────────────────────────
# Usage
# ──────────────────────────────────────────────────────────────────────────────
usage() {
    cat <<EOF
Usage: ./build.sh [OPTIONS]

Options:
  --bump <major|minor|patch>   Bump the version in package.json before building
  --version <X.Y.Z>           Use a specific version for the build
  --amd                        Build for linux/amd64 platform
  -h, --help                   Show this help message

Examples:
  ./build.sh                          # Build with current version
  ./build.sh --bump minor             # Bump minor version, then build
  ./build.sh --version 2.1.0          # Build as version 2.1.0
  ./build.sh --bump patch --amd       # Bump patch version, build for AMD64
EOF
    exit 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
log()   { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[OK]\033[0m    $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERROR]\033[0m $*" >&2; exit 1; }

get_current_version() {
    node -p "require('./package.json').version"
}

bump_version() {
    local type="$1"
    local current
    current=$(get_current_version)

    local major minor patch
    IFS='.' read -r major minor patch <<< "$current"

    case "$type" in
        major) major=$((major + 1)); minor=0; patch=0 ;;
        minor) minor=$((minor + 1)); patch=0 ;;
        patch) patch=$((patch + 1)) ;;
        *) err "Invalid bump type: $type. Use major, minor, or patch." ;;
    esac

    local new_version="${major}.${minor}.${patch}"
    log "Bumping version: $current → $new_version"

    # Update package.json using node for reliable JSON editing
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = '${new_version}';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    "

    echo "$new_version"
}

git_tag_and_push() {
    local version="$1"

    log "Committing version bump..."
    git add package.json
    git commit -m "chore: bump version to v${version}"

    log "Creating git tag v${version}..."
    git tag -a "v${version}" -m "Release v${version}"

    log "Pushing to remote..."
    git push
    git push --tags

    ok "Git tag v${version} created and pushed"
}

# ──────────────────────────────────────────────────────────────────────────────
# Parse Arguments
# ──────────────────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --bump)
            BUMP_TYPE="$2"
            shift 2
            ;;
        --version)
            CUSTOM_VERSION="$2"
            shift 2
            ;;
        --amd)
            USE_AMD=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            err "Unknown option: $1. Use --help for usage."
            ;;
    esac
done

# ──────────────────────────────────────────────────────────────────────────────
# Validate
# ──────────────────────────────────────────────────────────────────────────────
if [[ -n "$BUMP_TYPE" && -n "$CUSTOM_VERSION" ]]; then
    err "Cannot use --bump and --version together. Pick one."
fi

if [[ -n "$CUSTOM_VERSION" && ! "$CUSTOM_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    err "Invalid version format: $CUSTOM_VERSION. Expected X.Y.Z (e.g., 1.2.3)"
fi

# ──────────────────────────────────────────────────────────────────────────────
# Determine Version
# ──────────────────────────────────────────────────────────────────────────────
if [[ -n "$BUMP_TYPE" ]]; then
    VERSION=$(bump_version "$BUMP_TYPE")
    git_tag_and_push "$VERSION"
elif [[ -n "$CUSTOM_VERSION" ]]; then
    VERSION="$CUSTOM_VERSION"
    log "Using custom version: $VERSION"
else
    VERSION=$(get_current_version)
    log "Using current version from package.json: $VERSION"
fi

# ──────────────────────────────────────────────────────────────────────────────
# Build Docker Image
# ──────────────────────────────────────────────────────────────────────────────
log "Building Docker image: ${IMAGE_NAME}:${VERSION}"

PLATFORM_FLAGS=""
if [[ "$USE_AMD" == true ]]; then
    PLATFORM_FLAGS="--platform linux/amd64"
    log "Target platform: linux/amd64"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Image:    ${IMAGE_NAME}"
echo "  Version:  ${VERSION}"
echo "  Tags:     ${IMAGE_NAME}:${VERSION}, ${IMAGE_NAME}:latest"
if [[ "$USE_AMD" == true ]]; then
echo "  Platform: linux/amd64"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build and tag with version
docker build $PLATFORM_FLAGS -t "${IMAGE_NAME}:${VERSION}" -t "${IMAGE_NAME}:latest" .

ok "Docker image built successfully!"
echo ""

# ──────────────────────────────────────────────────────────────────────────────
# Push Docker Image
# ──────────────────────────────────────────────────────────────────────────────
log "Pushing Docker images..."

docker push "${IMAGE_NAME}:${VERSION}"
docker push "${IMAGE_NAME}:latest"

ok "Docker images pushed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Build complete!"
echo "  📦 ${IMAGE_NAME}:${VERSION}"
echo "  📦 ${IMAGE_NAME}:latest"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
