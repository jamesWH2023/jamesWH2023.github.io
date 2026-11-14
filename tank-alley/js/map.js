import * as THREE from "three";
import { aabbFromCenter } from "./collision.js";

/**
 * Hand-authored alley block with solid building footprints.
 * Coordinates are meters on the XZ plane.
 */
export function createAlleyMap(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = [];
  const buildings = [];

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2a3036,
    roughness: 0.92,
    metalness: 0.05,
  });
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    groundMat
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.receiveShadow = true;
  group.add(asphalt);

  // Subtle lane markings
  const markMat = new THREE.MeshStandardMaterial({
    color: 0x3a424a,
    roughness: 1,
    metalness: 0,
  });
  for (let i = -40; i <= 40; i += 8) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.2), markMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.02, i);
    group.add(stripe);
  }

  const wallPalette = [0x5c6570, 0x6a737c, 0x4e585f, 0x74808a, 0x3f474e];
  const roofPalette = [0x2c333a, 0x23292f, 0x353c44];

  function addBuilding(x, z, w, d, h) {
    const wallColor = wallPalette[(buildings.length + Math.abs(Math.round(x + z))) % wallPalette.length];
    const roofColor = roofPalette[buildings.length % roofPalette.length];

    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.88,
      metalness: 0.08,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.75,
      metalness: 0.15,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(x, h / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.35, d + 0.3), roofMat);
    roof.position.set(x, h + 0.1, z);
    roof.castShadow = true;
    group.add(roof);

    // Fake windows
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xd8b56a,
      emissive: 0xa87820,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.2,
    });
    const floors = Math.max(1, Math.floor(h / 3.2));
    for (let f = 0; f < floors; f++) {
      const wy = 1.4 + f * 3.0;
      if (wy > h - 0.8) break;
      for (const side of [-1, 1]) {
        const wx = x + side * (w / 2 + 0.02);
        if (w > 4) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), winMat);
          win.position.set(wx, wy, z);
          win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
          group.add(win);
        }
        const wz = z + side * (d / 2 + 0.02);
        if (d > 4) {
          const win2 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), winMat);
          win2.position.set(x, wy, wz);
          win2.rotation.y = side > 0 ? 0 : Math.PI;
          group.add(win2);
        }
      }
    }

    const box = aabbFromCenter(x, z, w / 2, d / 2);
    colliders.push(box);
    buildings.push({ mesh: body, box, x, z, w, d, h });
  }

  // Outer boundary walls
  addBuilding(0, -48, 90, 6, 10);
  addBuilding(0, 48, 90, 6, 10);
  addBuilding(-48, 0, 6, 90, 10);
  addBuilding(48, 0, 6, 90, 10);

  // Central north-south alley flanked by buildings
  // West block row
  addBuilding(-14, -28, 12, 14, 9);
  addBuilding(-15, -10, 14, 12, 11);
  addBuilding(-13, 8, 11, 14, 8);
  addBuilding(-16, 26, 15, 12, 12);

  // East block row
  addBuilding(14, -26, 12, 12, 10);
  addBuilding(15, -8, 14, 14, 9);
  addBuilding(13, 10, 11, 12, 11);
  addBuilding(16, 28, 15, 14, 8);

  // Cross-alley chokepoints / side stubs
  addBuilding(-28, -18, 10, 10, 7);
  addBuilding(-29, 6, 12, 10, 9);
  addBuilding(28, -6, 10, 12, 8);
  addBuilding(29, 16, 12, 10, 10);

  // Mid islands creating T-junctions
  addBuilding(-6, -18, 5, 8, 6);
  addBuilding(7, 18, 5, 8, 7);
  addBuilding(-5, 22, 4, 6, 5);
  addBuilding(6, -30, 4, 6, 5);

  // Debris / crates (low blockers)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.85 });
  function addCrate(x, z, s = 1.2) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), crateMat);
    crate.position.set(x, s / 2, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
    colliders.push(aabbFromCenter(x, z, s / 2, s / 2));
  }
  addCrate(-3.5, 2, 1.1);
  addCrate(3.2, -14, 1.3);
  addCrate(-2.8, 32, 1.0);
  addCrate(4.0, 6, 1.2);

  // Street lamps
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1c2228, roughness: 0.6, metalness: 0.4 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffd89a,
    emissive: 0xffb347,
    emissiveIntensity: 1.2,
  });
  const lampPositions = [
    [-5, -20],
    [5, -4],
    [-5, 12],
    [5, 28],
    [-22, -2],
    [22, 8],
  ];
  for (const [lx, lz] of lampPositions) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.5, 8), poleMat);
    pole.position.set(lx, 2.75, lz);
    pole.castShadow = true;
    group.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), lampMat);
    bulb.position.set(lx, 5.4, lz);
    group.add(bulb);
    const light = new THREE.PointLight(0xffc878, 1.6, 22, 2);
    light.position.set(lx, 5.2, lz);
    light.castShadow = false;
    group.add(light);
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
