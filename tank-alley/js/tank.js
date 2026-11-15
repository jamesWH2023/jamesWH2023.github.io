import * as THREE from "three";
import { resolveCircleAabb } from "./collision.js";

/**
 * Stylized low-poly WWII-inspired tank catalog.
 * Original geometry — silhouettes evoke historical types, not CAD replicas.
 */
export const TANK_TYPES = {
  sherman: {
    id: "sherman",
    name: "M4 Sherman",
    shortName: "Sherman",
    nation: "Allied",
    role: "medium",
    isPlayerDefault: true,
    maxHealth: 100,
    speed: 11,
    turnSpeed: 2.4,
    turretTurnSpeed: 3.2,
    reloadTime: 0.85,
    shellDamage: 34,
    shellSpeed: 42,
    radius: 1.55,
    colors: {
      hull: 0x4a6b3a,
      accent: 0x3a5530,
      turret: 0x455f38,
      track: 0x1a1c1a,
      metal: 0x2a2e2a,
    },
  },
  panzer4: {
    id: "panzer4",
    name: "Pz.Kpfw. IV",
    shortName: "Pz.IV",
    nation: "Axis",
    role: "medium",
    maxHealth: 75,
    speed: 7.6,
    turnSpeed: 1.75,
    turretTurnSpeed: 2.0,
    reloadTime: 1.25,
    shellDamage: 20,
    shellSpeed: 36,
    radius: 1.55,
    colors: {
      hull: 0x8a7a48,
      accent: 0x6e6140,
      turret: 0x7a6c42,
      track: 0x1c1a16,
      metal: 0x2e2a24,
    },
  },
  t34: {
    id: "t34",
    name: "T-34",
    shortName: "T-34",
    nation: "Soviet",
    role: "medium",
    maxHealth: 80,
    speed: 8.2,
    turnSpeed: 1.85,
    turretTurnSpeed: 2.1,
    reloadTime: 1.2,
    shellDamage: 22,
    shellSpeed: 38,
    radius: 1.5,
    colors: {
      hull: 0x3d4a36,
      accent: 0x2f3a2a,
      turret: 0x455240,
      track: 0x161816,
      metal: 0x242820,
    },
  },
  tiger: {
    id: "tiger",
    name: "Tiger I",
    shortName: "Tiger",
    nation: "Axis",
    role: "heavy",
    maxHealth: 120,
    speed: 5.8,
    turnSpeed: 1.25,
    turretTurnSpeed: 1.55,
    reloadTime: 1.55,
    shellDamage: 28,
    shellSpeed: 40,
    radius: 1.75,
    colors: {
      hull: 0x5a5848,
      accent: 0x484638,
      turret: 0x525044,
      track: 0x141412,
      metal: 0x2a2824,
    },
  },
  stuart: {
    id: "stuart",
    name: "M3 Stuart",
    shortName: "Stuart",
    nation: "Allied",
    role: "light",
    maxHealth: 45,
    speed: 10.5,
    turnSpeed: 2.4,
    turretTurnSpeed: 2.8,
    reloadTime: 0.95,
    shellDamage: 12,
    shellSpeed: 34,
    radius: 1.25,
    colors: {
      hull: 0x6a5a38,
      accent: 0x56482e,
      turret: 0x625436,
      track: 0x1a1814,
      metal: 0x2c2820,
    },
  },
};

export const ENEMY_TYPE_ROTATION = ["panzer4", "t34", "tiger", "stuart"];

function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

function mats(colors) {
  return {
    hull: new THREE.MeshStandardMaterial({ color: colors.hull, roughness: 0.68, metalness: 0.28 }),
    accent: new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.72, metalness: 0.22 }),
    turret: new THREE.MeshStandardMaterial({ color: colors.turret, roughness: 0.6, metalness: 0.32 }),
    track: new THREE.MeshStandardMaterial({ color: colors.track, roughness: 0.95, metalness: 0.08 }),
    metal: new THREE.MeshStandardMaterial({ color: colors.metal, roughness: 0.45, metalness: 0.55 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0c0e0c, roughness: 0.98, metalness: 0.04 }),
    barrel: new THREE.MeshStandardMaterial({ color: 0x1a1c1a, roughness: 0.4, metalness: 0.62 }),
  };
}

