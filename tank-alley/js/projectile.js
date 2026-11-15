import * as THREE from "three";
import { segmentHitsAabb, pointInAabb, aabbFromCenter } from "./collision.js";

export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.shells = [];
    this.mat = new THREE.MeshStandardMaterial({
      color: 0xf0d080,
      emissive: 0xffaa33,
      emissiveIntensity: 0.8,
      roughness: 0.35,
      metalness: 0.2,
    });
    this.geo = new THREE.SphereGeometry(0.18, 10, 10);
  }

  spawn({ x, y, z, dirX, dirZ, speed, damage, owner }) {
    const mesh = new THREE.Mesh(this.geo, this.mat);
    mesh.castShadow = true;
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const light = new THREE.PointLight(0xffb040, 0.9, 8, 2);
    mesh.add(light);

    this.shells.push({
      mesh,
      x,
      y,
      z,
      prevX: x,
      prevZ: z,
      vx: dirX * speed,
      vz: dirZ * speed,
      damage,
      owner,
      life: 2.8,
    });
  }

  update(dt, colliders, tanks, onHit) {
    const survivors = [];
    for (const s of this.shells) {
      s.life -= dt;
      s.prevX = s.x;
      s.prevZ = s.z;
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      s.y = 1.45;
      s.mesh.position.set(s.x, s.y, s.z);

      let dead = s.life <= 0;

      if (!dead) {
        for (const box of colliders) {
          const t = segmentHitsAabb(s.prevX, s.prevZ, s.x, s.z, box);
          if (t !== null) {
            dead = true;
            onHit?.({ type: "wall", x: s.prevX + (s.x - s.prevX) * t, z: s.prevZ + (s.z - s.prevZ) * t });
            break;
          }
        }
      }

      if (!dead) {
        for (const tank of tanks) {
          if (!tank.alive || tank === s.owner) continue;
          const box = aabbFromCenter(tank.position.x, tank.position.z, tank.radius * 0.85, tank.radius * 0.95);
          const t = segmentHitsAabb(s.prevX, s.prevZ, s.x, s.z, box);
          if (t !== null || pointInAabb(s.x, s.z, box)) {
            dead = true;
            const killed = tank.takeDamage(s.damage);
            onHit?.({
              type: "tank",
              tank,
              killed,
              x: tank.position.x,
              z: tank.position.z,
              damage: s.damage,
            });
            break;
          }
        }
      }

      if (dead) {
        this.scene.remove(s.mesh);
      } else {
        survivors.push(s);
      }
    }
    this.shells = survivors;
  }

  clear() {
    for (const s of this.shells) this.scene.remove(s.mesh);
    this.shells = [];
  }
}

export function spawnExplosion(scene, x, z, color = 0xff8844) {
  const group = new THREE.Group();
  group.position.set(x, 1.2, z);
  scene.add(group);

  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), mat);
  group.add(core);

  const sparks = [];
  for (let i = 0; i < 8; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 1 })
    );
    const a = (i / 8) * Math.PI * 2;
    spark.userData.vx = Math.cos(a) * (3 + Math.random() * 4);
    spark.userData.vz = Math.sin(a) * (3 + Math.random() * 4);
    spark.userData.vy = 2 + Math.random() * 3;
    group.add(spark);
    sparks.push(spark);
  }

  let t = 0;
  const duration = 0.45;
  return {
    update(dt) {
      t += dt;
      const k = t / duration;
      core.scale.setScalar(1 + k * 3);
      mat.opacity = Math.max(0, 1 - k);
      for (const spark of sparks) {
        spark.position.x += spark.userData.vx * dt;
        spark.position.y += spark.userData.vy * dt;
        spark.position.z += spark.userData.vz * dt;
        spark.userData.vy -= 8 * dt;
        spark.material.opacity = Math.max(0, 1 - k);
      }
      if (t >= duration) {
        scene.remove(group);
        return false;
      }
      return true;
    },
  };
}
