import * as THREE from "three";
import { resolveCircleAabb } from "./collision.js";

const HULL_COLOR_PLAYER = 0x3f7354;
const HULL_COLOR_ENEMY = 0x8f3f35;
const TRACK_COLOR = 0x171b1f;
const METAL_DARK = 0x23282c;
const RUBBER = 0x0e1012;

function shadowMesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export class Tank {
  constructor({
    scene,
    x = 0,
    z = 0,
    yaw = 0,
    isPlayer = false,
    maxHealth = 100,
  }) {
    this.isPlayer = isPlayer;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.alive = true;
    this.radius = 1.55;
    this.speed = isPlayer ? 11 : 7.5;
    this.turnSpeed = isPlayer ? 2.4 : 1.7;
    this.turretTurnSpeed = isPlayer ? 3.2 : 2.0;
    this.reloadTime = isPlayer ? 0.85 : 1.35;
    this.reloadLeft = 0;
    this.shellDamage = isPlayer ? 34 : 18;
    this.shellSpeed = isPlayer ? 42 : 34;

    this.yaw = yaw;
    this.turretYaw = yaw;
    this.vx = 0;
    this.vz = 0;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    scene.add(this.group);

    this._buildMesh(isPlayer ? HULL_COLOR_PLAYER : HULL_COLOR_ENEMY);
    this.group.rotation.y = this.yaw;
  }

  _buildMesh(hullColor) {
    const hullMat = new THREE.MeshStandardMaterial({
      color: hullColor,
      roughness: 0.62,
      metalness: 0.32,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: this.isPlayer ? 0x2c5240 : 0x6a2c28,
      roughness: 0.7,
      metalness: 0.22,
    });
    const trackMat = new THREE.MeshStandardMaterial({
      color: TRACK_COLOR,
      roughness: 0.92,
      metalness: 0.12,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: METAL_DARK,
      roughness: 0.45,
      metalness: 0.55,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: RUBBER,
      roughness: 0.98,
      metalness: 0.05,
    });
    const turretMat = new THREE.MeshStandardMaterial({
      color: this.isPlayer ? 0x355f48 : 0x3a3332,
      roughness: 0.55,
      metalness: 0.38,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1f1d,
      roughness: 0.4,
      metalness: 0.6,
    });
    const opticMat = new THREE.MeshStandardMaterial({
      color: 0x1e2830,
      roughness: 0.25,
      metalness: 0.7,
      emissive: this.isPlayer ? 0x14301f : 0x301010,
      emissiveIntensity: 0.15,
    });

    // --- Tracks / running gear ---
    for (const side of [-1, 1]) {
      const sx = side * 1.12;

      // Outer track skirt
      const skirt = shadowMesh(new THREE.BoxGeometry(0.42, 0.72, 3.35), trackMat);
      skirt.position.set(sx, 0.42, 0);
      this.group.add(skirt);

      // Road wheels
      for (let i = -1; i <= 1; i++) {
        const wheel = shadowMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.38, 10), rubberMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx, 0.28, i * 1.05);
        this.group.add(wheel);
        const hub = shadowMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8), metalMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(wheel.position);
        this.group.add(hub);
      }

      // Drive sprocket / idler hints
      const sprocket = shadowMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.36, 12), metalMat);
      sprocket.rotation.z = Math.PI / 2;
      sprocket.position.set(sx, 0.34, 1.55);
      this.group.add(sprocket);
      const idler = shadowMesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 10), metalMat);
      idler.rotation.z = Math.PI / 2;
      idler.position.set(sx, 0.3, -1.55);
      this.group.add(idler);

      // Upper return rollers
      for (const z of [-0.55, 0.55]) {
        const roller = shadowMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 8), rubberMat);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(sx, 0.62, z);
        this.group.add(roller);
      }
    }

    // --- Hull ---
    const lowerHull = shadowMesh(new THREE.BoxGeometry(1.95, 0.55, 2.85), hullMat);
    lowerHull.position.set(0, 0.55, 0);
    this.group.add(lowerHull);

    const upperHull = shadowMesh(new THREE.BoxGeometry(1.85, 0.42, 2.55), accentMat);
    upperHull.position.set(0, 0.98, -0.05);
    this.group.add(upperHull);

    // Glacis / front slope
    const glacis = shadowMesh(new THREE.BoxGeometry(1.75, 0.28, 0.95), hullMat);
    glacis.position.set(0, 0.88, 1.35);
    glacis.rotation.x = -0.42;
    this.group.add(glacis);

    // Rear bustle / engine deck
    const rearDeck = shadowMesh(new THREE.BoxGeometry(1.7, 0.22, 0.7), accentMat);
    rearDeck.position.set(0, 1.12, -1.35);
    this.group.add(rearDeck);

    // Exhausts
    for (const side of [-1, 1]) {
      const exhaust = shadowMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8), metalMat);
      exhaust.position.set(side * 0.55, 1.28, -1.55);
      exhaust.rotation.x = Math.PI / 2;
      this.group.add(exhaust);
    }

    // Side skirts / mudguards
    for (const side of [-1, 1]) {
      const guard = shadowMesh(new THREE.BoxGeometry(0.18, 0.12, 3.1), metalMat);
      guard.position.set(side * 1.05, 0.82, 0);
      this.group.add(guard);
    }

    // Front / rear bumpers
    const frontBumper = shadowMesh(new THREE.BoxGeometry(1.9, 0.18, 0.22), metalMat);
    frontBumper.position.set(0, 0.42, 1.55);
    this.group.add(frontBumper);
    const rearBumper = shadowMesh(new THREE.BoxGeometry(1.9, 0.18, 0.22), metalMat);
    rearBumper.position.set(0, 0.42, -1.55);
    this.group.add(rearBumper);

    // Headlights
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffe6b0,
      emissive: 0xffcc66,
      emissiveIntensity: this.isPlayer ? 0.55 : 0.2,
      roughness: 0.3,
      metalness: 0.2,
    });
    for (const side of [-1, 1]) {
      const lamp = shadowMesh(new THREE.SphereGeometry(0.1, 8, 8), lampMat);
      lamp.position.set(side * 0.7, 0.78, 1.62);
      this.group.add(lamp);
    }

    // Antenna
    const antenna = shadowMesh(new THREE.CylinderGeometry(0.025, 0.03, 1.4, 6), metalMat);
    antenna.position.set(-0.75, 1.85, -0.7);
    this.group.add(antenna);

    // --- Turret ---
    this.turret = new THREE.Group();
    this.turret.position.set(0, 1.28, -0.08);
    this.group.add(this.turret);

    // Faceted turret body (scaled box + bevel feel via stacked pieces)
    const turretBase = shadowMesh(new THREE.CylinderGeometry(0.95, 1.08, 0.55, 10), turretMat);
    turretBase.position.y = 0.12;
    this.turret.add(turretBase);

    const turretCap = shadowMesh(new THREE.CylinderGeometry(0.72, 0.9, 0.32, 10), turretMat);
    turretCap.position.y = 0.48;
    this.turret.add(turretCap);

    // Mantlet
    const mantlet = shadowMesh(new THREE.BoxGeometry(0.7, 0.42, 0.45), metalMat);
    mantlet.position.set(0, 0.22, 0.95);
    this.turret.add(mantlet);

    // Bustle rack / storage
    const bustle = shadowMesh(new THREE.BoxGeometry(1.1, 0.28, 0.55), accentMat);
    bustle.position.set(0, 0.18, -0.85);
    this.turret.add(bustle);

    // Cupola + hatch
    const cupola = shadowMesh(new THREE.CylinderGeometry(0.32, 0.36, 0.26, 10), turretMat);
    cupola.position.set(0.22, 0.72, -0.05);
    this.turret.add(cupola);
    const hatch = shadowMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 10), metalMat);
    hatch.position.set(0.22, 0.86, -0.05);
    this.turret.add(hatch);

    // Commander's optic / MG mount
    const optic = shadowMesh(new THREE.BoxGeometry(0.18, 0.14, 0.28), opticMat);
    optic.position.set(-0.35, 0.7, 0.25);
    this.turret.add(optic);

    const coax = shadowMesh(new THREE.CylinderGeometry(0.04, 0.05, 0.55, 6), barrelMat);
    coax.rotation.x = Math.PI / 2;
    coax.position.set(0.22, 0.28, 1.25);
    this.turret.add(coax);

    // Main gun: multi-segment barrel with muzzle brake
    this.barrel = new THREE.Group();
    this.barrel.position.set(0, 0.22, 1.15);
    this.turret.add(this.barrel);

    const breech = shadowMesh(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 10), barrelMat);
    breech.rotation.x = Math.PI / 2;
    breech.position.z = 0.2;
    this.barrel.add(breech);

    const tube = shadowMesh(new THREE.CylinderGeometry(0.1, 0.13, 1.85, 10), barrelMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.z = 1.25;
    this.barrel.add(tube);

    const muzzleBrake = shadowMesh(new THREE.CylinderGeometry(0.14, 0.12, 0.28, 10), metalMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.z = 2.25;
    this.barrel.add(muzzleBrake);

    const bore = shadowMesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1, metalness: 0 })
    );
    bore.rotation.x = Math.PI / 2;
    bore.position.z = 2.4;
    this.barrel.add(bore);

    // Muzzle spawn point
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.22, 2.55);
    this.turret.add(this.muzzle);

    // Smoke grenade launchers
    for (const side of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const tube2 = shadowMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), metalMat);
        tube2.rotation.z = side * 0.55;
        tube2.rotation.x = -0.35;
        tube2.position.set(side * 0.7, 0.35, 0.55 + i * 0.18);
        this.turret.add(tube2);
      }
    }

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
    this.hpSprite.position.set(0, 2.85, 0);
    this.group.add(this.hpSprite);
    this._paintHp();
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
