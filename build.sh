#!/usr/bin/env bash
set -euo pipefail

# ArkKVM full build script.
# Usage: ./build.sh [env] [version]

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  printf "${GREEN}[INFO]${NC} %s\n" "$1"
}

log_warn() {
  printf "${YELLOW}[WARN]${NC} %s\n" "$1"
}

log_error() {
  printf "${RED}[ERROR]${NC} %s\n" "$1" >&2
}

log_step() {
  printf "${BLUE}[STEP]${NC} %s\n" "$1"
}

check_node_version() {
  if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js not found. Required version: 20.18.0 or newer."
    exit 127
  fi

  if ! node -e "const [maj,min]=process.versions.node.split('.').map(Number); process.exit(maj > 20 || (maj === 20 && min >= 18) ? 0 : 1)"; then
    log_error "Node.js 20.18.0 or newer is required. Current: $(node -v)"
    exit 1
  fi
}

run_tsx() {
  if command -v tsx >/dev/null 2>&1; then
    tsx "$@"
  elif [ -x "./node_modules/.bin/tsx" ]; then
    ./node_modules/.bin/tsx "$@"
  else
    log_error "tsx not found. Run pnpm install or make tsx available in PATH."
    exit 127
  fi
}

show_usage() {
  cat <<'EOF'
ArkKVM Frontend Build Script

Usage:
  ./build.sh [env] [version]
  ./build.sh [version]

Arguments:
  env       pro | test (optional, default: pro)
  version   Optional version. If omitted, a version is auto-generated.

Examples:
  ./build.sh
  ./build.sh pro
  ./build.sh test
  ./build.sh 1.2.3
  ./build.sh pro 1.2.3
  ./build.sh test 0.2.26061893
  ./build.sh pro 0.2.26061893
  CLOUD_BUILD_MODE=flat ./build.sh pro 0.2.26061893

Environment Variables:
  CLOUD_BUILD_MODE  versioned | flat (optional, default: versioned)

Build Flow:
  1. Generate version with scripts/generate-version.ts
  2. Build device target
  3. Build cloud target
  4. Write dist version files
  5. Create dist/{version}.zip when zip is available

Build Output:
  dist/device/
  dist/{version}/
  dist/{version}.zip
  dist/cloud/       (when CLOUD_BUILD_MODE=flat)
  dist/cloud.zip    (when CLOUD_BUILD_MODE=flat)
  dist/version
EOF
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  show_usage
  exit 0
fi

if [ "$#" -gt 2 ]; then
  log_error "Too many arguments."
  echo
  show_usage
  exit 1
fi

ENV="pro"
VERSION_ARG=""
if [ "${CLOUD_BUILD_MODE:-}" = "flat" ]; then
  export CLOUD_BUILD_MODE="flat"
else
  export CLOUD_BUILD_MODE="versioned"
fi

if [ "$#" -eq 1 ]; then
  case "$1" in
    pro | test)
      ENV="$1"
      ;;
    *)
      VERSION_ARG="$1"
      ;;
  esac
elif [ "$#" -eq 2 ]; then
  ENV="$1"
  VERSION_ARG="$2"

  case "$ENV" in
    pro | test) ;;
    *)
      log_error "Invalid env: $ENV"
      echo
      show_usage
      exit 1
      ;;
  esac
fi

echo
echo "======================================"
log_info "ArkKVM Frontend Build"
echo "======================================"
log_info "Environment: $ENV"
log_info "Cloud Build Mode: $CLOUD_BUILD_MODE"
if [ -n "$VERSION_ARG" ]; then
  log_info "Version: $VERSION_ARG"
  export VERSION="$VERSION_ARG"
else
  log_info "Version: auto-generated"
fi
echo "======================================"
echo

check_node_version

log_step "Generating version"
run_tsx scripts/generate-version.ts "$ENV"

log_step "Building device target"
./run.sh build device "$ENV"

log_step "Building cloud target"
CLOUD_BUILD_MODE="$CLOUD_BUILD_MODE" ./run.sh build cloud "$ENV"

log_step "Writing dist version files"
run_tsx scripts/write-dist-version.ts "$ENV"

if [ ! -f "dist/version" ]; then
  log_error "Missing dist/version after build."
  exit 1
fi

BUILT_VERSION="$(cat dist/version)"

echo
echo "======================================"
log_info "Build successful"
echo "======================================"
log_info "Build Version: $BUILT_VERSION"
log_info "Build Artifacts:"

if [ -d "dist/device" ]; then
  DEVICE_SIZE="$(du -sh dist/device | awk '{print $1}')"
  printf '  - dist/device/ (%s)\n' "$DEVICE_SIZE"
else
  log_warn "Missing dist/device/"
fi

if [ "$CLOUD_BUILD_MODE" = "flat" ]; then
  cloud_dist="dist/cloud"
  cloud_zip="dist/cloud.zip"
  cloud_zip_name="cloud.zip"
  cloud_zip_source="cloud"
else
  cloud_dist="dist/${BUILT_VERSION}"
  cloud_zip="dist/${BUILT_VERSION}.zip"
  cloud_zip_name="${BUILT_VERSION}.zip"
  cloud_zip_source="$BUILT_VERSION"
fi

if [ -d "$cloud_dist" ]; then
  CLOUD_SIZE="$(du -sh "$cloud_dist" | awk '{print $1}')"
  printf '  - %s/ (%s)\n' "$cloud_dist" "$CLOUD_SIZE"

  if command -v zip >/dev/null 2>&1; then
    log_step "Creating cloud archive"
    if (cd dist && zip -rq "$cloud_zip_name" "$cloud_zip_source"); then
      ZIP_SIZE="$(du -sh "$cloud_zip" | awk '{print $1}')"
      printf '  - %s (%s)\n' "$cloud_zip" "$ZIP_SIZE"
    else
      log_warn "Failed to create $cloud_zip; continuing without archive."
    fi
  else
    log_warn "'zip' command not found; skipping $cloud_zip."
  fi
else
  log_warn "Missing $cloud_dist/"
fi

printf '  - dist/version\n'
echo "======================================"
log_info "Build complete"