function addRunningGear(group, m, { width = 2.2, length = 3.2, wheelCount = 3, scale = 1 }) {
  const half = width / 2;
  for (const side of [-1, 1]) {
    const sx = side * half;
    const skirt = mesh(new THREE.BoxGeometry(0.38 * scale, 0.65 * scale, length), m.track);
    skirt.position.set(sx, 0.38 * scale, 0);
    group.add(skirt);

    for (let i = 0; i < wheelCount; i++) {
      const t = wheelCount === 1 ? 0 : (i / (wheelCount - 1)) * 2 - 1;
      const wheel = mesh(new THREE.CylinderGeometry(0.26 * scale, 0.26 * scale, 0.34 * scale, 10), m.rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx, 0.26 * scale, t * (length * 0.32));
      group.add(wheel);
    }

    const sprocket = mesh(new THREE.CylinderGeometry(0.3 * scale, 0.3 * scale, 0.32 * scale, 10), m.metal);
    sprocket.rotation.z = Math.PI / 2;
    sprocket.position.set(sx, 0.32 * scale, length * 0.42);
    group.add(sprocket);

    const idler = mesh(new THREE.CylinderGeometry(0.24 * scale, 0.24 * scale, 0.3 * scale, 8), m.metal);
    idler.rotation.z = Math.PI / 2;
    idler.position.set(sx, 0.28 * scale, -length * 0.42);
    group.add(idler);
  }
}

function addStarMark(parent, m, x, y, z) {
  // Simple white star plate (Allied marking) — geometric, not a logo asset
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e0,
    roughness: 0.7,
    metalness: 0.1,
  });
  const plate = mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), starMat, false);
  plate.position.set(x, y, z);
  parent.add(plate);
  const cross = mesh(new THREE.BoxGeometry(0.12, 0.38, 0.05), m.metal, false);
  cross.position.set(x, y, z + 0.01);
  parent.add(cross);
  const cross2 = mesh(new THREE.BoxGeometry(0.38, 0.12, 0.05), m.metal, false);
  cross2.position.set(x, y, z + 0.01);
  parent.add(cross2);
}

function addBalkenMark(parent, x, y, z, ry = 0) {
  // Stylized black/white cross marking (geometric)
  const white = new THREE.MeshStandardMaterial({ color: 0xe0e0d8, roughness: 0.75, metalness: 0.05 });
  const black = new THREE.MeshStandardMaterial({ color: 0x121210, roughness: 0.8, metalness: 0.05 });
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  const outer = mesh(new THREE.BoxGeometry(0.5, 0.5, 0.04), white, false);
  g.add(outer);
  const inner = mesh(new THREE.BoxGeometry(0.34, 0.34, 0.05), black, false);
  inner.position.z = 0.01;
  g.add(inner);
  const barH = mesh(new THREE.BoxGeometry(0.42, 0.1, 0.06), white, false);
  barH.position.z = 0.02;
  g.add(barH);
  const barV = mesh(new THREE.BoxGeometry(0.1, 0.42, 0.06), white, false);
  barV.position.z = 0.02;
  g.add(barV);
  parent.add(g);
}

