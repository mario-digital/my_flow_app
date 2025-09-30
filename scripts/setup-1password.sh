#!/bin/bash

# 1Password Setup Script for MyFlow
#
# This script helps set up 1Password CLI and create required vault items.
# It's an interactive guide - you'll need to manually add secret values.
#
# Prerequisites:
#   - 1Password CLI installed (brew install 1password-cli)
#   - 1Password account with appropriate permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MyFlow 1Password Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check if 1Password CLI is installed
echo -e "${YELLOW}Step 1: Checking 1Password CLI installation...${NC}"
if ! command -v op &> /dev/null; then
    echo -e "${RED}✗ 1Password CLI (op) is not installed${NC}"
    echo ""
    echo "Install it with one of the following:"
    echo "  macOS:   brew install 1password-cli"
    echo "  Linux:   See https://developer.1password.com/docs/cli/get-started/"
    echo "  Windows: Download from https://1password.com/downloads/command-line/"
    exit 1
fi
echo -e "${GREEN}✓ 1Password CLI is installed${NC}"
echo ""

# Step 2: Authenticate
echo -e "${YELLOW}Step 2: Authenticating with 1Password...${NC}"
if ! op vault list &> /dev/null; then
    echo -e "${YELLOW}Please authenticate with 1Password:${NC}"
    op signin
fi
echo -e "${GREEN}✓ Authenticated with 1Password${NC}"
echo ""

# Step 3: Create vault
echo -e "${YELLOW}Step 3: Creating 'MyFlow Development' vault...${NC}"
if op vault get "MyFlow Development" &> /dev/null; then
    echo -e "${GREEN}✓ Vault 'MyFlow Development' already exists${NC}"
else
    if op vault create "MyFlow Development"; then
        echo -e "${GREEN}✓ Created vault 'MyFlow Development'${NC}"
    else
        echo -e "${RED}✗ Failed to create vault. You may need appropriate permissions.${NC}"
        exit 1
    fi
fi
echo ""

# Step 4: Create vault items
echo -e "${YELLOW}Step 4: Creating vault items...${NC}"
echo ""

# Function to create or update an item
create_or_update_item() {
    local title=$1
    local category=$2
    shift 2
    local fields=("$@")

    echo -e "${BLUE}Creating: $title${NC}"

    if op item get "$title" --vault="MyFlow Development" &> /dev/null; then
        echo -e "${YELLOW}  Item already exists. Skipping creation.${NC}"
        echo -e "${YELLOW}  To update, use: op item edit '$title' --vault='MyFlow Development' field=value${NC}"
    else
        # Create the item
        if op item create \
            --category="$category" \
            --title="$title" \
            --vault="MyFlow Development" \
            --generate-password &> /dev/null; then

            echo -e "${GREEN}  ✓ Created item '$title'${NC}"
            echo -e "${YELLOW}  Now add these fields manually:${NC}"
            for field in "${fields[@]}"; do
                echo -e "    - $field"
            done
            echo -e "${YELLOW}  Use: op item edit '$title' --vault='MyFlow Development' $field=value${NC}"
        else
            echo -e "${RED}  ✗ Failed to create item '$title'${NC}"
        fi
    fi
    echo ""
}

# MongoDB
create_or_update_item "MyFlow MongoDB" "login" \
    "MONGODB_URI"

# Logto Backend
create_or_update_item "MyFlow Logto Backend" "login" \
    "LOGTO_ENDPOINT" \
    "LOGTO_APP_ID" \
    "LOGTO_APP_SECRET" \
    "LOGTO_RESOURCE"

# Logto Frontend
create_or_update_item "MyFlow Logto Frontend" "login" \
    "NEXT_PUBLIC_LOGTO_ENDPOINT" \
    "NEXT_PUBLIC_LOGTO_APP_ID" \
    "LOGTO_APP_SECRET" \
    "LOGTO_COOKIE_SECRET"

# AI Keys
create_or_update_item "MyFlow AI Keys" "login" \
    "OPENAI_API_KEY" \
    "ANTHROPIC_API_KEY"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Add your actual secret values to the 1Password items:"
echo "   op item edit 'MyFlow MongoDB' --vault='MyFlow Development' MONGODB_URI='your-connection-string'"
echo ""
echo "2. Test the configuration:"
echo "   op run --env-file=.env.template -- env | grep -E '(MONGODB|LOGTO|OPENAI|ANTHROPIC)'"
echo ""
echo "3. Run the development server:"
echo "   op run --env-file=.env.template -- bun run dev"
echo ""
echo "Or use the helper script:"
echo "   ./scripts/load-secrets.sh dev"
echo ""