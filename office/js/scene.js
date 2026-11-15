import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ACCENTS = {
  copper: 0xb56a3a,
  verdigris: 0x3d7a6e,
  slate: 0x5a7382,
  clay: 0xa65d4a,
  ink: 0x3a4f66,
};

const MAX_DESKS = 6;
const DESK_SPACING = 2.55;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.08,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

function makeLabelTexture(text, opts = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts.bg || "rgba(18,24,29,0.82)";
  roundRect(ctx, 8, 16, 496, 96, 10);
  ctx.fill();
  ctx.fillStyle = opts.color || "#e8eef1";
  ctx.font = `700 ${opts.size || 42}px "Bricolage Grotesque", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.slice(0, 22), 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeBoardCardTexture(title, status, progress) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2a353c";
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = status === "done" ? "#3d7a6e" : "#b56a3a";
  ctx.fillRect(0, 0, 18, 256);
  ctx.fillStyle = "#e8eef1";
  ctx.font = '700 36px "Bricolage Grotesque", sans-serif';
  ctx.fillText((title || "Task").slice(0, 24), 40, 70);
  ctx.fillStyle = "#c5d0d6";
  ctx.font = '500 26px "Literata", serif';
  ctx.fillText(String(status || "queued").toUpperCase(), 40, 120);
  ctx.fillStyle = "#1a2228";
  ctx.fillRect(40, 160, 420, 16);
  ctx.fillStyle = "#f0c97a";
  ctx.fillRect(40, 160, Math.max(4, (420 * (progress || 0)) / 100), 16);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Build a low-poly seated agent figure. */
function createAgentFigure(accentHex) {
  const root = new THREE.Group();
  root.name = "agentFigure";

  const bodyMat = mat(accentHex, { roughness: 0.55, metalness: 0.12 });
  const skinMat = mat(0xd4b59a, { roughness: 0.85 });
  const darkMat = mat(0x243038, { roughness: 0.9 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.28), bodyMat);
  torso.position.set(0, 0.72, 0);
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skinMat);
  head.position.set(0, 1.12, 0.02);
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), darkMat);
  hair.position.set(0, 1.18, -0.01);
  root.add(hair);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), bodyMat);
  armL.position.set(-0.3, 0.7, 0.08);
  armL.rotation.x = -0.85;
  root.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.3;
  root.add(armR);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.18), darkMat);
  legL.position.set(-0.12, 0.28, 0.06);
  legL.rotation.x = 1.15;
  root.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.12;
  root.add(legR);

  root.userData.arms = [armL, armR];
  root.userData.head = head;
  root.userData.bodyMat = bodyMat;
  return root;
}

function createDeskStation(index) {
  const group = new THREE.Group();
  group.name = `desk-${index}`;
  group.userData.deskIndex = index;

  const wood = mat(0x6b4f3a, { roughness: 0.78, metalness: 0.05 });
  const woodDark = mat(0x4a3528, { roughness: 0.85 });
  const metal = mat(0x8a939a, { roughness: 0.35, metalness: 0.65 });
  const screen = mat(0x1a2830, { roughness: 0.3, metalness: 0.2, emissive: 0x1e3a48, emissiveIntensity: 0.25 });

  // Desktop
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 0.85), wood);
  top.position.set(0, 0.74, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Legs
  for (const [x, z] of [
    [-0.65, -0.32],
    [0.65, -0.32],
    [-0.65, 0.32],
    [0.65, 0.32],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.74, 0.07), woodDark);
    leg.position.set(x, 0.37, z);
    leg.castShadow = true;
    group.add(leg);
  }

  // Pedestal drawer
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.55), woodDark);
  pedestal.position.set(0.5, 0.28, 0.05);
  pedestal.castShadow = true;
  group.add(pedestal);

  // Monitor
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.18, 10), metal);
  stand.position.set(-0.15, 0.86, -0.18);
  group.add(stand);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.05), metal);
  bezel.position.set(-0.15, 1.12, -0.2);
  bezel.castShadow = true;
  group.add(bezel);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.32), screen);
  display.position.set(-0.15, 1.12, -0.172);
  group.add(display);
  group.userData.screenMat = screen;

  // Keyboard + mouse
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.16), mat(0x2a3238, { roughness: 0.6 }));
  kb.position.set(-0.1, 0.79, 0.12);
  group.add(kb);
  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.11), mat(0x333b42));
  mouse.position.set(0.28, 0.79, 0.14);
  group.add(mouse);

  // Desk lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), metal);
  lampBase.position.set(0.55, 0.8, -0.22);
  group.add(lampBase);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), metal);
  lampArm.position.set(0.55, 0.98, -0.22);
  lampArm.rotation.z = 0.35;
  group.add(lampArm);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.14, 12, 1, true),
    mat(0xc47a3a, { roughness: 0.45, metalness: 0.35, emissive: 0xf0c97a, emissiveIntensity: 0.15 })
  );
  shade.position.set(0.62, 1.12, -0.18);
  shade.rotation.z = Math.PI;
  group.add(shade);
  const bulb = new THREE.PointLight(0xf0c97a, 0.15, 4, 2);
  bulb.position.set(0.58, 1.05, -0.12);
  group.add(bulb);
  group.userData.lamp = bulb;
  group.userData.shadeMat = shade.material;

  // Chair
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.4), mat(0x3a454c, { roughness: 0.7 }));
  seat.position.set(0, 0.42, 0.55);
  seat.castShadow = true;
  chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.06), mat(0x3a454c));
  back.position.set(0, 0.66, 0.74);
  chair.add(back);
  for (const x of [-0.15, 0.15]) {
    const cleg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), metal);
    cleg.position.set(x, 0.21, 0.55);
    chair.add(cleg);
  }
  group.add(chair);

  // Empty-desk marker ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.02, 8, 28),
    mat(0xb56a3a, { roughness: 0.4, metalness: 0.3, emissive: 0xb56a3a, emissiveIntensity: 0.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.78, 0.05);
  ring.visible = false;
  group.add(ring);
  group.userData.emptyRing = ring;

  // Click proxy
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 1.6, 1.4),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(0, 0.8, 0.1);
  hit.userData.pickable = true;
  hit.userData.deskIndex = index;
  group.add(hit);
  group.userData.hit = hit;

  // Nameplate
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.22),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  plate.position.set(0, 1.55, 0.2);
  group.add(plate);
  group.userData.nameplate = plate;

  group.userData.agentRoot = null;
  group.userData.agentId = null;
  group.userData.busy = false;

  return group;
}

function createRoom(scene) {
  const room = new THREE.Group();
  room.name = "room";

  const floorMat = mat(0x6a5545, { roughness: 0.9, metalness: 0.02 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  // Subtle floor planks via thin strips
  const plankMat = mat(0x5a4638, { roughness: 0.92 });
  for (let i = -7; i <= 7; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 11.5), plankMat);
    plank.position.set(i * 1.05, 0.005, 0);
    room.add(plank);
  }

  const wallMat = mat(0x2f3d46, { roughness: 0.88 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 5.2), wallMat);
  back.position.set(0, 2.6, -5.8);
  back.receiveShadow = true;
  room.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.2), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-7.8, 2.6, 0);
  room.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.2), wallMat);
  right.rotation.y = -Math.PI / 2;
  right.position.set(7.8, 2.6, 0);
  room.add(right);

  // Ceiling beams
  const beamMat = mat(0x3d2f26, { roughness: 0.85 });
  for (let i = -2; i <= 2; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.22, 0.28), beamMat);
    beam.position.set(0, 4.85, i * 2.2);
    beam.castShadow = true;
    room.add(beam);
  }

  // Large window + warm daylight panel
  const frame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.8, 0.12), mat(0x1e282e, { metalness: 0.4, roughness: 0.45 }));
  frame.position.set(2.2, 2.7, -5.74);
  room.add(frame);
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.35, 0.06), mat(0x1e282e, { metalness: 0.35, roughness: 0.5 }));
  mullionV.position.set(2.2, 2.7, -5.7);
  room.add(mullionV);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.08, 0.06), mat(0x1e282e, { metalness: 0.35, roughness: 0.5 }));
  mullionH.position.set(2.2, 2.7, -5.7);
  room.add(mullionH);
  const skyMat = new THREE.MeshStandardMaterial({
    color: 0xb9d0de,
    emissive: 0xf2d7a4,
    emissiveIntensity: 0.55,
    roughness: 0.85,
    metalness: 0,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.35), skyMat);
  glass.position.set(2.2, 2.7, -5.68);
  room.add(glass);

  const warm = new THREE.SpotLight(0xffe0b0, 28, 28, Math.PI / 4.5, 0.45, 1.2);
  warm.position.set(2.2, 3.8, -4.2);
  warm.target.position.set(1.5, 0.5, 0);
  warm.castShadow = true;
  warm.shadow.mapSize.set(1024, 1024);
  room.add(warm);
  room.add(warm.target);

  // Side window
  const glass2 = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.0),
    new THREE.MeshStandardMaterial({
      color: 0xb8d0dc,
      emissive: 0xd8e8f0,
      emissiveIntensity: 0.4,
      roughness: 0.9,
      metalness: 0,
    })
  );
  glass2.rotation.y = Math.PI / 2;
  glass2.position.set(-7.74, 2.5, -1.5);
  room.add(glass2);

  // Rug
  const rug = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.03, 3.2), mat(0x3d4f4a, { roughness: 1 }));
  rug.position.set(0, 0.02, 0.6);
  rug.receiveShadow = true;
  room.add(rug);

  // Bookshelf props
  const shelf = new THREE.Group();
  const caseBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.4), mat(0x4a3a2e));
  caseBody.position.set(-5.8, 1.1, -5.4);
  caseBody.castShadow = true;
  shelf.add(caseBody);
  for (let r = 0; r < 4; r++) {
    for (let b = 0; b < 5; b++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.32, 0.22),
        mat([0xb56a3a, 0x3d7a6e, 0x4a5c68, 0xa65d4a, 0xd4b59a][b])
      );
      book.position.set(-6.35 + b * 0.2, 0.35 + r * 0.5, -5.35);
      shelf.add(book);
    }
  }
  room.add(shelf);

  // Plant
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.28, 12), mat(0x8a5a3a));
  pot.position.set(6.4, 0.14, -4.8);
  room.add(pot);
  const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), mat(0x3d7a5a, { roughness: 0.95 }));
  foliage.position.set(6.4, 0.7, -4.8);
  foliage.castShadow = true;
  room.add(foliage);

  // Coffee table
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.7), mat(0x5a4638));
  table.position.set(-2.2, 0.4, 2.8);
  table.castShadow = true;
  room.add(table);
  for (const [x, z] of [
    [-0.45, -0.25],
    [0.45, -0.25],
    [-0.45, 0.25],
    [0.45, 0.25],
  ]) {
    const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat(0x3a2e26));
    tleg.position.set(-2.2 + x, 0.2, 2.8 + z);
    room.add(tleg);
  }

  scene.add(room);
  return { room, warm };
}

function createWallBoard() {
  const board = new THREE.Group();
  board.name = "taskBoard3d";

  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.1, 0.08), mat(0x3a322c, { roughness: 0.95 }));
  panel.position.set(-2.4, 2.4, -5.72);
  panel.castShadow = true;
  board.add(panel);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.55, 2.25, 0.05), mat(0x8a6a48, { metalness: 0.25, roughness: 0.55 }));
  frame.position.set(-2.4, 2.4, -5.76);
  board.add(frame);

  const headerTex = makeLabelTexture("TASK BOARD", { size: 48, bg: "rgba(42,34,28,0.95)", color: "#f0c97a" });
  const headerMat = new THREE.MeshBasicMaterial({ map: headerTex, transparent: true });
  const header = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.35), headerMat);
  header.position.set(-2.4, 3.25, -5.66);
  board.add(header);
  board.userData.headerMat = headerMat;

  const cards = [];
  for (let i = 0; i < 3; i++) {
    const cardMat = new THREE.MeshBasicMaterial({
      map: makeBoardCardTexture("—", "idle", 0),
      transparent: false,
    });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.68), cardMat);
    const col = i % 3;
    card.position.set(-3.45 + col * 1.05, 2.35, -5.65);
    card.visible = false;
    board.add(card);
    cards.push({ mesh: card, mat: cardMat });
  }

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 2.3, 0.4),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(-2.4, 2.4, -5.7);
  hit.userData.pickable = true;
  hit.userData.isBoard = true;
  board.add(hit);

  board.userData.cards = cards;
  return board;
}

/**
 * OfficeScene — Three.js loft with desks, agents, wall board.
 */
export class OfficeScene {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ onSelectDesk: (deskIndex:number, agentId:string|null) => void, onSelectBoard: () => void, onSelectEmpty: (deskIndex:number) => void }} hooks
   */
  constructor(canvas, hooks = {}) {
    this.canvas = canvas;
    this.hooks = hooks;
    this.clock = new THREE.Clock();
    this.desks = [];
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._autoOrbit = true;
    this._reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x152028);
    this.scene.fog = new THREE.Fog(0x152028, 14, 32);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.set(6.8, 4.6, 9.2);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0.2, 1.1, -0.4);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 16;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.enablePan = false;
    this.controls.autoRotate = !this._reduced;
    this.controls.autoRotateSpeed = 0.45;
    this.controls.addEventListener("start", () => {
      this._autoOrbit = false;
      this.controls.autoRotate = false;
    });

    // Lights
    const hemi = new THREE.HemisphereLight(0xd8e6f0, 0x3a2e24, 0.55);
    this.scene.add(hemi);
    const fill = new THREE.DirectionalLight(0xb8c8d4, 0.55);
    fill.position.set(-6, 8, 4);
    this.scene.add(fill);
    const ambient = new THREE.AmbientLight(0x6a7882, 0.28);
    this.scene.add(ambient);

    createRoom(this.scene);
    this.wallBoard = createWallBoard();
    this.scene.add(this.wallBoard);

    // Desk row
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0.4, 0, -1.1);
    for (let i = 0; i < MAX_DESKS; i++) {
      const desk = createDeskStation(i);
      const col = i % 3;
      const row = Math.floor(i / 3);
      desk.position.set((col - 1) * DESK_SPACING, 0, row * 2.9);
      desk.rotation.y = row === 0 ? 0 : Math.PI;
      deskGroup.add(desk);
      this.desks.push(desk);
    }
    this.scene.add(deskGroup);

    this._pointerDown = null;
    this._onResize = () => this.resize();
    this._onPointerDown = (e) => {
      this._pointerDown = { x: e.clientX, y: e.clientY };
    };
    this._onPointer = (e) => this._handlePointer(e);
    window.addEventListener("resize", this._onResize);
    canvas.addEventListener("pointerdown", this._onPointerDown);
    canvas.addEventListener("pointerup", this._onPointer);

    this._raf = requestAnimationFrame(() => this._tick());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    this.canvas.removeEventListener("pointerup", this._onPointer);
    this.controls.dispose();
    this.renderer.dispose();
  }

  focusLoft() {
    this.controls.autoRotate = !this._reduced;
    this._autoOrbit = !this._reduced;
  }

  _handlePointer(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (this._pointerDown) {
      const dx = event.clientX - this._pointerDown.x;
      const dy = event.clientY - this._pointerDown.y;
      this._pointerDown = null;
      if (dx * dx + dy * dy > 36) return; // drag / orbit — skip pick
    }
    const rect = this.canvas.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const pickables = [];
    for (const desk of this.desks) {
      if (desk.userData.hit) pickables.push(desk.userData.hit);
    }
    if (this.wallBoard) {
      this.wallBoard.traverse((o) => {
        if (o.userData?.pickable) pickables.push(o);
      });
    }
    const hits = this._raycaster.intersectObjects(pickables, false);
    if (!hits.length) return;
    const obj = hits[0].object;
    if (obj.userData.isBoard) {
      this.hooks.onSelectBoard?.();
      return;
    }
    const idx = obj.userData.deskIndex;
    const desk = this.desks[idx];
    if (!desk) return;
    if (desk.userData.agentId) {
      this.hooks.onSelectDesk?.(idx, desk.userData.agentId);
    } else {
      this.hooks.onSelectEmpty?.(idx);
    }
  }

  /**
   * Sync desks with agent list + busy map.
   * @param {object[]} agents
   * @param {Map<string, object>} busyMap agentId -> task
   */
  syncAgents(agents, busyMap = new Map()) {
    for (let i = 0; i < this.desks.length; i++) {
      const desk = this.desks[i];
      const agent = agents[i] || null;

      // Clear previous figure
      if (desk.userData.agentRoot) {
        desk.remove(desk.userData.agentRoot);
        desk.userData.agentRoot = null;
      }
      desk.userData.agentId = agent?.id || null;

      if (agent) {
        desk.userData.emptyRing.visible = false;
        const accent = ACCENTS[agent.accent] || ACCENTS.copper;
        const figure = createAgentFigure(accent);
        // Face the desk (toward negative Z in local desk space for row 0)
        const row = Math.floor(i / 3);
        figure.position.set(0, 0, row === 0 ? 0.52 : -0.52);
        figure.rotation.y = row === 0 ? Math.PI : 0;
        desk.add(figure);
        desk.userData.agentRoot = figure;

        const task = busyMap.get(agent.id);
        const busy = !!(task && (task.status === "running" || task.status === "queued"));
        desk.userData.busy = busy;
        this._setDeskBusy(desk, busy, task?.progress || 0);

        // Nameplate
        const tex = makeLabelTexture(agent.name);
        const plate = desk.userData.nameplate;
        if (plate.material.map) plate.material.map.dispose();
        plate.material.map = tex;
        plate.material.opacity = 1;
        plate.material.needsUpdate = true;
        plate.visible = true;
      } else {
        desk.userData.emptyRing.visible = true;
        desk.userData.busy = false;
        this._setDeskBusy(desk, false, 0);
        desk.userData.nameplate.visible = false;
      }
    }
  }

  _setDeskBusy(desk, busy, progress) {
    const lamp = desk.userData.lamp;
    const shade = desk.userData.shadeMat;
    const screen = desk.userData.screenMat;
    if (lamp) lamp.intensity = busy ? 1.35 : 0.18;
    if (shade) shade.emissiveIntensity = busy ? 0.85 : 0.12;
    if (screen) {
      screen.emissiveIntensity = busy ? 0.7 : 0.2;
      screen.emissive = new THREE.Color(busy ? 0x3d8f7a : 0x1e3a48);
    }
    desk.userData.progress = progress;
  }

  /**
   * Update 3D wall board cards from tasks (newest first, up to 3).
   * @param {object[]} tasks
   */
  setBoardTitle(title) {
    const mat = this.wallBoard?.userData?.headerMat;
    if (!mat) return;
    if (mat.map) mat.map.dispose();
    mat.map = makeLabelTexture(title || "TASK BOARD", {
      size: 48,
      bg: "rgba(42,34,28,0.95)",
      color: "#f0c97a",
    });
    mat.needsUpdate = true;
  }

  syncTasks(tasks) {
    const cards = this.wallBoard.userData.cards;
    for (let i = 0; i < cards.length; i++) {
      const task = tasks[i];
      const { mesh, mat: cardMat } = cards[i];
      if (!task) {
        mesh.visible = false;
        continue;
      }
      if (cardMat.map) cardMat.map.dispose();
      cardMat.map = makeBoardCardTexture(task.title, task.step || task.status, task.progress || 0);
      cardMat.needsUpdate = true;
      mesh.visible = true;
    }

    // Also refresh busy lamps from current desk state
    for (const desk of this.desks) {
      if (desk.userData.agentId) {
        // progress already set via syncAgents; pulse handled in tick
      }
    }
  }

  setAgentBusy(agentId, busy, progress = 0) {
    const desk = this.desks.find((d) => d.userData.agentId === agentId);
    if (!desk) return;
    desk.userData.busy = busy;
    this._setDeskBusy(desk, busy, progress);
  }

  _tick = () => {
    this._raf = requestAnimationFrame(this._tick);
    const t = this.clock.getElapsedTime();
    this.controls.update();

    for (const desk of this.desks) {
      const fig = desk.userData.agentRoot;
      if (!fig) continue;
      if (desk.userData.busy) {
        const arms = fig.userData.arms || [];
        arms.forEach((arm, i) => {
          arm.rotation.x = -0.85 + Math.sin(t * 4 + i) * 0.18;
        });
        if (fig.userData.head) {
          fig.userData.head.position.y = 1.12 + Math.sin(t * 2.2) * 0.012;
        }
        const lamp = desk.userData.lamp;
        if (lamp) lamp.intensity = 1.1 + Math.sin(t * 3.5) * 0.25;
      }
      const plate = desk.userData.nameplate;
      if (plate?.visible) {
        plate.quaternion.copy(this.camera.quaternion);
      }
    }

    // Soft window shimmer via exposure
    this.renderer.toneMappingExposure = 1.0 + Math.sin(t * 0.35) * 0.04;
    this.renderer.render(this.scene, this.camera);
  };
}
