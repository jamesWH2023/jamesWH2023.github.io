import * as THREE from "three";
import { createAlleyMap } from "./map.js";
import { Tank } from "./tank.js";
import { ProjectileManager, spawnExplosion } from "./projectile.js";
import { EnemyController, buildPatrolAround } from "./enemy.js";
import { AudioBus } from "./audio.js";

const canvas = document.getElementById("game-canvas");
const titleScreen = document.getElementById("title-screen");
const pauseScreen = document.getElementById("pause-screen");
const endScreen = document.getElementById("end-screen");
const hud = document.getElementById("hud");
const crosshair = document.getElementById("crosshair");
const pauseHint = document.getElementById("pause-hint");
const toast = document.getElementById("toast");
const healthFill = document.getElementById("health-fill");
const healthText = document.getElementById("health-text");
const reloadFill = document.getElementById("reload-fill");
const ammoText = document.getElementById("ammo-text");
const enemyAliveEl = document.getElementById("enemy-alive");
const endEyebrow = document.getElementById("end-eyebrow");
const endTitle = document.getElementById("end-title");
const endMessage = document.getElementById("end-message");

const keys = new Set();
const audio = new AudioBus();

let renderer, scene, camera;
let mapData;
let player;
let enemies = [];
let enemyAIs = [];
let projectiles;
let fx = [];
let state = "title"; // title | playing | paused | won | lost
let clock;
let cameraYawOffset = 0;
let pointerLocked = false;
let mouseTurretDelta = 0;

function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101820);
  scene.fog = new THREE.FogExp2(0x141e28, 0.015);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);

  // Slightly brighter so upgraded tank/building silhouettes read clearly
  const hemi = new THREE.HemisphereLight(0xb0c4d4, 0x2c241c, 0.7);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xe8eef4, 1.2);
  sun.position.set(-28, 48, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 5;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x5a7a92, 0.35);
  fill.position.set(22, 12, -24);
  scene.add(fill);

  projectiles = new ProjectileManager(scene);
  clock = new THREE.Clock();

  window.addEventListener("resize", onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function clearWorld() {
  if (mapData) {
    scene.remove(mapData.group);
    mapData = null;
  }
  if (player) {
    player.dispose(scene);
    player = null;
  }
  for (const e of enemies) e.dispose(scene);
  enemies = [];
  enemyAIs = [];
  projectiles.clear();
  fx = [];
}

function startGame() {
  clearWorld();
  mapData = createAlleyMap(scene);

  const spawn = mapData.playerSpawn;
  player = new Tank({
    scene,
    x: spawn.x,
    z: spawn.z,
    yaw: spawn.yaw,
    isPlayer: true,
    maxHealth: 100,
  });

  enemies = mapData.enemySpawns.map((s, i) => {
    const t = new Tank({
      scene,
      x: s.x,
      z: s.z,
      yaw: s.yaw,
      isPlayer: false,
      maxHealth: 70,
    });
    const patrol = buildPatrolAround(s.x, s.z, 6 + (i % 3));
    enemyAIs.push(new EnemyController(t, patrol));
    return t;
  });

  state = "playing";
  titleScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  hud.classList.add("visible");
  crosshair.classList.add("visible");
  pauseHint.classList.add("visible");
  clock.getDelta();
  updateHud();
  showToast("Click the game to lock mouse aim", 2400);
  audio.ensure();
}

function setEnd(won) {
  state = won ? "won" : "lost";
  endEyebrow.textContent = won ? "Mission complete" : "Hull breached";
  endTitle.textContent = won ? "VICTORY" : "DEFEATED";
  endMessage.textContent = won
    ? "All enemy tanks destroyed. The alleys are yours."
    : "Your tank was destroyed. Press fight again to retry.";
  endScreen.classList.remove("hidden");
  crosshair.classList.remove("visible");
  if (won) audio.win();
  else audio.lose();
  if (document.pointerLockElement) document.exitPointerLock();
}

function updateHud() {
  if (!player) return;
  const pct = player.health / player.maxHealth;
  healthFill.style.transform = `scaleX(${pct})`;
  healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

  const reloadPct = player.reloadLeft <= 0 ? 1 : 1 - player.reloadLeft / player.reloadTime;
  reloadFill.style.transform = `scaleX(${reloadPct})`;
  if (player.reloadLeft <= 0) {
    ammoText.textContent = "Ready";
    ammoText.className = "hud-meta ready";
  } else {
    ammoText.textContent = `Reloading ${player.reloadLeft.toFixed(1)}s`;
    ammoText.className = "hud-meta reloading";
  }

  const alive = enemies.filter((e) => e.alive).length;
  enemyAliveEl.textContent = String(alive);
}

function showToast(msg, ms = 1800) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), ms);
}

