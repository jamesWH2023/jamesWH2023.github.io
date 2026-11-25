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
const DESK_SPACING = 2.7;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.08,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    flatShading: opts.flatShading ?? false,
  });
}

function makeLabelTexture(text, opts = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts.bg || "rgba(26,34,40,0.88)";
  roundRect(ctx, 8, 16, 496, 96, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(240,201,122,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
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
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  // Cork-paper note
  ctx.fillStyle = "#f3e6d0";
  ctx.fillRect(0, 0, 512, 220);
  ctx.fillStyle = status === "done" ? "#3d7a6e" : "#b56a3a";
  ctx.fillRect(0, 0, 512, 10);
  ctx.fillStyle = "#2a2220";
  ctx.font = '700 34px "Bricolage Grotesque", sans-serif';
  ctx.fillText((title || "Task").slice(0, 22), 28, 62);
  ctx.fillStyle = "#5a4a40";
  ctx.font = '600 24px "Literata", serif';
  ctx.fillText(String(status || "queued").toUpperCase(), 28, 108);
  ctx.fillStyle = "#d8c8b0";
  ctx.fillRect(28, 150, 456, 18);
  ctx.fillStyle = "#c47a3a";
  ctx.fillRect(28, 150, Math.max(6, (456 * (progress || 0)) / 100), 18);
  // pin dots
  ctx.fillStyle = "#8a3030";
  ctx.beginPath();
  ctx.arc(480, 28, 8, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Remodeled low-poly seated agent — jacket, collar, bent posture. */
function createAgentFigure(accentHex) {
  const root = new THREE.Group();
  root.name = "agentFigure";

  const jacket = mat(accentHex, { roughness: 0.5, metalness: 0.14, flatShading: true });
  const pants = mat(0x2c3640, { roughness: 0.82, flatShading: true });
  const skin = mat(0xd8b89a, { roughness: 0.88 });
  const hairMat = mat(0x1e262c, { roughness: 0.7 });
  const shirt = mat(0xe8eef1, { roughness: 0.75 });

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.28), pants);
  hips.position.set(0, 0.48, 0.02);
  hips.castShadow = true;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.26), jacket);
  torso.position.set(0, 0.78, -0.02);
  torso.rotation.x = 0.12;
  torso.castShadow = true;
  root.add(torso);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.18), shirt);
  collar.position.set(0, 0.98, 0.06);
  root.add(collar);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), skin);
  head.position.set(0, 1.18, 0.04);
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.155, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hair.position.set(0, 1.24, -0.01);
  root.add(hair);

  const makeArm = (side) => {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.11), jacket);
    upper.position.set(0, -0.1, 0);
    upper.castShadow = true;
    arm.add(upper);
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.1), jacket);
    forearm.position.set(0, -0.32, 0.08);
    forearm.rotation.x = -0.9;
    arm.add(forearm);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.09), skin);
    hand.position.set(0, -0.44, 0.16);
    arm.add(hand);
    arm.position.set(side * 0.28, 0.92, 0.02);
    arm.rotation.z = side * 0.12;
    arm.rotation.x = -0.75;
    return arm;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  root.add(armL, armR);

  const makeLeg = (side) => {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.16), pants);
    thigh.position.set(0, -0.08, 0.06);
    thigh.rotation.x = 1.05;
    thigh.castShadow = true;
    leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.14), pants);
    shin.position.set(0, -0.12, 0.22);
    shin.rotation.x = 0.15;
    leg.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.22), mat(0x1a2228, { roughness: 0.55 }));
    shoe.position.set(0, -0.24, 0.28);
    leg.add(shoe);
    leg.position.set(side * 0.11, 0.42, 0);
    return leg;
  };
  root.add(makeLeg(-1), makeLeg(1));

  root.userData.arms = [armL, armR];
  root.userData.head = head;
  root.userData.bodyMat = jacket;
  return root;
}