/** M4 Sherman-inspired: tall rounded turret, vertical hull sides, shortish 75mm look */
function buildSherman(group, m) {
  addRunningGear(group, m, { width: 2.25, length: 3.35, wheelCount: 3, scale: 1 });

  const lower = mesh(new THREE.BoxGeometry(1.95, 0.55, 2.95), m.hull);
  lower.position.set(0, 0.55, 0);
  group.add(lower);

  const upper = mesh(new THREE.BoxGeometry(1.85, 0.55, 2.55), m.accent);
  upper.position.set(0, 1.05, -0.05);
  group.add(upper);

  // Rounded-ish nose / transmission housing
  const nose = mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.7, 10), m.hull);
  nose.rotation.z = Math.PI / 2;
  nose.position.set(0, 0.7, 1.35);
  group.add(nose);

  const frontPlate = mesh(new THREE.BoxGeometry(1.7, 0.45, 0.35), m.hull);
  frontPlate.position.set(0, 1.05, 1.45);
  frontPlate.rotation.x = -0.2;
  group.add(frontPlate);

  // Rear deck + exhausts
  const rear = mesh(new THREE.BoxGeometry(1.65, 0.25, 0.7), m.accent);
  rear.position.set(0, 1.2, -1.4);
  group.add(rear);
  for (const s of [-1, 1]) {
    const ex = mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.3, 6), m.metal);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(s * 0.45, 1.32, -1.65);
    group.add(ex);
  }

  addStarMark(group, m, 0.85, 1.15, 0.2);

  const turret = new THREE.Group();
  turret.position.set(0, 1.35, -0.05);
  group.add(turret);

  // Cast rounded turret
  const turretBody = mesh(new THREE.SphereGeometry(0.95, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), m.turret);
  turretBody.scale.set(1, 0.75, 1.15);
  turretBody.position.y = 0.15;
  turret.add(turretBody);

  const turretRing = mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.35, 12), m.turret);
  turretRing.position.y = 0.05;
  turret.add(turretRing);

  const cupola = mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.28, 10), m.turret);
  cupola.position.set(0.35, 0.7, -0.1);
  turret.add(cupola);

  const mantlet = mesh(new THREE.BoxGeometry(0.65, 0.4, 0.4), m.metal);
  mantlet.position.set(0, 0.25, 0.95);
  turret.add(mantlet);

  const barrel = new THREE.Group();
  barrel.position.set(0, 0.25, 1.1);
  turret.add(barrel);
  const tube = mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.9, 8), m.barrel);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 1.0;
  barrel.add(tube);
  const muzzle = mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.18, 8), m.metal);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.z = 2.0;
  barrel.add(muzzle);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.25, 2.25);
  turret.add(muzzlePoint);

  return { turret, barrel, muzzle: muzzlePoint, hpY: 2.7 };
}

/** Panzer IV-inspired: boxy turret, long L/48-ish barrel, flat hull */
function buildPanzer4(group, m) {
  addRunningGear(group, m, { width: 2.2, length: 3.3, wheelCount: 3, scale: 1 });

  const lower = mesh(new THREE.BoxGeometry(1.9, 0.5, 3.0), m.hull);
  lower.position.set(0, 0.5, 0);
  group.add(lower);

  const upper = mesh(new THREE.BoxGeometry(1.8, 0.5, 2.7), m.accent);
  upper.position.set(0, 0.95, 0);
  group.add(upper);

  // Flat glacis
  const glacis = mesh(new THREE.BoxGeometry(1.75, 0.35, 0.85), m.hull);
  glacis.position.set(0, 0.95, 1.4);
  glacis.rotation.x = -0.28;
  group.add(glacis);

  // Side schürzen plates
  for (const side of [-1, 1]) {
    const skirt = mesh(new THREE.BoxGeometry(0.08, 0.55, 2.4), m.metal);
    skirt.position.set(side * 1.05, 0.85, 0);
    group.add(skirt);
  }

  addBalkenMark(group, 0.9, 1.05, 0.3, Math.PI / 2);

  const turret = new THREE.Group();
  turret.position.set(0, 1.25, -0.1);
  group.add(turret);

  // Boxy hexagonal-ish turret via flat boxes
  const tBase = mesh(new THREE.BoxGeometry(1.55, 0.55, 1.7), m.turret);
  tBase.position.y = 0.2;
  turret.add(tBase);
  const tRoof = mesh(new THREE.BoxGeometry(1.4, 0.18, 1.5), m.accent);
  tRoof.position.y = 0.55;
  turret.add(tRoof);

  const cupola = mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.22, 8), m.turret);
  cupola.position.set(0.25, 0.72, -0.15);
  turret.add(cupola);

  const mantlet = mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), m.metal);
  mantlet.position.set(0, 0.25, 0.95);
  turret.add(mantlet);

  const barrel = new THREE.Group();
  barrel.position.set(0, 0.25, 1.15);
  turret.add(barrel);
  // Long barrel — signature Pz.IV Ausf.H look
  const tube = mesh(new THREE.CylinderGeometry(0.08, 0.11, 2.6, 8), m.barrel);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 1.35;
  barrel.add(tube);
  const muzzleBrake = mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.28, 8), m.metal);
  muzzleBrake.rotation.x = Math.PI / 2;
  muzzleBrake.position.z = 2.7;
  barrel.add(muzzleBrake);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.25, 2.95);
  turret.add(muzzlePoint);

  return { turret, barrel, muzzle: muzzlePoint, hpY: 2.65 };
}

