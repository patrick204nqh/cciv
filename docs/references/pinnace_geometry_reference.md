# Ship Pinnace Geometry Reference

Source: [Poly Haven ship_pinnace](https://polyhaven.com/a/ship_pinnace) (CC0) — rigged colonial pinnace, 184K polys, 7 meshes.

## Scene Structure

| Mesh | Blender Name | Verts | Tris | Materials | Z Range |
|---|---|---|---|---|---|
| 0 aft | Plane.041 | 32,410 | 48,366 | baseColor + normal + ARM | -18.2 to -13.0 |
| 1 rigging | Cylinder.042 | 76,423 | 98,673 | baseColor + normal + ARM | -18.9 to +20.9 |
| 2 details | Plane.046 | 23,100 | 38,478 | baseColor + normal + ARM | -17.8 to +17.1 |
| 3 hull | Plane.498 | 15,424 | 25,450 | baseColor + normal + ARM | -16.6 to +16.6 |
| 4 deck | Plane.057 | 11,715 | 14,043 | baseColor + normal + ARM | -18.0 to +14.4 |
| 5 interior | Plane.043 | 5,196 | 9,465 | baseColor + normal + ARM | -17.2 to +14.2 |
| 6 sails | Plane.002 | 6,468 | 18,000 | baseColor + normal + ARM, alpha mask | -11.5 to +18.6 |

## Hull Dimensions

- **Length**: ~33.2m (Z: -16.6 to +16.6)
- **Max beam**: ~9.07m at Z=+2.0 (slightly aft of midship)
- **Depth**: ~10.3m (Y: -2.4 to +7.9)
- **Beam/Length ratio**: 0.27

## Hull Shape Profile

### Sheer (top edge Y per Z)

```
Z      | Sheer Y   | Bottom Y  | Beam
-16.5  | 7.93      | -0.54     | 7.30     (stern — high, narrow)
-14.0  | 7.42      | -1.70     | 5.81
-10.0  | 6.55      | -1.70     | 7.25
 -6.0  | 5.78      | -1.70     | 8.52
  0.0  | 4.26      | -1.70     | 8.97     (amidships — lowest sheer)
 +6.0  | 5.41      | -1.70     | 8.90
+10.0  | 5.72      | -1.61     | 7.80
+14.0  | 4.17      | +0.61     | 3.53     (bow — rising, narrowing)
+16.5  | 4.42      | +3.08     | 0.56
```

**Sheer curve pattern**: High at stern (7.93), lowest amidships (4.26), rises toward bow (4.42). Total sheer drop from stern to midship ≈ 3.7m over 16.5m (22%).

### Deck Sheer (centerline Y per Z)

```
Z      | Deck Y    | Beam     | Camber
-18.0  | 8.99      | 1.08     | 0.03     (poop deck)
-15.0  | 7.36      | 4.91     | 0.28
 -9.0  | 5.58      | 6.69     | 0.38
 -5.0  | 5.84      | 6.88     | 0.26
 +1.5  | 2.98      | 8.16     | 0.00     (lowest deck point)
 +7.0  | 5.60      | 7.25     | 0.21
+12.0  | 5.79      | 6.53     | 1.46     (forecastle)
```

### Deadrise

Bottom is at Y≈-1.7 along most of length, dipping to -2.4 at the tuck points (Z=-16, Z=+12). This gives a V-shaped bottom with slight hollow at the ends.

### Tumblehome

The deck is narrower than max beam by ~12-17% amidships, and much more pronounced at the stern (~35-43%). The hull flares outward from deck to max beam, then tapers in toward the keel — giving the classic "apple-cheeked" ship profile.

| Z | Max Beam | Deck Beam | Tumblehome |
|---|---|---|---|
| -16.5 | 7.30 | 4.19 | 0.573 |
| -10.0 | 7.25 | 5.81 | 0.801 |
| 0.0 | 8.97 | 7.75 | 0.864 |
| +6.0 | 8.90 | 5.13 | 0.577 |
| +10.0 | 7.80 | 7.15 | 0.917 |

## Rigging

- **Max height**: Y=30.16 (~3.8× hull depth — masts reach well above hull)
- **Min height**: Y=2.69 (base of masts on deck)
- **Z extent**: -18.9 to +20.9 (rigging extends slightly beyond hull ends)
- **Total vertices**: 76,423 (most complex mesh — includes shrouds, ratlines, stays, yards)

## Sails

- **Y range**: 5.51 to 24.08 (sails start above deck, reach near mast tops)
- **Z range**: -11.5 to +18.6
- **Material**: Alpha mask mode (transparency via alpha cutoff), 6.5K verts but 36K indices (heavy triangulation for wind-billow shape)
- Dedicated `sails_alpha` map provides per-pixel transparency

## Lessons for Procedural Hull

1. **Sheer curve**: Use a parabolic function peaking at stern (max) and bow (moderate), minimum at ~55-60% from bow.
2. **Beam distribution**: Max beam slightly aft of midship (55-60% from bow), with rapid narrowing in last 15% at both ends.
3. **Tumblehome**: Flare out below the deck, then taper in toward keel. ~15% narrowing at midship, 40%+ at stern.
4. **Deadrise**: Flat-ish bottom (Y≈constant) with slight V and keel dip at the tuck.
5. **Keel projection**: Keel extends below hull at both ends by ~0.7m relative to the flat bottom.
6. **Deck camber**: ~0.2-0.5 units crown across the beam.
7. **Rigging complexity**: The real mesh uses 76K verts for rigging alone — our procedural rigging is much simpler but captures the key lines.
8. **Sail structure**: Sails are subdivided planes (grids) with alpha-mask edges, allowing detailed cloth geometry with efficient rendering.