/** Remodeled workstation: waterfall oak desk, ultrawide, gooseneck lamp, task chair. */
function createDeskStation(index) {
  const group = new THREE.Group();
  group.name = `desk-${index}`;
  group.userData.deskIndex = index;

  const oak = mat(0x9a7354, { roughness: 0.62, metalness: 0.04 });
  const oakEdge = mat(0x7a5840, { roughness: 0.7 });
  const graphite = mat(0x3a444c, { roughness: 0.4, metalness: 0.45 });
  const chrome = mat(0xb0b8c0, { roughness: 0.28, metalness: 0.78 });
  const screen = mat(0x152028, {
    roughness: 0.22,
    metalness: 0.25,
    emissive: 0x2a5568,
    emissiveIntensity: 0.4,
  });
  const cushion = mat(0x3d4a52, { roughness: 0.85 });

  // Waterfall top + side panels (no thin legs)
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.78), oak);
  top.position.set(0, 0.76, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 0.78), oakEdge);
  leftPanel.position.set(-0.82, 0.38, 0);
  leftPanel.castShadow = true;
  group.add(leftPanel);
  const rightPanel = leftPanel.clone();
  rightPanel.position.x = 0.82;
  group.add(rightPanel);
  const modesty = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.35, 0.04), oakEdge);
  modesty.position.set(0, 0.45, -0.34);
  group.add(modesty);

  // Cable tray under desk
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.12), graphite);
  tray.position.set(0, 0.68, -0.2);
  group.add(tray);

  // Ultrawide monitor on arm
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 16), chrome);
  base.position.set(-0.08, 0.8, -0.22);
  group.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 10), chrome);
  pole.position.set(-0.08, 1.02, -0.22);
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.04), chrome);
  arm.position.set(0.02, 1.2, -0.22);
  group.add(arm);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.38, 0.04), graphite);
  bezel.position.set(0.08, 1.2, -0.18);
  bezel.rotation.x = -0.08;
  bezel.castShadow = true;
  group.add(bezel);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.3), screen);
  display.position.set(0.08, 1.2, -0.155);
  display.rotation.x = -0.08;
  group.add(display);
  group.userData.screenMat = screen;

  // Compact keyboard + trackpad
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.14), graphite);
  kb.position.set(-0.12, 0.8, 0.14);
  group.add(kb);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.12), mat(0x2a3238));
  pad.position.set(0.22, 0.8, 0.14);
  group.add(pad);

  // Gooseneck desk lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.035, 14), chrome);
  lampBase.position.set(0.58, 0.8, -0.18);
  group.add(lampBase);
  const goose = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 16, Math.PI * 1.1), chrome);
  goose.position.set(0.58, 0.98, -0.18);
  goose.rotation.set(0, 0, Math.PI * 0.55);
  group.add(goose);
  const shade = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(0xd4924a, { roughness: 0.4, metalness: 0.35, emissive: 0xffd090, emissiveIntensity: 0.35 })
  );
  shade.position.set(0.42, 1.08, -0.1);
  shade.rotation.x = Math.PI;
  group.add(shade);
  const bulb = new THREE.PointLight(0xffd090, 0.45, 5, 2);
  bulb.position.set(0.42, 1.02, -0.05);
  group.add(bulb);
  group.userData.lamp = bulb;
  group.userData.shadeMat = shade.material;

  // Cup + notebook
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 12), mat(0xe8eef1, { roughness: 0.5 }));
  cup.position.set(0.55, 0.84, 0.18);
  group.add(cup);
  const note = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.01, 0.22), mat(0xf0e6d4));
  note.position.set(0.35, 0.8, 0.22);
  note.rotation.y = 0.2;
  group.add(note);

  // Task chair with arms + star base
  const chair = new THREE.Group();
  chair.position.set(0, 0, 0.62);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.42), cushion);
  seat.position.set(0, 0.48, 0);
  seat.castShadow = true;
  chair.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.07), cushion);
  backrest.position.set(0, 0.78, 0.2);
  backrest.rotation.x = -0.12;
  chair.add(backrest);
  for (const s of [-1, 1]) {
    const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.28), chrome);
    armrest.position.set(s * 0.24, 0.62, 0.02);
    chair.add(armrest);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 12), chrome);
  hub.position.set(0, 0.28, 0);
  chair.add(hub);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.04), chrome);
    spoke.position.set(Math.cos(a) * 0.14, 0.22, Math.sin(a) * 0.14);
    spoke.rotation.y = -a;
    chair.add(spoke);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), graphite);
    wheel.position.set(Math.cos(a) * 0.26, 0.12, Math.sin(a) * 0.26);
    chair.add(wheel);
  }
  group.add(chair);

  // Hire ring (empty desk marker) — hexagonal
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.018, 6, 6),
    mat(0xb56a3a, { roughness: 0.35, metalness: 0.4, emissive: 0xb56a3a, emissiveIntensity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.8, 0.08);
  ring.visible = false;
  group.add(ring);
  group.userData.emptyRing = ring;

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 1.7, 1.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(0, 0.85, 0.15);
  hit.userData.pickable = true;
  hit.userData.deskIndex = index;
  group.add(hit);
  group.userData.hit = hit;

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.24),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  plate.position.set(0, 1.62, 0.25);
  group.add(plate);
  group.userData.nameplate = plate;

  group.userData.agentRoot = null;
  group.userData.agentId = null;
  group.userData.busy = false;

  return group;
}