function firePlayer() {
  if (state !== "playing" || !player?.canFire()) return;
  const dir = player.aimDir;
  const muzzle = player.muzzleWorld;
  projectiles.spawn({
    x: muzzle.x,
    y: muzzle.y,
    z: muzzle.z,
    dirX: dir.x,
    dirZ: dir.z,
    speed: player.shellSpeed,
    damage: player.shellDamage,
    owner: player,
  });
  player.startReload();
  audio.fire();
}

function updateCamera(dt) {
  if (!player) return;
  const behind = 11;
  const height = 7.5;
  const lookAhead = 4;
  const yaw = player.yaw + cameraYawOffset;

  const targetX = player.position.x - Math.sin(yaw) * behind;
  const targetZ = player.position.z - Math.cos(yaw) * behind;
  const targetY = height;

  camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 6, dt);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 6, dt);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 6, dt);

  const lookX = player.position.x + Math.sin(player.turretYaw) * lookAhead;
  const lookZ = player.position.z + Math.cos(player.turretYaw) * lookAhead;
  camera.lookAt(lookX, 1.2, lookZ);
}

function readPlayerInput(dt) {
  let forward = 0;
  let turn = 0;
  let turretDelta = 0;

  if (keys.has("KeyW") || keys.has("ArrowUp")) forward += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) forward -= 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) turn += 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) turn -= 1;
  if (keys.has("KeyQ")) turretDelta += player.turretTurnSpeed * dt;
  if (keys.has("KeyE")) turretDelta -= player.turretTurnSpeed * dt;

  turretDelta += mouseTurretDelta;
  mouseTurretDelta = 0;

  return { forward, turn, turretDelta };
}

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === "playing") {
    const allTanks = [player, ...enemies];
    const input = readPlayerInput(dt);
    player.turretYaw += input.turretDelta;
    player.update(dt, { forward: input.forward, turn: input.turn, turretDelta: 0 }, mapData.colliders, allTanks);

    for (const ai of enemyAIs) {
      const result = ai.update(dt, player, mapData.colliders, allTanks, projectiles);
      if (result === "fired") audio.fire();
    }

    projectiles.update(dt, mapData.colliders, allTanks, (hit) => {
      fx.push(spawnExplosion(scene, hit.x, hit.z, hit.type === "tank" ? 0xff6633 : 0xccccaa));
      if (hit.type === "tank") {
        audio.hit();
        if (hit.killed) {
          audio.explode();
          fx.push(spawnExplosion(scene, hit.x, hit.z, 0xff4422));
        }
      }
    });

    fx = fx.filter((f) => f.update(dt));
    updateCamera(dt);
    updateHud();

    if (!player.alive) setEnd(false);
    else if (enemies.every((e) => !e.alive)) setEnd(true);
  } else if (player) {
    updateCamera(dt);
  }

  renderer.render(scene, camera);
}

function bindUI() {
  document.getElementById("btn-start").addEventListener("click", () => {
    startGame();
    canvas.requestPointerLock?.();
  });
  document.getElementById("btn-resume").addEventListener("click", () => {
    if (state === "paused") {
      state = "playing";
      pauseScreen.classList.add("hidden");
      crosshair.classList.add("visible");
      canvas.requestPointerLock?.();
    }
  });
  document.getElementById("btn-restart").addEventListener("click", () => startGame());

  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (e.code === "Space") {
      e.preventDefault();
      firePlayer();
    }
    if (e.code === "KeyR" && (state === "won" || state === "lost")) startGame();
    if (e.code === "Escape") {
      if (state === "playing") {
        state = "paused";
        pauseScreen.classList.remove("hidden");
        crosshair.classList.remove("visible");
        if (document.pointerLockElement) document.exitPointerLock();
      } else if (state === "paused") {
        state = "playing";
        pauseScreen.classList.add("hidden");
        crosshair.classList.add("visible");
      }
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));

  canvas.addEventListener("click", () => {
    if (state === "playing") {
      canvas.requestPointerLock?.();
      firePlayer();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener("mousemove", (e) => {
    if (!pointerLocked || state !== "playing" || !player) return;
    mouseTurretDelta -= e.movementX * 0.0025;
  });
}

initThree();
bindUI();
// Idle camera preview on title
camera.position.set(0, 28, 28);
camera.lookAt(0, 0, 0);
mapData = createAlleyMap(scene);
tick();
