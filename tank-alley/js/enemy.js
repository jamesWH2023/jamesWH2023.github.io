import * as THREE from "three";
import { segmentHitsAabb } from "./collision.js";

/**
 * Simple finite-state AI: patrol waypoints → chase when LOS → shoot when aimed.
 */
export class EnemyController {
  constructor(tank, waypoints) {
    this.tank = tank;
    this.waypoints = waypoints.length ? waypoints : [{ x: tank.position.x, z: tank.position.z }];
    this.wpIndex = 0;
    this.state = "patrol";
    this.repathTimer = 0;
    this.fireCooldownJitter = Math.random() * 0.4;
    this.detectRange = 28;
    this.loseRange = 36;
    this.shootRange = 22;
    this.aimSlack = 0.18;
  }

  hasLineOfSight(from, to, colliders) {
    for (const box of colliders) {
      const t = segmentHitsAabb(from.x, from.z, to.x, to.z, box);
      if (t !== null && t > 0.02 && t < 0.98) return false;
    }
    return true;
  }

  update(dt, player, colliders, allTanks, projectiles) {
    const tank = this.tank;
    if (!tank.alive || !player.alive) {
      tank.update(dt, { forward: 0, turn: 0, turretDelta: 0 }, colliders, allTanks);
      return;
    }

    const dx = player.position.x - tank.position.x;
    const dz = player.position.z - tank.position.z;
    const dist = Math.hypot(dx, dz);
    const los =
      dist < this.detectRange &&
      this.hasLineOfSight(tank.position, player.position, colliders);

    if (this.state === "patrol" && los) this.state = "chase";
    if (this.state === "chase" && (dist > this.loseRange || !los)) this.state = "patrol";

    let forward = 0;
    let turn = 0;
    let targetYaw = tank.yaw;

    if (this.state === "patrol") {
      const wp = this.waypoints[this.wpIndex];
      const wdx = wp.x - tank.position.x;
      const wdz = wp.z - tank.position.z;
      const wdist = Math.hypot(wdx, wdz);
      if (wdist < 1.8) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      } else {
        targetYaw = Math.atan2(wdx, wdz);
        forward = 0.7;
      }
    } else {
      // Chase: move toward player but keep some distance for shooting
      targetYaw = Math.atan2(dx, dz);
      if (dist > 12) forward = 1;
      else if (dist < 7) forward = -0.45;
      else forward = 0.25;
    }

    // Steer hull
    let yawErr = normalizeAngle(targetYaw - tank.yaw);
    turn = THREE.MathUtils.clamp(yawErr / 0.6, -1, 1);
    if (Math.abs(yawErr) > 1.1) forward *= 0.25;

    // Aim turret at player
    const aimYaw = Math.atan2(dx, dz);
    let turretErr = normalizeAngle(aimYaw - tank.turretYaw);
    const turretDelta = THREE.MathUtils.clamp(
      turretErr,
      -tank.turretTurnSpeed * dt,
      tank.turretTurnSpeed * dt
    );
    tank.turretYaw += turretDelta;

    tank.update(dt, { forward, turn, turretDelta: 0 }, colliders, allTanks);

    // Fire when aimed and LOS
    const aimed = Math.abs(normalizeAngle(aimYaw - tank.turretYaw)) < this.aimSlack;
    if (
      this.state === "chase" &&
      los &&
      aimed &&
      dist < this.shootRange &&
      tank.canFire()
    ) {
      const dir = tank.aimDir;
      const muzzle = tank.muzzleWorld;
      projectiles.spawn({
        x: muzzle.x,
        y: muzzle.y,
        z: muzzle.z,
        dirX: dir.x,
        dirZ: dir.z,
        speed: tank.shellSpeed,
        damage: tank.shellDamage,
        owner: tank,
      });
      tank.startReload();
      return "fired";
    }
    return null;
  }
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function buildPatrolAround(x, z, radius = 8) {
  return [
    { x: x + radius, z },
    { x, z: z + radius },
    { x: x - radius, z },
    { x, z: z - radius },
  ];
}
