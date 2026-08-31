#!/usr/bin/env bash
# Optimize a raw glTF/GLB for web AR delivery.
# Usage: ./optimize-models.sh <input.glb|input.gltf> <output-name>
# Example: ./optimize-models.sh downloads/wind_turbine.glb turbine
#          -> assets/models/turbine.glb
#
# Requires: npm install -g @gltf-transform/cli

set -euo pipefail

IN="${1:?input model path required}"
NAME="${2:?output name required (e.g. turbine)}"
OUT="assets/models/${NAME}.glb"
TMP="$(mktemp -d)"

echo "== Input: $IN"
gltf-transform inspect "$IN" | sed -n '1,20p' || true

# 1. clean up
gltf-transform dedup "$IN" "$TMP/1.glb"
gltf-transform prune "$TMP/1.glb" "$TMP/2.glb"

# 2. textures: shrink + compress
gltf-transform resize "$TMP/2.glb" "$TMP/3.glb" --width 1024 --height 1024
gltf-transform webp "$TMP/3.glb" "$TMP/4.glb" --quality 80

# 3. geometry: weld then decimate (~50% of original triangles)
gltf-transform weld "$TMP/4.glb" "$TMP/5.glb"
gltf-transform simplify "$TMP/5.glb" "$TMP/6.glb" --ratio 0.5 --error 0.001

# 4. Draco geometry compression
gltf-transform draco "$TMP/6.glb" "$OUT"

echo
echo "== Output: $OUT"
gltf-transform inspect "$OUT" | sed -n '1,20p' || true
ls -lh "$IN" "$OUT" | awk '{print $5, $9}'

rm -rf "$TMP"
