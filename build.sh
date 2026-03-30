#!/bin/bash

###
# @Purpose: Unified build script for frontend projects
# @Description: Support build for production and test environments, support custom version number
# @Author: zhanglei
# @Date: 2026-01-27
###

# Color definition
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored information
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Display usage instructions
show_usage() {
    cat << EOF
${GREEN}ArkKVM frontend project build script${NC}

Usage:
  ./build.sh [env] [version]

Parameters:
  env        Environment type (optional, default pro)
             - pro   Production environment
             - test  Test environment

  version    Version number (optional)
             - If not passed, generate 0.0.YYMMDDXX format
             - For example: 0.01.333 or 1.2.3

Examples:
  ./build.sh                        # Production environment, automatically generate version number (default)
  ./build.sh 1.2.3                  # Production environment, specify version number 1.2.3
  ./build.sh pro                    # Production environment, automatically generate version number
  ./build.sh pro 1.2.3              # Production environment, specify version number 1.2.3
  ./build.sh test                   # Test environment, automatically generate version number
  ./build.sh test 0.01.333          # Test environment, specify version number 0.01.333

Build artifacts:
  dist/device/    Device build artifacts
  dist/cloud/     Cloud build artifacts
  dist/version    Version number file

Version number management:
  - The version number will be automatically written to the .env.{env} file
  - The version number will be synchronized to dist/device/version and dist/cloud/version
  - rsbuild will automatically read the version number and inject it into the code when building

Engineering deployment:
  Suitable for integration into CI/CD processes, supported by Jenkins/GitLab CI and other tools

EOF
}

# Check help parameters
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_usage
    exit 0
fi

# Parse parameters: support flexible parameter order
ENV="pro"  # Default production environment
VERSION=""

if [ $# -eq 0 ]; then
    # No parameters: use default value pro + automatically generate version number
    ENV="pro"
elif [ $# -eq 1 ]; then
    # One parameter: determine if it is an environment or version number
    if [[ "$1" == "pro" ]] || [[ "$1" == "test" ]]; then
        ENV="$1"
    else
        # Not an environment parameter, treat it as a version number
        ENV="pro"
        VERSION="$1"
    fi
elif [ $# -eq 2 ]; then
    # Two parameters: the first is the environment, the second is the version number
    ENV="$1"
    VERSION="$2"
fi

# Verify environment parameters
if [[ "$ENV" != "pro" ]] && [[ "$ENV" != "test" ]]; then
    log_error "Invalid environment parameters: $ENV"
    echo ""
    log_info "Valid environment parameters: pro or test"
    echo ""
    show_usage
    exit 1
fi

# Display build information
echo ""
echo "======================================"
log_info "ArkKVM frontend project build"
echo "======================================"
log_info "Build environment: ${ENV}"

if [ -z "$VERSION" ]; then
    log_info "Version strategy: automatically generate"
else
    log_info "Specified version: ${VERSION}"
fi

echo "======================================"
echo ""

# Execute build
log_step "Start build process..."

if [ -z "$VERSION" ]; then
    # Automatically generate version number
    if [[ "$ENV" == "pro" ]]; then
        pnpm build:both:pro
    else
        pnpm build:both:test
    fi
else
    # Use specified version number
    if [[ "$ENV" == "pro" ]]; then
        VERSION=$VERSION pnpm build:both:pro
    else
        VERSION=$VERSION pnpm build:both:test
    fi
fi

# Check build result
BUILD_EXIT_CODE=$?

echo ""
echo "======================================"

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    log_info "✅ Build successful!"
    echo "======================================"

    # Display version number information
    if [ -f "dist/version" ]; then
        BUILT_VERSION=$(cat dist/version)
        log_info "📦 Build version: ${BUILT_VERSION}"
    fi

    # Display build artifacts
    log_info "📂 Build artifacts:"

    if [ -d "dist/device" ]; then
        DEVICE_SIZE=$(du -sh dist/device | cut -f1)
        echo "   - dist/device/ (device) - ${DEVICE_SIZE}"
        if [ -f "dist/device/version" ]; then
            DEVICE_VERSION=$(cat dist/device/version)
            echo "     Version: ${DEVICE_VERSION}"
        fi
    fi

    if [ -d "dist/cloud" ]; then
        CLOUD_SIZE=$(du -sh dist/cloud | cut -f1)
        echo "   - dist/cloud/  (cloud) - ${CLOUD_SIZE}"
        if [ -f "dist/cloud/version" ]; then
            CLOUD_VERSION=$(cat dist/cloud/version)
            echo "     Version: ${CLOUD_VERSION}"
        fi
    fi

    echo "======================================"
    log_info "🎉 Build completed, can be deployed!"
    echo ""

    exit 0
else
    log_error "❌ Build failed!"
    echo "======================================"
    log_warn "Please check the error information above"
    echo ""
    exit 1
fi