/** Fresh loft shell: wainscot walls, bay window wall, rafters, skylight glow, lounge. */
function createRoom(scene) {
  const room = new THREE.Group();
  room.name = "room";

  const plaster = mat(0x5c6e78, { roughness: 0.9 });
  const wainscot = mat(0x3e4a52, { roughness: 0.75, metalness: 0.05 });
  const timber = mat(0x6b4e38, { roughness: 0.8 });
  const timberDark = mat(0x4a3426, { roughness: 0.85 });
  const floorOak = mat(0x9a7a5c, { roughness: 0.78 });

  // Floor with diagonal-ish plank strips
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(17, 13), floorOak);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);
  for (let i = -8; i <= 8; i++) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 12.2), mat(0x866848, { roughness: 0.9 }));
    seam.position.set(i * 0.95, 0.006, 0);
    room.add(seam);
  }

  // Back wall + wainscot
  const back = new THREE.Mesh(new THREE.PlaneGeometry(17, 5.4), plaster);
  back.position.set(0, 2.7, -6.0);
  back.receiveShadow = true;
  room.add(back);
  const backW = new THREE.Mesh(new THREE.BoxGeometry(17, 1.15, 0.08), wainscot);
  backW.position.set(0, 0.55, -5.96);
  room.add(backW);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(13, 5.4), plaster);
  left.rotation.y = Math.PI / 2;
  left.position.set(-8.2, 2.7, 0);
  room.add(left);
  const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 13), wainscot);
  leftW.position.set(-8.16, 0.55, 0);
  room.add(leftW);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(13, 5.4), plaster);
  right.rotation.y = -Math.PI / 2;
  right.position.set(8.2, 2.7, 0);
  room.add(right);

  // Ceiling slab + rafters
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(17, 13), mat(0x6a7880, { roughness: 0.95 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5.15;
  room.add(ceiling);
  for (let i = -3; i <= 3; i++) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.18, 0.22), timberDark);
    rafter.position.set(0, 5.0, i * 1.7);
    rafter.castShadow = true;
    room.add(rafter);
  }
  // Ridge beam
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 12.5), timber);
  ridge.position.set(0, 5.05, 0);
  room.add(ridge);

  // Skylight strip (emissive)
  const skyStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xe8f4ff,
      emissive: 0xfff2d8,
      emissiveIntensity: 1.2,
      roughness: 0.6,
    })
  );
  skyStrip.rotation.x = Math.PI / 2;
  skyStrip.position.set(3.2, 5.12, -1.5);
  room.add(skyStrip);
  const skyLight = new THREE.PointLight(0xfff0d0, 10, 16, 1.5);
  skyLight.position.set(3.2, 4.6, -1.5);
  room.add(skyLight);

  // Bay window wall (3 panes)
  const bayZ = -5.92;
  const bayY = 2.85;
  const frameMat = mat(0x2a343c, { metalness: 0.35, roughness: 0.45 });
  const bayFrame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.1, 0.14), frameMat);
  bayFrame.position.set(2.6, bayY, bayZ);
  room.add(bayFrame);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xd8eaf6,
    emissive: 0xffe6b8,
    emissiveIntensity: 1.1,
    roughness: 0.55,
  });
  for (let i = 0; i < 3; i++) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 2.45), glassMat);
    pane.position.set(1.0 + i * 1.7, bayY, bayZ + 0.08);
    room.add(pane);
  }
  for (let i = 0; i < 2; i++) {
    const mull = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.55, 0.08), frameMat);
    mull.position.set(1.85 + i * 1.7, bayY, bayZ + 0.06);
    room.add(mull);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.12, 0.35), timber);
  sill.position.set(2.6, 1.25, bayZ + 0.15);
  room.add(sill);

  const warm = new THREE.SpotLight(0xffe8c0, 48, 32, Math.PI / 4, 0.38, 1.0);
  warm.position.set(2.6, 4.0, -4.0);
  warm.target.position.set(1.2, 0.6, 0.5);
  warm.castShadow = true;
  warm.shadow.mapSize.set(1024, 1024);
  room.add(warm, warm.target);

  const windowFill = new THREE.PointLight(0xfff2dc, 12, 15, 1.5);
  windowFill.position.set(2.6, 2.8, -4.2);
  room.add(windowFill);

  // Side clerestory
  const sideGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.4),
    new THREE.MeshStandardMaterial({
      color: 0xd0e4f0,
      emissive: 0xeaf4fa,
      emissiveIntensity: 0.85,
      roughness: 0.7,
    })
  );
  sideGlass.rotation.y = Math.PI / 2;
  sideGlass.position.set(-8.14, 3.6, -0.8);
  room.add(sideGlass);

  // Pendant lamps over lounge
  for (const x of [-2.4, -1.2]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.1, 6), mat(0x1a2228));
    cord.position.set(x, 4.4, 2.6);
    room.add(cord);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.28, 16, 1, true),
      mat(0xc47a3a, { roughness: 0.45, metalness: 0.2, emissive: 0xf0c97a, emissiveIntensity: 0.45 })
    );
    shade.position.set(x, 3.75, 2.6);
    room.add(shade);
    const pl = new THREE.PointLight(0xffd8a0, 3.5, 7, 2);
    pl.position.set(x, 3.55, 2.6);
    room.add(pl);
  }

  // Area rug (rounded via overlapping discs approx with box + border)
  const rug = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.025, 2.6), mat(0x4a6860, { roughness: 1 }));
  rug.position.set(-1.8, 0.015, 2.5);
  rug.receiveShadow = true;
  room.add(rug);
  const rugBorder = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.02, 2.8), mat(0x3a524c, { roughness: 1 }));
  rugBorder.position.set(-1.8, 0.01, 2.5);
  room.add(rugBorder);

  // Lounge sofa
  const sofa = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 0.85), mat(0x5a6a72, { roughness: 0.9 }));
  seat.position.set(0, 0.35, 0);
  seat.castShadow = true;
  sofa.add(seat);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.18), mat(0x4a5a62, { roughness: 0.88 }));
  sofaBack.position.set(0, 0.7, -0.35);
  sofa.add(sofaBack);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.85), mat(0x4a5a62));
    arm.position.set(s * 1.05, 0.5, 0);
    sofa.add(arm);
  }
  sofa.position.set(-1.8, 0, 2.55);
  room.add(sofa);

  // Low coffee table with tray
  const ctable = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 24), timber);
  ctable.position.set(-1.8, 0.32, 3.55);
  ctable.castShadow = true;
  room.add(ctable);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.28, 8), timberDark);
    leg.position.set(-1.8 + Math.cos(a) * 0.35, 0.14, 3.55 + Math.sin(a) * 0.35);
    room.add(leg);
  }

  // Tall bookshelf with staggered objects
  const caseBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.6, 0.42), timberDark);
  caseBody.position.set(-5.9, 1.3, -5.55);
  caseBody.castShadow = true;
  room.add(caseBody);
  for (let r = 0; r < 5; r++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.38), timber);
    shelf.position.set(-5.9, 0.35 + r * 0.48, -5.52);
    room.add(shelf);
    for (let b = 0; b < 6; b++) {
      const h = 0.22 + (b % 3) * 0.05;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, h, 0.26),
        mat([0xb56a3a, 0x3d7a6e, 0x5a7382, 0xa65d4a, 0xd4b59a, 0x4a5c68][b])
      );
      book.position.set(-6.5 + b * 0.2, 0.35 + r * 0.48 + h / 2 + 0.02, -5.5);
      room.add(book);
    }
  }

  // Fiddle-leaf plant (trunk + layered leaves)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.32, 14), mat(0xc4a882, { roughness: 0.7 }));
  pot.position.set(6.6, 0.16, -4.9);
  room.add(pot);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 8), timberDark);
  trunk.position.set(6.6, 0.75, -4.9);
  room.add(trunk);
  const leafMat = mat(0x3f8a5a, { roughness: 0.7, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(6.6 + Math.cos(a) * 0.28, 1.15 + (i % 3) * 0.18, -4.9 + Math.sin(a) * 0.28);
    leaf.scale.set(1.2, 0.45, 0.9);
    leaf.castShadow = true;
    room.add(leaf);
  }

  // Corner floor lamp
  const flBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.04, 16), chromeLike());
  flBase.position.set(6.8, 0.02, 2.2);
  room.add(flBase);
  const flPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 10), chromeLike());
  flPole.position.set(6.8, 0.87, 2.2);
  room.add(flPole);
  const flShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.35, 16, 1, true),
    mat(0xe8dcc8, { roughness: 0.85, emissive: 0xffe8c0, emissiveIntensity: 0.25 })
  );
  flShade.position.set(6.8, 1.85, 2.2);
  room.add(flShade);
  const flLight = new THREE.PointLight(0xffe8c8, 4, 8, 2);
  flLight.position.set(6.8, 1.7, 2.2);
  room.add(flLight);

  scene.add(room);
  return { room, warm };

  function chromeLike() {
    return mat(0xa8b0b8, { roughness: 0.3, metalness: 0.7 });
  }
}

