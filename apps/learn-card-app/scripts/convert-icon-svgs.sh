#!/bin/bash
#
# convert-icon-svgs.sh — Batch-convert SVG icon files to React TSX components.
#
# Uses @svgr/cli to transform raw SVGs (e.g. Figma exports) into React
# components with proper JSX attribute names (camelCase) and TypeScript types.
#
# Prerequisites:
#   - Node.js / npx available on PATH
#   - @svgr/cli will be fetched automatically by npx if not installed
#
# Usage:
#   1. Export SVGs from Figma into subdirectories under src/theme/icons/<tenant>/
#      Recommended structure:
#        category-icons/           — 70×70 card icons (IconWithShape)
#        individual-page-category-icons/ — ~55×55 page icons (Icon)
#        menu-icons/               — navbar/side-menu icons
#        other-icons/              — miscellaneous icons
#
#   2. cd into the tenant icon directory:
#        cd apps/learn-card-app/src/theme/icons/<tenant>
#
#   3. Run this script:
#        bash ../../scripts/convert-icon-svgs.sh
#      Or from repo root:
#        bash apps/learn-card-app/scripts/convert-icon-svgs.sh
#
#   4. A .tsx file is created next to each .svg. Spaces/equals in filenames
#      are replaced with underscores.
#
#   5. After conversion, create a barrel index.ts and register the icon set
#      in src/theme/icons/iconSets.ts as a partial set extending "formal".
#
# Flags passed to SVGR:
#   --typescript    Emit .tsx with SVGProps<SVGSVGElement> typing
#   --no-dimensions Remove hardcoded width/height so icons size via className
#

set -e

DIRS=("category-icons" "individual-page-category-icons" "menu-icons" "other-icons")
TOTAL=0
DONE=0

# Count total SVGs
for dir in "${DIRS[@]}"; do
  count=$(ls "$dir"/*.svg 2>/dev/null | wc -l | tr -d ' ')
  TOTAL=$((TOTAL + count))
done

echo "🔄 Converting $TOTAL SVG files to React TSX components..."
echo ""

for dir in "${DIRS[@]}"; do
  echo "── $dir ──"
  for f in "$dir"/*.svg; do
    [ -f "$f" ] || continue
    base=$(basename "$f" .svg)
    safe=$(echo "$base" | tr ' ' '_' | tr '=' '_')
    out="$dir/${safe}.tsx"
    DONE=$((DONE + 1))
    printf "  [%d/%d] %s → %s ... " "$DONE" "$TOTAL" "$base" "$(basename "$out")"
    npx @svgr/cli --typescript --no-dimensions -- "$f" > "$out" 2>/dev/null
    echo "✅"
  done
  echo ""
done

echo "✅ All $TOTAL icons converted!"
echo ""
echo "Generated TSX files:"
for dir in "${DIRS[@]}"; do
  ls "$dir"/*.tsx 2>/dev/null | while read -r t; do echo "  $t"; done
done