/** T-34-inspired: steep glacis, Christie suspension hint, hexagonal turret */
function buildT34(group, m) {
  addRunningGear(group, m, { width: 2.15, length: 3.25, wheelCount: 4, scale: 0.95 });

  // Sloped lower + upper glacis (the silhouette)
  const lower = mesh(new THREE.BoxGeometry(1.7, 0.45, 2.6), m.hull);
  lower.position.set(0, 0.45, -0.1);
  group.add(lower);

  const glacis = mesh(new THREE.BoxGeometry(1.85, 0.2, 1.6), m.hull);
  glacis.position.set(0, 0.85, 0.95);
  glacis.rotation.x = -0.72;
  group.add(glacis);

  const sideSlopeL = mesh(new THREE.BoxGeometry(0.15, 0.7, 2.5), m.accent);
  sideSlopeL.position.set(-0.95, 0.75, 0);
  sideSlopeL.rotation.z = 0.35;
  group.add(sideSlopeL);
  const sideSlopeR = sideSlopeL.clone();
  sideSlopeR.position.x = 0.95;
  sideSlopeR.rotation.z = -0.35;
  group.add(sideSlopeR);

  const deck = mesh(new THREE.BoxGeometry(1.55, 0.25, 1.8), m.accent);
  deck.position.set(0, 1.05, -0.35);
  group.add(deck);

  const rear = mesh(new THREE.BoxGeometry(1.5, 0.35, 0.7), m.hull);
  rear.position.set(0, 0.85, -1.45);
  rear.rotation.x = 0.35;
  group.add(rear);

  // Red star plate (geometric)
  const starMat = new THREE.MeshStandardMaterial({ color: 0xa82828, roughness: 0.7, metalness: 0.1 });
  const star = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 5), starMat, false);
  star.rotation.x = Math.PI / 2;
  star.position.set(0.7, 1.0, 0.2);
  group.add(star);

  const turret = new THREE.Group();
  turret.position.set(0, 1.15, -0.15);
  group.add(turret);

  // Hexagonal turret
  const hex = mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.55, 6), m.turret);
  hex.position.y = 0.2;
  hex.rotation.y = Math.PI / 6;
  turret.add(hex);
  const roof = mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.15, 6), m.accent);
  roof.position.y = 0.5;
  roof.rotation.y = Math.PI / 6;
  turret.add(roof);

  const hatch = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 8), m.metal);
  hatch.position.set(0.2, 0.62, 0.1);
  turret.add(hatch);

  const mantlet = mesh(new THREE.BoxGeometry(0.55, 0.38, 0.4), m.metal);
  mantlet.position.set(0, 0.2, 0.85);
  turret.add(mantlet);

  const barrel = new THREE.Group();
  barrel.position.set(0, 0.2, 1.0);
  turret.add(barrel);
  const tube = mesh(new THREE.CylinderGeometry(0.085, 0.11, 2.2, 8), m.barrel);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 1.15;
  barrel.add(tube);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.2, 2.35);
  turret.add(muzzlePoint);

  return { turret, barrel, muzzle: muzzlePoint, hpY: 2.55 };
}

