# 3D models — sourcing & optimization

The scene expects two files in this folder:

| File | Role | Target size |
|------|------|-------------|
| `turbine.glb` | Wind turbine — rotation speed driven by live wind data | ≤ 400 KB |
| `crop.glb` | Crop / plant cluster — colour driven by live air quality | ≤ 400 KB |

Until these exist the app shows primitive placeholders (see `#turbine-fallback`
/ `#crop-fallback` in the HTML), so you can keep developing.

## 1. Source CC-licensed models

Pick **one** per row. Prefer glTF/GLB downloads.

**Turbine**
- Poly Pizza – search "wind turbine" (many CC0): https://poly.pizza/
- Sketchfab – "wind turbine low poly", filter Downloadable + CC-BY

**Crop / plant**
- Poly Pizza – "plant", "corn", "wheat", "crop"
- Sketchfab – "low poly plant" / "corn plant"
- Kenney Nature Kit (CC0): https://kenney.nl/assets/nature-kit

Record the exact URL, author, and licence — they go in the root `README.md`
Credits section and in the report.

## 2. Optimize (this is the marked "web delivery" requirement)

Install the toolchain once:

```bash
npm install -g @gltf-transform/cli
```

Then run our helper on each raw download:

```bash
./optimize-models.sh path/to/raw-turbine.glb turbine
./optimize-models.sh path/to/raw-plant.glb   crop
```

The script (in the repo root) applies, in order:

1. `dedup` + `prune` — remove duplicate/unused data
2. `resize` textures to max 1024 px
3. `webp` texture compression
4. `weld` + `simplify` — polygon reduction (~50% target, ratio 0.5)
5. `draco` — geometry compression

Note the **before/after** file size and triangle count that the CLI prints —
put that table in the report (e.g. "turbine: 3.1 MB / 48k tris → 210 KB / 12k tris").

## 3. Verify

Drag the output `.glb` onto https://gltf-viewer.donmccurdy.com/ and check it
still looks right and reports Draco compression.
