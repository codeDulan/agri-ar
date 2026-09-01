#!/usr/bin/env bash
# Optimize a raw glTF/GLB for web AR delivery.
# Usage: ./optimize-models.sh <input.glb|input.gltf> <output-name>
# Example: ./optimize-models.sh ~/Downloads/wind_turbine.glb turbine
#          -> assets/models/turbine.glb
#
# Uses gltf-transform via npx (no global install needed).

set -euo pipefail

IN="${1:?input model path required}"
NAME="${2:?output name required (e.g. turbine)}"
OUT="assets/models/${NAME}.glb"
TMP="$(mktemp -d)"

gt() { npx --yes @gltf-transform/cli@4 "$@"; }

echo "== Optimizing: $IN"

gt dedup    "$IN"          "$TMP/1.glb"          # merge duplicate accessors/meshes
gt prune    "$TMP/1.glb"   "$TMP/2.glb"          # drop unused nodes/materials
gt center   "$TMP/2.glb"   "$TMP/3.glb" --pivot below   # origin at base, so it sits on the marker/plane
gt resize   "$TMP/3.glb"   "$TMP/4.glb" --width 512 --height 512     # cap texture size
gt webp     "$TMP/4.glb"   "$TMP/5.glb" --quality 72                 # texture compression
gt weld     "$TMP/5.glb"   "$TMP/6.glb"          # merge coincident vertices
gt simplify "$TMP/6.glb"   "$TMP/7.glb" --ratio 0.65 --error 0.002   # polygon reduction
gt draco    "$TMP/7.glb"   "$OUT"                # geometry compression

echo
RAW=$(stat -f%z "$IN"); FIN=$(stat -f%z "$OUT")
echo "== $OUT"
echo "   size:  $RAW B  ->  $FIN B"
gt inspect "$OUT" 2>/dev/null | grep -iE "glPrimitives|vertices|meshes" | head -6 || true

rm -rf "$TMP"
