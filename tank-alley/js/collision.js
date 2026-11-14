/** Axis-aligned 2D footprint helpers (XZ plane). */

export function aabbFromCenter(x, z, halfW, halfD) {
  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
  };
}

export function aabbIntersects(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function pointInAabb(x, z, box) {
  return x >= box.minX && x <= box.maxX && z >= box.minZ && z <= box.maxZ;
}

/** Resolve circle-vs-AABB by pushing the circle center out of the box. */
export function resolveCircleAabb(cx, cz, radius, box) {
  const nearestX = Math.max(box.minX, Math.min(cx, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));
  let dx = cx - nearestX;
  let dz = cz - nearestZ;
  const distSq = dx * dx + dz * dz;
  if (distSq >= radius * radius) return { x: cx, z: cz, hit: false };

  if (distSq === 0) {
    // Center inside AABB — push along shallowest axis
    const left = cx - box.minX;
    const right = box.maxX - cx;
    const top = cz - box.minZ;
    const bottom = box.maxZ - cz;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: box.minX - radius, z: cz, hit: true };
    if (m === right) return { x: box.maxX + radius, z: cz, hit: true };
    if (m === top) return { x: cx, z: box.minZ - radius, hit: true };
    return { x: cx, z: box.maxZ + radius, hit: true };
  }

  const dist = Math.sqrt(distSq);
  const push = (radius - dist) / dist;
  return { x: cx + dx * push, z: cz + dz * push, hit: true };
}

/** Segment vs AABB (XZ). Returns hit distance along segment or null. */
export function segmentHitsAabb(x0, z0, x1, z1, box) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  let tMin = 0;
  let tMax = 1;

  const axes = [
    [dx, x0, box.minX, box.maxX],
    [dz, z0, box.minZ, box.maxZ],
  ];

  for (const [delta, origin, min, max] of axes) {
    if (Math.abs(delta) < 1e-8) {
      if (origin < min || origin > max) return null;
      continue;
    }
    let t1 = (min - origin) / delta;
    let t2 = (max - origin) / delta;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}
