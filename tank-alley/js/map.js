import * as THREE from "three";
import { aabbFromCenter } from "./collision.js";

/**
 * Hand-authored alley block with solid building footprints.
 * Visual detail is layered on top of the same collider AABBs used by gameplay.
 */
export function createAlleyMap(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = [];
  const buildings = [];

  // Shared materials (keep draw calls reasonable)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2c333a,
    roughness: 0.95,
    metalness: 0.04,
  });
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x4a525a,
    roughness: 0.9,
    metalness: 0.05,
  });
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x3a4148,
    roughness: 0.92,
    metalness: 0.04,
  });
  const markMat = new THREE.MeshStandardMaterial({
    color: 0x454e56,
    roughness: 1,
    metalness: 0,
  });
  const brickMats = [
    new THREE.MeshStandardMaterial({ color: 0x5e6770, roughness: 0.9, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ color: 0x6a737c, roughness: 0.88, metalness: 0.07 }),
    new THREE.MeshStandardMaterial({ color: 0x4e585f, roughness: 0.92, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x74808a, roughness: 0.86, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ color: 0x424a52, roughness: 0.93, metalness: 0.05 }),
  ];
  const plasterMats = [
    new THREE.MeshStandardMaterial({ color: 0x7a7f84, roughness: 0.85, metalness: 0.04 }),
    new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.86, metalness: 0.03 }),
    new THREE.MeshStandardMaterial({ color: 0x6d7278, roughness: 0.88, metalness: 0.04 }),
  ];
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x262d34,
    roughness: 0.72,
    metalness: 0.2,
  });
  const ledgeMat = new THREE.MeshStandardMaterial({
    color: 0x343c44,
    roughness: 0.8,
    metalness: 0.12,
  });
  const winLitMat = new THREE.MeshStandardMaterial({
    color: 0xe0c078,
    emissive: 0xb88828,
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.15,
  });
  const winDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1a2228,
    roughness: 0.5,
    metalness: 0.25,
    emissive: 0x0a1014,
    emissiveIntensity: 0.1,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1c2228,
    roughness: 0.7,
    metalness: 0.3,
  });
  const awningMat = new THREE.MeshStandardMaterial({
    color: 0x5a3a2e,
    roughness: 0.85,
    metalness: 0.05,
  });
  const metalPropMat = new THREE.MeshStandardMaterial({
    color: 0x2a3036,
    roughness: 0.55,
    metalness: 0.45,
  });
  const dumpsterMat = new THREE.MeshStandardMaterial({
    color: 0x2f5a3a,
    roughness: 0.7,
    metalness: 0.25,
  });
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x6e5644,
    roughness: 0.88,
    metalness: 0.05,
  });
  const crateStripeMat = new THREE.MeshStandardMaterial({
    color: 0x8a6a48,
    roughness: 0.8,
    metalness: 0.05,
  });
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    roughness: 0.65,
    metalness: 0.2,
  });
  const barrierStripeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.15,
  });
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1c2228,
    roughness: 0.55,
    metalness: 0.45,
  });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffd89a,
    emissive: 0xffb347,
    emissiveIntensity: 1.25,
  });
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x2a4050,
    roughness: 0.6,
    metalness: 0.2,
    emissive: 0x1a3040,
    emissiveIntensity: 0.2,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x3a2e28,
    roughness: 0.8,
    metalness: 0.1,
  });
  const acMat = new THREE.MeshStandardMaterial({
    color: 0x8a9298,
    roughness: 0.55,
    metalness: 0.35,
  });

  function addMesh(geo, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rz) m.rotation.z = opts.rz;
    m.castShadow = opts.cast !== false;
    m.receiveShadow = opts.receive !== false;
    group.add(m);
    return m;
  }

  // Ground + sidewalks along main alley
  addMesh(new THREE.PlaneGeometry(120, 120), groundMat, 0, 0, 0, { rx: -Math.PI / 2, cast: false });
  addMesh(new THREE.BoxGeometry(2.2, 0.12, 88), sidewalkMat, -4.6, 0.06, 0, { cast: false });
  addMesh(new THREE.BoxGeometry(2.2, 0.12, 88), sidewalkMat, 4.6, 0.06, 0, { cast: false });
  addMesh(new THREE.BoxGeometry(0.25, 0.22, 88), curbMat, -3.45, 0.11, 0);
  addMesh(new THREE.BoxGeometry(0.25, 0.22, 88), curbMat, 3.45, 0.11, 0);

  // Lane markings
  for (let i = -40; i <= 40; i += 7) {
    addMesh(new THREE.PlaneGeometry(0.28, 2.6), markMat, 0, 0.02, i, {
      rx: -Math.PI / 2,
      cast: false,
    });
  }

  function addFacadeWindows(x, z, w, d, h, wallMat) {
    const floors = Math.max(1, Math.floor((h - 1.2) / 2.8));
    const colsX = Math.max(1, Math.floor(w / 2.6));
    const colsZ = Math.max(1, Math.floor(d / 2.6));

    for (let f = 0; f < floors; f++) {
      const wy = 1.55 + f * 2.75;
      if (wy > h - 0.9) break;

      // X-facing facades
      for (let c = 0; c < colsZ; c++) {
        const wz = z - d / 2 + 1.3 + c * (d / colsZ);
        for (const side of [-1, 1]) {
          const wx = x + side * (w / 2 + 0.04);
          const lit = ((f + c + side + buildings.length) % 3) !== 0;
          const frame = addMesh(new THREE.BoxGeometry(0.08, 1.55, 1.2), frameMat, wx, wy, wz, {
            ry: side > 0 ? Math.PI / 2 : -Math.PI / 2,
          });
          void frame;
          addMesh(
            new THREE.PlaneGeometry(1.0, 1.3),
            lit ? winLitMat : winDarkMat,
            wx + side * 0.03,
            wy,
            wz,
            { ry: side > 0 ? Math.PI / 2 : -Math.PI / 2, cast: false }
          );
        }
      }

      // Z-facing facades
      for (let c = 0; c < colsX; c++) {
        const wx = x - w / 2 + 1.3 + c * (w / colsX);
        for (const side of [-1, 1]) {
          const wz = z + side * (d / 2 + 0.04);
          const lit = ((f + c + buildings.length) % 4) !== 1;
          addMesh(new THREE.BoxGeometry(1.2, 1.55, 0.08), frameMat, wx, wy, wz);
          addMesh(
            new THREE.PlaneGeometry(1.0, 1.3),
            lit ? winLitMat : winDarkMat,
            wx,
            wy,
            wz + side * 0.03,
            { ry: side > 0 ? 0 : Math.PI, cast: false }
          );
        }
      }
    }
  }

  function addBuilding(x, z, w, d, h) {
    const wallMat = brickMats[buildings.length % brickMats.length];
    const plaster = plasterMats[buildings.length % plasterMats.length];
    const variant = buildings.length % 3;

    // Main volume
    addMesh(new THREE.BoxGeometry(w, h, d), wallMat, x, h / 2, z);

    // Base course / plinth
    addMesh(new THREE.BoxGeometry(w + 0.15, 0.55, d + 0.15), ledgeMat, x, 0.28, z);

    // Mid ledge
    if (h > 6) {
      addMesh(new THREE.BoxGeometry(w + 0.2, 0.18, d + 0.2), ledgeMat, x, h * 0.45, z);
    }

    // Roof parapet + deck
    addMesh(new THREE.BoxGeometry(w + 0.35, 0.28, d + 0.35), roofMat, x, h + 0.08, z);
    addMesh(new THREE.BoxGeometry(w - 0.4, 0.12, d - 0.4), ledgeMat, x, h + 0.22, z);

    // Rooftop AC / vents (cheap urban silhouette)
    const acCount = 1 + (buildings.length % 2);
    for (let i = 0; i < acCount; i++) {
      const ax = x + (i - 0.3) * Math.min(2.2, w * 0.25);
      const az = z + ((buildings.length + i) % 2 === 0 ? 0.6 : -0.5);
      addMesh(new THREE.BoxGeometry(1.1, 0.7, 0.9), acMat, ax, h + 0.55, az);
      addMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 8), metalPropMat, ax, h + 1.05, az);
    }

    // Chimney on some buildings
    if (variant !== 1) {
      addMesh(
        new THREE.BoxGeometry(0.55, 1.4, 0.55),
        ledgeMat,
        x + w * 0.28,
        h + 0.9,
        z - d * 0.22
      );
    }

    addFacadeWindows(x, z, w, d, h, wallMat);

    // Ground-floor shop / door accents facing alley (toward x=0 when possible)
    const faceTowardAlley = Math.abs(x) > 3;
    if (faceTowardAlley) {
      const side = x > 0 ? -1 : 1;
      const fx = x + side * (w / 2 + 0.05);
      // Door
      addMesh(new THREE.BoxGeometry(0.08, 2.1, 1.0), doorMat, fx, 1.05, z, {
        ry: side > 0 ? Math.PI / 2 : -Math.PI / 2,
      });
      // Awning
      if (variant !== 2) {
        addMesh(new THREE.BoxGeometry(0.9, 0.08, Math.min(3.2, d * 0.55)), awningMat, fx + side * 0.4, 2.35, z, {
          ry: side > 0 ? Math.PI / 2 : -Math.PI / 2,
        });
      }
      // Signboard
      addMesh(new THREE.BoxGeometry(0.1, 0.55, 1.6), signMat, fx + side * 0.08, 3.1, z + 0.2, {
        ry: side > 0 ? Math.PI / 2 : -Math.PI / 2,
      });
    } else {
      // Mid-block doors on Z faces
      addMesh(new THREE.BoxGeometry(1.0, 2.1, 0.08), doorMat, x, 1.05, z - d / 2 - 0.04);
    }

    // Corner pipes / gutters
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        if ((sx + sz + buildings.length) % 2 !== 0) continue;
        addMesh(
          new THREE.CylinderGeometry(0.07, 0.07, h * 0.85, 6),
          metalPropMat,
          x + sx * (w / 2 - 0.15),
          h * 0.42,
          z + sz * (d / 2 - 0.15)
        );
      }
    }

    // Balcony slabs on taller buildings
    if (h >= 9 && w >= 10) {
      const side = x >= 0 ? -1 : 1;
      addMesh(
        new THREE.BoxGeometry(0.7, 0.1, 2.2),
        ledgeMat,
        x + side * (w / 2 + 0.25),
        4.2,
        z,
        { ry: Math.PI / 2 }
      );
      addMesh(
        new THREE.BoxGeometry(0.08, 0.7, 2.2),
        frameMat,
        x + side * (w / 2 + 0.55),
        4.55,
        z,
        { ry: Math.PI / 2 }
      );
    }

    // Plaster inset panel for variety
    if (variant === 1) {
      addMesh(
        new THREE.BoxGeometry(Math.max(2, w * 0.35), Math.max(2.5, h * 0.35), 0.12),
        plaster,
        x,
        h * 0.55,
        z + (d / 2 + 0.05) * (z >= 0 ? 1 : -1)
      );
    }

    const box = aabbFromCenter(x, z, w / 2, d / 2);
    colliders.push(box);
    buildings.push({ box, x, z, w, d, h });
  }

  // Outer boundary walls
  addBuilding(0, -48, 90, 6, 10);
  addBuilding(0, 48, 90, 6, 10);
  addBuilding(-48, 0, 6, 90, 10);
  addBuilding(48, 0, 6, 90, 10);

  // Central north-south alley flanked by buildings
  addBuilding(-14, -28, 12, 14, 9);
  addBuilding(-15, -10, 14, 12, 11);
  addBuilding(-13, 8, 11, 14, 8);
  addBuilding(-16, 26, 15, 12, 12);

  addBuilding(14, -26, 12, 12, 10);
  addBuilding(15, -8, 14, 14, 9);
  addBuilding(13, 10, 11, 12, 11);
  addBuilding(16, 28, 15, 14, 8);

  addBuilding(-28, -18, 10, 10, 7);
  addBuilding(-29, 6, 12, 10, 9);
  addBuilding(28, -6, 10, 12, 8);
  addBuilding(29, 16, 12, 10, 10);

  addBuilding(-6, -18, 5, 8, 6);
  addBuilding(7, 18, 5, 8, 7);
  addBuilding(-5, 22, 4, 6, 5);
  addBuilding(6, -30, 4, 6, 5);

  // --- Props (colliders match previous crate footprints where reused) ---
  function addCrateStack(x, z, s = 1.2) {
    addMesh(new THREE.BoxGeometry(s, s, s), crateMat, x, s / 2, z);
    addMesh(new THREE.BoxGeometry(s * 0.92, 0.08, s * 0.92), crateStripeMat, x, s + 0.02, z);
    if (s > 1.05) {
      addMesh(new THREE.BoxGeometry(s * 0.7, s * 0.55, s * 0.7), crateMat, x + 0.15, s + s * 0.35, z - 0.1);
    }
    colliders.push(aabbFromCenter(x, z, s / 2, s / 2));
  }

  function addDumpster(x, z) {
    addMesh(new THREE.BoxGeometry(1.8, 1.2, 1.1), dumpsterMat, x, 0.6, z);
    addMesh(new THREE.BoxGeometry(1.85, 0.1, 1.15), metalPropMat, x, 1.22, z);
    addMesh(new THREE.BoxGeometry(0.15, 0.35, 0.15), metalPropMat, x - 0.7, 1.4, z + 0.35);
    addMesh(new THREE.BoxGeometry(0.15, 0.35, 0.15), metalPropMat, x + 0.7, 1.4, z + 0.35);
    colliders.push(aabbFromCenter(x, z, 0.95, 0.6));
  }

  function addBarrier(x, z, yaw = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.35), barrierMat);
    body.position.y = 0.45;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.18, 0.36), barrierStripeMat);
    stripe.position.y = 0.55;
    g.add(stripe);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.45), metalPropMat);
    legL.position.set(-0.55, 0.18, 0);
    g.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.55;
    g.add(legR);
    group.add(g);
    colliders.push(aabbFromCenter(x, z, 0.85, 0.35));
  }

  function addSandbags(x, z) {
    for (let i = 0; i < 3; i++) {
      addMesh(
        new THREE.BoxGeometry(0.9, 0.35, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x8a7a58, roughness: 0.95 }),
        x + (i - 1) * 0.15,
        0.2 + i * 0.12,
        z + (i % 2) * 0.1
      );
    }
    colliders.push(aabbFromCenter(x, z, 0.7, 0.45));
  }

  addCrateStack(-3.5, 2, 1.1);
  addCrateStack(3.2, -14, 1.3);
  addCrateStack(-2.8, 32, 1.0);
  addCrateStack(4.0, 6, 1.2);

  addDumpster(-3.8, -8);
  addDumpster(3.6, 14);
  addDumpster(-3.2, 24);

  addBarrier(2.2, -22, 0.2);
  addBarrier(-2.4, 4, -0.15);
  addBarrier(2.0, 30, 0.1);

  addSandbags(-2.6, -28);
  addSandbags(2.8, 20);

  // Trash bags / rubble piles (visual only, tiny)
  const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x4a4540, roughness: 0.95 });
  for (const [rx, rz] of [
    [-3.2, -18],
    [3.4, -2],
    [-3.6, 10],
    [3.0, 26],
  ]) {
    addMesh(new THREE.SphereGeometry(0.35, 6, 5), rubbleMat, rx, 0.22, rz);
    addMesh(new THREE.SphereGeometry(0.25, 6, 5), rubbleMat, rx + 0.3, 0.16, rz + 0.2);
  }

  // Street lamps with arms
  const lampPositions = [
    [-5, -20],
    [5, -4],
    [-5, 12],
    [5, 28],
    [-22, -2],
    [22, 8],
  ];
  for (const [lx, lz] of lampPositions) {
    addMesh(new THREE.CylinderGeometry(0.12, 0.18, 5.2, 8), poleMat, lx, 2.6, lz);
    addMesh(new THREE.BoxGeometry(0.12, 0.12, 1.1), poleMat, lx + (lx < 0 ? 0.45 : -0.45), 5.15, lz);
    addMesh(new THREE.SphereGeometry(0.28, 10, 10), lampMat, lx + (lx < 0 ? 0.9 : -0.9), 5.0, lz, {
      cast: false,
    });
    const light = new THREE.PointLight(0xffc878, 1.55, 22, 2);
    light.position.set(lx + (lx < 0 ? 0.9 : -0.9), 4.95, lz);
    light.castShadow = false;
    group.add(light);
  }

  // Utility poles with wires (visual)
  for (const [px, pz] of [
    [-6.5, -12],
    [6.5, 8],
    [-6.5, 22],
  ]) {
    addMesh(new THREE.CylinderGeometry(0.1, 0.12, 7.5, 6), poleMat, px, 3.75, pz);
    addMesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), metalPropMat, px, 7.2, pz);
  }

  const playerSpawn = { x: 0, z: -36, yaw: 0 };
  const enemySpawns = [
    { x: 0, z: 34, yaw: Math.PI },
    { x: -22, z: -8, yaw: Math.PI / 2 },
    { x: 22, z: 4, yaw: -Math.PI / 2 },
    { x: 0, z: 8, yaw: Math.PI },
  ];

  return { group, colliders, buildings, playerSpawn, enemySpawns };
}