/** Cork-style task board with vertical note slots. */
function createWallBoard() {
  const board = new THREE.Group();
  board.name = "taskBoard3d";

  const cork = mat(0xc4a574, { roughness: 0.95 });
  const wood = mat(0x6b4e38, { roughness: 0.65, metalness: 0.1 });

  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 0.1), cork);
  panel.position.set(-2.5, 2.55, -5.9);
  panel.castShadow = true;
  board.add(panel);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 0.08), wood);
  frame.position.set(-2.5, 2.55, -5.96);
  board.add(frame);

  // Shelf ledge under board
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 0.22), wood);
  ledge.position.set(-2.5, 1.28, -5.82);
  board.add(ledge);

  const headerTex = makeLabelTexture("TASK BOARD", {
    size: 44,
    bg: "rgba(60,42,28,0.92)",
    color: "#f0c97a",
  });
  const headerMat = new THREE.MeshBasicMaterial({ map: headerTex, transparent: true });
  const header = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.32), headerMat);
  header.position.set(-2.5, 3.5, -5.82);
  board.add(header);
  board.userData.headerMat = headerMat;

  const cards = [];
  for (let i = 0; i < 3; i++) {
    const cardMat = new THREE.MeshBasicMaterial({
      map: makeBoardCardTexture("—", "idle", 0),
    });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), cardMat);
    card.position.set(-2.5, 3.05 - i * 0.62, -5.82);
    card.rotation.z = (i - 1) * 0.02;
    card.visible = false;
    board.add(card);
    // push-pin
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      mat(0xa03030, { metalness: 0.4, roughness: 0.4, emissive: 0x601010, emissiveIntensity: 0.2 })
    );
    pin.position.set(-1.55, 3.22 - i * 0.62, -5.78);
    board.add(pin);
    cards.push({ mesh: card, mat: cardMat });
  }

  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 2.7, 0.45),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.set(-2.5, 2.55, -5.85);
  hit.userData.pickable = true;
  hit.userData.isBoard = true;
  board.add(hit);

  board.userData.cards = cards;
  return board;
}

