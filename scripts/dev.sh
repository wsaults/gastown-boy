#!/bin/bash
# Start gastown-boy dev servers with optional GT directory
#
# Usage:
#   ./scripts/dev.sh [GT_DIR]
#   npm run dev [-- GT_DIR]
#
# Arguments:
#   GT_DIR  Path to gastown town directory (default: ~/gt)
#
# Examples:
#   npm run dev                    # Uses ~/gt
#   npm run dev -- /path/to/town   # Uses custom path
#   npm run dev -- ~/my-gastown    # Uses ~/my-gastown

set -e

# Get GT directory from argument or default to ~/gt
GT_DIR="${1:-$HOME/gt}"

# Expand tilde if present
GT_DIR="${GT_DIR/#\~/$HOME}"

# Validate directory exists
if [ ! -d "$GT_DIR" ]; then
    echo "Error: GT directory does not exist: $GT_DIR"
    echo "Usage: npm run dev [-- /path/to/gt]"
    exit 1
fi

# Check for town.json marker
if [ ! -f "$GT_DIR/mayor/town.json" ]; then
    echo "Warning: $GT_DIR does not appear to be a gastown town (missing mayor/town.json)"
    echo "Continuing anyway..."
fi

echo "Starting gastown-boy with GT_TOWN_ROOT=$GT_DIR"
echo ""

# Kill any existing processes on our ports
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

# Export GT_TOWN_ROOT and start both servers
export GT_TOWN_ROOT="$GT_DIR"
npx concurrently -k -n backend,frontend -c blue,green \
    "cd backend && npm run dev" \
    "cd frontend && npm run dev"