/** Tiger I-inspired: bulky box hull, thick long 88 look, heavy turret */
function buildTiger(group, m) {
  addRunningGear(group, m, { width: 2.55, length: 3.6, wheelCount: 4, scale: 1.1 });

  const lower = mesh(new THREE.BoxGeometry(2.2, 0.65, 3.3), m.hull);
  lower.position.set(0, 0.6, 0);
  group.add(lower);

  const upper = mesh(new THREE.BoxGeometry(2.05, 0.55, 2.9), m.accent);
  upper.position.set(0, 1.15, 0);
  group.add(upper);

  // Nearly vertical front plate
  const front = mesh(new THREE.BoxGeometry(2.05, 0.85, 0.25), m.hull);
  front.position.set(0, 1.0, 1.55);
  group.add(front);

  const nose = mesh(new THREE.BoxGeometry(1.9, 0.35, 0.5), m.metal);
  nose.position.set(0, 0.55, 1.7);
  group.add(nose);

  // Exhausts on rear
  for (const s of [-1, 1]) {
    const pipe = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), m.metal);
    pipe.position.set(s * 0.7, 1.55, -1.55);
    group.add(pipe);
  }

  addBalkenMark(group, 1.05, 1.15, 0.4, Math.PI / 2);

  const turret = new THREE.Group();
  turret.position.set(0, 1.45, -0.05);
  group.add(turret);

  const tBody = mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.7, 10), m.turret);
  tBody.position.y = 0.2;
  turret.add(tBody);
  const tTop = mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.25, 10), m.accent);
  tTop.position.y = 0.6;
  turret.add(tTop);

  const cupola = mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.3, 10), m.turret);
  cupola.position.set(0.4, 0.85, -0.1);
  turret.add(cupola);

  const mantlet = mesh(new THREE.BoxGeometry(0.85, 0.55, 0.55), m.metal);
  mantlet.position.set(0, 0.25, 1.05);
  turret.add(mantlet);

  const barrel = new THREE.Group();
  barrel.position.set(0, 0.25, 1.25);
  turret.add(barrel);
  // Thick long 88mm look
  const breech = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.6, 8), m.barrel);
  breech.rotation.x = Math.PI / 2;
  breech.position.z = 0.25;
  barrel.add(breech);
  const tube = mesh(new THREE.CylinderGeometry(0.11, 0.14, 2.8, 8), m.barrel);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 1.7;
  barrel.add(tube);
  const brake = mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.35, 8), m.metal);
  brake.rotation.x = Math.PI / 2;
  brake.position.z = 3.15;
  barrel.add(brake);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.25, 3.4);
  turret.add(muzzlePoint);

  return { turret, barrel, muzzle: muzzlePoint, hpY: 3.0 };
}

/** M3 Stuart-inspired light tank: small, tall turret, short gun */
function buildStuart(group, m) {
  addRunningGear(group, m, { width: 1.75, length: 2.5, wheelCount: 3, scale: 0.8 });

  const lower = mesh(new THREE.BoxGeometry(1.45, 0.4, 2.2), m.hull);
  lower.position.set(0, 0.4, 0);
  group.add(lower);

  const upper = mesh(new THREE.BoxGeometry(1.35, 0.4, 1.9), m.accent);
  upper.position.set(0, 0.8, 0);
  group.add(upper);

  const glacis = mesh(new THREE.BoxGeometry(1.3, 0.25, 0.7), m.hull);
  glacis.position.set(0, 0.85, 1.05);
  glacis.rotation.x = -0.4;
  group.add(glacis);

  addStarMark(group, m, 0.55, 0.9, 0.15);

  const turret = new THREE.Group();
  turret.position.set(0, 1.05, 0);
  group.add(turret);

  // Tall narrow turret
  const tBody = mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.65, 10), m.turret);
  tBody.position.y = 0.25;
  turret.add(tBody);
  const cupola = mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.2, 8), m.turret);
  cupola.position.set(0, 0.7, 0);
  turret.add(cupola);

  const mantlet = mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), m.metal);
  mantlet.position.set(0, 0.25, 0.55);
  turret.add(mantlet);

  const barrel = new THREE.Group();
  barrel.position.set(0, 0.25, 0.65);
  turret.add(barrel);
  const tube = mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6), m.barrel);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 0.65;
  barrel.add(tube);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.25, 1.4);
  turret.add(muzzlePoint);

  return { turret, barrel, muzzle: muzzlePoint, hpY: 2.2 };
}

const BUILDERS = {
  sherman: buildSherman,
  panzer4: buildPanzer4,
  t34: buildT34,
  tiger: buildTiger,
  stuart: buildStuart,
};

