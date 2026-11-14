import * as THREE from "three";
import { resolveCircleAabb } from "./collision.js";

const HULL_COLOR_PLAYER = 0x3d6b4f;
const HULL_COLOR_ENEMY = 0x8a3b32;
const TRACK_COLOR = 0x1a1e22;
const TURRET_COLOR = 0x2f3834;

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
      roughness: 0.7,
      metalness: 0.25,
    });
    const trackMat = new THREE.MeshStandardMaterial({
      color: TRACK_COLOR,
      roughness: 0.95,
      metalness: 0.1,
    });
    const turretMat = new THREE.MeshStandardMaterial({
      color: this.isPlayer ? 0x355a45 : TURRET_COLOR,
      roughness: 0.65,
      metalness: 0.3,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x1c2220,
      roughness: 0.5,
      metalness: 0.45,
    });

    // Tracks
    for (const side of [-1, 1]) {
      const track = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 3.2), trackMat);
      track.position.set(side * 1.05, 0.35, 0);
      track.castShadow = true;
      track.receiveShadow = true;
      this.group.add(track);
    }

    // Hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 3.0), hullMat);
    hull.position.set(0, 0.85, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.group.add(hull);

    // Front slope hint
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 0.7), hullMat);
    nose.position.set(0, 0.95, 1.35);
    nose.rotation.x = -0.25;
    nose.castShadow = true;
    this.group.add(nose);

    // Turret pivot
    this.turret = new THREE.Group();
    this.turret.position.set(0, 1.35, -0.1);
    this.group.add(this.turret);

    const turretBody = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.7, 12), turretMat);
    turretBody.castShadow = true;
    this.turret.add(turretBody);

    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.28, 10), turretMat);
    cupola.position.y = 0.45;
    this.turret.add(cupola);

    this.barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.4, 10), barrelMat);
    this.barrel.rotation.x = Math.PI / 2;
    this.barrel.position.set(0, 0.1, 1.5);
    this.barrel.castShadow = true;
    this.turret.add(this.barrel);

    // Muzzle marker for spawn
    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.1, 2.75);
    this.turret.add(this.muzzle);

    // Health bar (billboard-ish via main update)
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 16;
    this.hpCanvas = canvas;
    this.hpCtx = canvas.getContext("2d");
    this.hpTex = new THREE.CanvasTexture(canvas);
    const hpMat = new THREE.SpriteMaterial({ map: this.hpTex, transparent: true, depthTest: false });
    this.hpSprite = new THREE.Sprite(hpMat);
    this.hpSprite.scale.set(2.2, 0.28, 1);
    this.hpSprite.position.set(0, 2.6, 0);
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

  /**
   * Drive with local input.
   * forward: -1..1, turn: -1..1, turretDelta: radians this frame
   */
  update(dt, { forward = 0, turn = 0, turretDelta = 0 }, colliders, solidTanks = []) {
    if (!this.alive) return;

    if (this.reloadLeft > 0) this.reloadLeft = Math.max(0, this.reloadLeft - dt);

    this.yaw += turn * this.turnSpeed * dt;
    this.turretYaw += turretDelta;

    // Keep turret relative to world intent for player; enemies set absolute
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

    // Separate axes for snappier sliding along walls
    if (dx !== 0) tryMove(dx, 0);
    if (dz !== 0) tryMove(0, dz);

    this.group.position.y = 0;
  }

  dispose(scene) {
    scene.remove(this.group);
    this.hpTex.dispose();
  }
}