/**
 * OfficeScene — remodeled Three.js loft with desks, agents, wall board.
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
    this.renderer.toneMappingExposure = 1.38;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x314550);
    this.scene.fog = new THREE.Fog(0x314550, 16, 36);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.set(7.4, 4.9, 9.6);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0.1, 1.2, -0.2);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 4.5;
    this.controls.maxDistance = 16;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.enablePan = false;
    this.controls.autoRotate = !this._reduced;
    this.controls.autoRotateSpeed = 0.4;
    this.controls.addEventListener("start", () => {
      this._autoOrbit = false;
      this.controls.autoRotate = false;
    });

    const hemi = new THREE.HemisphereLight(0xf2f6f8, 0x6a5648, 1.2);
    this.scene.add(hemi);
    const fill = new THREE.DirectionalLight(0xeaf2f8, 1.1);
    fill.position.set(-7, 9, 5);
    this.scene.add(fill);
    const key = new THREE.DirectionalLight(0xfff1dc, 0.7);
    key.position.set(6, 7, 4);
    this.scene.add(key);
    const ambient = new THREE.AmbientLight(0xc8d2da, 0.5);
    this.scene.add(ambient);

    createRoom(this.scene);
    this.wallBoard = createWallBoard();
    this.scene.add(this.wallBoard);

    const deskGroup = new THREE.Group();
    deskGroup.position.set(0.5, 0, -1.0);
    for (let i = 0; i < MAX_DESKS; i++) {
      const desk = createDeskStation(i);
      const col = i % 3;
      const row = Math.floor(i / 3);
      desk.position.set((col - 1) * DESK_SPACING, 0, row * 3.05);
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
      if (dx * dx + dy * dy > 36) return;
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
   * @param {object[]} agents
   * @param {Map<string, object>} busyMap
   */
  syncAgents(agents, busyMap = new Map()) {
    for (let i = 0; i < this.desks.length; i++) {
      const desk = this.desks[i];
      const agent = agents[i] || null;

      if (desk.userData.agentRoot) {
        desk.remove(desk.userData.agentRoot);
        desk.userData.agentRoot = null;
      }
      desk.userData.agentId = agent?.id || null;

      if (agent) {
        desk.userData.emptyRing.visible = false;
        const accent = ACCENTS[agent.accent] || ACCENTS.copper;
        const figure = createAgentFigure(accent);
        const row = Math.floor(i / 3);
        figure.position.set(0, 0, row === 0 ? 0.55 : -0.55);
        figure.rotation.y = row === 0 ? Math.PI : 0;
        desk.add(figure);
        desk.userData.agentRoot = figure;

        const task = busyMap.get(agent.id);
        const busy = !!(task && (task.status === "running" || task.status === "queued"));
        desk.userData.busy = busy;
        this._setDeskBusy(desk, busy, task?.progress || 0);

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
    if (lamp) lamp.intensity = busy ? 1.65 : 0.45;
    if (shade) shade.emissiveIntensity = busy ? 1.0 : 0.35;
    if (screen) {
      screen.emissiveIntensity = busy ? 0.95 : 0.4;
      screen.emissive = new THREE.Color(busy ? 0x3d9a82 : 0x2a5568);
    }
    desk.userData.progress = progress;
  }

  setBoardTitle(title) {
    const headerMat = this.wallBoard?.userData?.headerMat;
    if (!headerMat) return;
    if (headerMat.map) headerMat.map.dispose();
    headerMat.map = makeLabelTexture(title || "TASK BOARD", {
      size: 44,
      bg: "rgba(60,42,28,0.92)",
      color: "#f0c97a",
    });
    headerMat.needsUpdate = true;
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
          arm.rotation.x = -0.75 + Math.sin(t * 4 + i) * 0.2;
        });
        if (fig.userData.head) {
          fig.userData.head.position.y = 1.18 + Math.sin(t * 2.2) * 0.012;
        }
        const lamp = desk.userData.lamp;
        if (lamp) lamp.intensity = 1.2 + Math.sin(t * 3.5) * 0.28;
      }
      const plate = desk.userData.nameplate;
      if (plate?.visible) {
        plate.quaternion.copy(this.camera.quaternion);
      }
    }

    this.renderer.toneMappingExposure = 1.35 + Math.sin(t * 0.35) * 0.05;
    this.renderer.render(this.scene, this.camera);
  };
}