export class Tank {
  constructor({
    scene,
    x = 0,
    z = 0,
    yaw = 0,
    isPlayer = false,
    typeId = null,
    maxHealth = null,
  }) {
    const type =
      TANK_TYPES[typeId] ||
      (isPlayer ? TANK_TYPES.sherman : TANK_TYPES.panzer4);

    this.type = type;
    this.typeId = type.id;
    this.displayName = type.name;
    this.isPlayer = isPlayer;
    this.maxHealth = maxHealth ?? type.maxHealth;
    this.health = this.maxHealth;
    this.alive = true;
    this.radius = type.radius;
    this.speed = type.speed;
    this.turnSpeed = type.turnSpeed;
    this.turretTurnSpeed = type.turretTurnSpeed;
    this.reloadTime = type.reloadTime;
    this.reloadLeft = 0;
    this.shellDamage = type.shellDamage;
    this.shellSpeed = type.shellSpeed;

    this.yaw = yaw;
    this.turretYaw = yaw;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    scene.add(this.group);

    const m = mats(type.colors);
    const built = BUILDERS[type.id](this.group, m);
    this.turret = built.turret;
    this.barrel = built.barrel;
    this.muzzle = built.muzzle;

    // Health bar
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 16;
    this.hpCanvas = canvas;
    this.hpCtx = canvas.getContext("2d");
    this.hpTex = new THREE.CanvasTexture(canvas);
    const hpMat = new THREE.SpriteMaterial({ map: this.hpTex, transparent: true, depthTest: false });
    this.hpSprite = new THREE.Sprite(hpMat);
    this.hpSprite.scale.set(2.2, 0.28, 1);
    this.hpSprite.position.set(0, built.hpY, 0);
    this.group.add(this.hpSprite);
    this._paintHp();

    this.group.rotation.y = this.yaw;
  }

  _paintHp() {
    const ctx = this.hpCtx;
    const w = this.hpCanvas.width;
    const h = this.hpCanvas.height;
    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = pct > 0.45 ? "#3d8b6e" : pct > 0.2 ? "#d4a017" : "#c44536";
    ctx.fillRect(2, 2, (w - 4) * pct, h - 4);
    this.hpTex.needsUpdate = true;
  }

  get position() {
    return this.group.position;
  }

  get muzzleWorld() {
    const v = new THREE.Vector3();
    this.muzzle.getWorldPosition(v);
    return v;
  }

  get aimDir() {
    const dir = new THREE.Vector3(0, 0, 1);
    dir.applyQuaternion(this.turret.getWorldQuaternion(new THREE.Quaternion()));
    dir.y = 0;
    dir.normalize();
    return dir;
  }

  canFire() {
    return this.alive && this.reloadLeft <= 0;
  }

  startReload() {
    this.reloadLeft = this.reloadTime;
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.health = Math.max(0, this.health - amount);
    this._paintHp();
    if (this.health <= 0) {
      this.alive = false;
      this.hpSprite.visible = false;
      this.group.visible = false;
      return true;
    }
    return false;
  }

  update(dt, { forward = 0, turn = 0, turretDelta = 0 }, colliders, solidTanks = []) {
    if (!this.alive) return;

    if (this.reloadLeft > 0) this.reloadLeft = Math.max(0, this.reloadLeft - dt);

    this.yaw += turn * this.turnSpeed * dt;
    this.turretYaw += turretDelta;

    const localTurret = this.turretYaw - this.yaw;
    this.group.rotation.y = this.yaw;
    this.turret.rotation.y = localTurret;

    const move = forward * this.speed * dt;
    const dx = Math.sin(this.yaw) * move;
    const dz = Math.cos(this.yaw) * move;

    const tryMove = (ox, oz) => {
      let nx = this.group.position.x + ox;
      let nz = this.group.position.z + oz;
      for (const box of colliders) {
        const r = resolveCircleAabb(nx, nz, this.radius, box);
        nx = r.x;
        nz = r.z;
      }
      for (const other of solidTanks) {
        if (other === this || !other.alive) continue;
        const ddx = nx - other.position.x;
        const ddz = nz - other.position.z;
        const minDist = this.radius + other.radius;
        const dist = Math.hypot(ddx, ddz);
        if (dist < minDist && dist > 1e-4) {
          const push = (minDist - dist) / dist;
          nx += ddx * push;
          nz += ddz * push;
        }
      }
      this.group.position.x = nx;
      this.group.position.z = nz;
    };

    if (dx !== 0) tryMove(dx, 0);
    if (dz !== 0) tryMove(0, dz);
    this.group.position.y = 0;
  }

  dispose(scene) {
    scene.remove(this.group);
    this.hpTex.dispose();
  }
}
