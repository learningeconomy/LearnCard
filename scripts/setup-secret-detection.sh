#!/bin/bash
# Setup script for LearnCard secret detection
# This script installs the pre-commit hook and gitleaks

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}🔧 LearnCard Secret Detection Setup${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "${YELLOW}📍 Project root: $PROJECT_ROOT${NC}"

# Check if .git exists
if [ ! -d ".git" ]; then
    echo "${RED}❌ Error: Not a git repository${NC}"
    echo "Please run this script from the repository root"
    exit 1
fi

# Function to install gitleaks
install_gitleaks() {
    echo "${YELLOW}🔍 Checking gitleaks installation...${NC}"
    
    if command -v gitleaks >/dev/null 2>&1; then
        echo "${GREEN}✅ Gitleaks already installed: $(gitleaks version)${NC}"
        return 0
    fi
    
    echo "${YELLOW}📦 Installing gitleaks...${NC}"
    
    # Check if the bundled binary exists
    if [ -f "./gitleaks" ]; then
        echo "${GREEN}✅ Found bundled gitleaks binary${NC}"
        chmod +x ./gitleaks
        echo "${YELLOW}ℹ️  Add to PATH: export PATH=\"\$PATH:$PROJECT_ROOT\"${NC}"
        return 0
    fi
    
    # Try to install based on OS
    OS=$(uname -s)
    ARCH=$(uname -m)
    
    case "$OS" in
        Linux*)
            if [ "$ARCH" = "x86_64" ]; then
                echo "${YELLOW}📥 Downloading gitleaks for Linux x64...${NC}"
                curl -sL https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz | tar -xz
                chmod +x gitleaks
                echo "${GREEN}✅ Gitleaks downloaded to project root${NC}"
                echo "${YELLOW}ℹ️  Add to PATH: export PATH=\"\$PATH:$PROJECT_ROOT\"${NC}"
            else
                echo "${RED}❌ Unsupported architecture: $ARCH${NC}"
                echo "Please install gitleaks manually: https://github.com/gitleaks/gitleaks"
                return 1
            fi
            ;;
        Darwin*)
            if command -v brew >/dev/null 2>&1; then
                echo "${YELLOW}📥 Installing gitleaks via Homebrew...${NC}"
                brew install gitleaks
                echo "${GREEN}✅ Gitleaks installed via Homebrew${NC}"
            else
                echo "${RED}❌ Homebrew not found${NC}"
                echo "Please install Homebrew or gitleaks manually"
                return 1
            fi
            ;;
        *)
            echo "${RED}❌ Unsupported OS: $OS${NC}"
            echo "Please install gitleaks manually: https://github.com/gitleaks/gitleaks"
            return 1
            ;;
    esac
}

# Function to setup pre-commit hook
setup_precommit() {
    echo ""
    echo "${YELLOW}📝 Setting up pre-commit hook...${NC}"
    
    HOOK_PATH=".git/hooks/pre-commit"
    
    if [ -f "$HOOK_PATH" ] && [ ! -f "$HOOK_PATH.backup" ]; then
        echo "${YELLOW}📦 Backing up existing pre-commit hook...${NC}"
        cp "$HOOK_PATH" "$HOOK_PATH.backup"
    fi
    
    # Check if our pre-commit hook already exists
    if [ -f "$HOOK_PATH" ] && grep -q "gitleaks" "$HOOK_PATH" 2>/dev/null; then
        echo "${GREEN}✅ Gitleaks pre-commit hook already installed${NC}"
        return 0
    fi
    
    # Use the pre-commit hook from scripts directory or create one
    if [ -f "scripts/pre-commit-hook.sh" ]; then
        cp scripts/pre-commit-hook.sh "$HOOK_PATH"
        chmod +x "$HOOK_PATH"
        echo "${GREEN}✅ Pre-commit hook installed from scripts/pre-commit-hook.sh${NC}"
    else
        # The hook should already be in .git/hooks from repo
        echo "${YELLOW}⚠️  Please ensure .git/hooks/pre-commit exists and is executable${NC}"
        echo "${YELLOW}   Run: chmod +x .git/hooks/pre-commit${NC}"
    fi
}

# Function to verify setup
verify_setup() {
    echo ""
    echo "${YELLOW}🔍 Verifying setup...${NC}"
    
    local ERRORS=0
    
    # Check pre-commit hook
    if [ -f ".git/hooks/pre-commit" ]; then
        if [ -x ".git/hooks/pre-commit" ]; then
            echo "${GREEN}✅ Pre-commit hook is installed and executable${NC}"
        else
            echo "${RED}❌ Pre-commit hook is not executable${NC}"
            echo "   Run: chmod +x .git/hooks/pre-commit"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "${RED}❌ Pre-commit hook not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check gitleaks config
    if [ -f ".gitleaks.toml" ]; then
        echo "${GREEN}✅ Gitleaks configuration found${NC}"
    else
        echo "${RED}❌ Gitleaks configuration not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Check gitleaks binary
    if command -v gitleaks >/dev/null 2>&1 || [ -f "./gitleaks" ]; then
        echo "${GREEN}✅ Gitleaks binary found${NC}"
    else
        echo "${RED}❌ Gitleaks binary not found${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    echo ""
    if [ $ERRORS -eq 0 ]; then
        echo "${GREEN}🎉 Setup completed successfully!${NC}"
        echo ""
        echo "${BLUE}📖 Next steps:${NC}"
        echo "   1. Review the documentation: docs/SECRET_DETECTION.md"
        echo "   2. Test the setup: echo 'test' > test.txt && git add test.txt && git commit -m 'test'"
        echo "   3. Clean up test: git reset HEAD test.txt && rm test.txt"
        echo ""
        echo "${YELLOW}⚠️  Important:${NC}"
        echo "   If gitleaks is not in your PATH, add this to your shell profile:"
        echo "   export PATH=\"\$PATH:$PROJECT_ROOT\""
        return 0
    else
        echo "${RED}⚠️  Setup completed with $ERRORS error(s)${NC}"
        echo "Please review the messages above and fix the issues"
        return 1
    fi
}

# Main execution
main() {
    install_gitleaks
    setup_precommit
    verify_setup
}

main
