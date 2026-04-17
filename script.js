"use strict";

// ─────────────────────────────────────────────
// 1. SCENE SETUP
// ─────────────────────────────────────────────
const canvas = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x08090a, 0.018);
scene.background = new THREE.Color(0x08090a);

// ─── CAMERA ───
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// Camera state — all scroll-driven transitions operate on this object
const camState = {
  x: 0,
  y: 18,
  z: 80, // current position (lerp target)
  lx: 0,
  ly: 6,
  lz: 0, // current lookAt
  // parallax offsets (mouse-driven)
  px: 0,
  py: 0,
};
camera.position.set(camState.x, camState.y, camState.z);
camera.lookAt(camState.lx, camState.ly, camState.lz);

// ─────────────────────────────────────────────
// 2. LIGHTING
// ─────────────────────────────────────────────

// Ambient (very low — cinematic)
const ambientLight = new THREE.AmbientLight(0xfff5e0, 0.15);
scene.add(ambientLight);

// Key light (warm, dramatic angle — simulates golden hour)
const keyLight = new THREE.DirectionalLight(0xffd98f, 2.2);
keyLight.position.set(40, 60, 30);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 300;
keyLight.shadow.camera.left = -80;
keyLight.shadow.camera.right = 80;
keyLight.shadow.camera.top = 80;
keyLight.shadow.camera.bottom = -80;
keyLight.shadow.bias = -0.0005;
keyLight.shadow.radius = 3;
scene.add(keyLight);

// Rim light (cool blue-grey, opposite side)
const rimLight = new THREE.DirectionalLight(0x8fa8c8, 0.6);
rimLight.position.set(-60, 30, -40);
scene.add(rimLight);

// Ground fill (very soft)
const fillLight = new THREE.HemisphereLight(0x202530, 0x0a0a0a, 0.4);
scene.add(fillLight);

// Accent point lights (interior glow through windows)
const pointColors = [0xffd98f, 0xffb36e, 0xffe5b4];
const pointPositions = [
  [-8, 5, 2],
  [6, 5, -3],
  [0, 10, 8],
  [-12, 8, -5],
  [14, 4, 6],
];
pointPositions.forEach((pos, i) => {
  const pt = new THREE.PointLight(pointColors[i % 3], 1.2, 20);
  pt.position.set(...pos);
  scene.add(pt);
});

// ─────────────────────────────────────────────
// 3. PROCEDURAL ARCHITECTURE MODEL
//    (Luxury villa compound — no GLB needed)
// ─────────────────────────────────────────────

const archGroup = new THREE.Group();
scene.add(archGroup);

// ── Material palette ──
const matConcrete = new THREE.MeshStandardMaterial({
  color: 0x2a2a28,
  roughness: 0.85,
  metalness: 0.05,
});
const matMarble = new THREE.MeshStandardMaterial({
  color: 0xddd8cc,
  roughness: 0.3,
  metalness: 0.1,
});
const matGlass = new THREE.MeshStandardMaterial({
  color: 0x4d6b8a,
  roughness: 0.05,
  metalness: 0.9,
  transparent: true,
  opacity: 0.55,
  envMapIntensity: 2,
});
const matGlassDark = new THREE.MeshStandardMaterial({
  color: 0x1a2530,
  roughness: 0.02,
  metalness: 1.0,
  transparent: true,
  opacity: 0.7,
});
const matAccent = new THREE.MeshStandardMaterial({
  color: 0xc9a96e,
  roughness: 0.3,
  metalness: 0.8,
});
const matDark = new THREE.MeshStandardMaterial({
  color: 0x141412,
  roughness: 0.9,
  metalness: 0,
});
const matStone = new THREE.MeshStandardMaterial({
  color: 0x3a3830,
  roughness: 0.95,
  metalness: 0,
});
const matLightBox = new THREE.MeshStandardMaterial({
  color: 0xffd98f,
  roughness: 1,
  metalness: 0,
  emissive: 0xffd98f,
  emissiveIntensity: 0.8,
});

// Helper: add a box mesh
function addBox(parent, w, h, d, x, y, z, mat, castS = true, recvS = true) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = castS;
  mesh.receiveShadow = recvS;
  parent.add(mesh);
  return mesh;
}

// ── Ground plane ──
const groundGeo = new THREE.PlaneGeometry(300, 300);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x0e0e0c,
  roughness: 1,
  metalness: 0,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ── Pool / water feature ──
const poolGeo = new THREE.BoxGeometry(22, 0.3, 8);
const poolMat = new THREE.MeshStandardMaterial({
  color: 0x1a3a4a,
  roughness: 0.05,
  metalness: 0.8,
  transparent: true,
  opacity: 0.85,
});
const pool = new THREE.Mesh(poolGeo, poolMat);
pool.position.set(0, 0.15, 14);
pool.receiveShadow = true;
archGroup.add(pool);

// Pool edge strips (marble)
[-11.4, 11.4].forEach((x) =>
  addBox(archGroup, 0.5, 0.4, 9, x, 0.3, 14, matMarble),
);
[-4.3, 18.3].forEach((z) =>
  addBox(archGroup, 23, 0.4, 0.5, 0, 0.3, z, matMarble),
);

// ── MAIN VILLA BODY ──
// Lower plinth / podium
addBox(archGroup, 40, 1.5, 28, 0, 0.75, 0, matStone);

// Main ground floor slab
addBox(archGroup, 36, 5, 24, 0, 3.5, 0, matConcrete);

// Ground floor — large glass facade (front)
addBox(archGroup, 32, 4.2, 0.2, 0, 3.5, 12.1, matGlass);

// First floor main body
addBox(archGroup, 36, 5, 24, 0, 9, 0, matConcrete);

// First floor — glass facade strip
addBox(archGroup, 30, 3.5, 0.2, 0, 9, 12.1, matGlassDark);

// Second floor — recessed, narrower
addBox(archGroup, 28, 4.5, 20, 0, 14.25, -2, matConcrete);
addBox(archGroup, 24, 3.5, 0.2, 0, 14.5, 8.1, matGlass);

// Flat roof slab
addBox(archGroup, 32, 0.6, 24, 0, 16.8, 0, matDark);
addBox(archGroup, 26, 0.5, 20.5, 0, 17.2, -1, matConcrete);

// ── CANTILEVERED OVERHANG (signature feature) ──
addBox(archGroup, 40, 0.8, 8, 0, 6.4, 16, matDark);

// Overhang support columns (thin steel-like)
for (let x = -15; x <= 15; x += 10) {
  addBox(archGroup, 0.4, 5.6, 0.4, x, 3.3, 12.5, matAccent);
}

// ── HORIZONTAL LOUVER FINS ──
for (let y = 1.5; y <= 5.5; y += 1.0) {
  addBox(archGroup, 34, 0.15, 1.2, 0, y, 12.6, matDark);
}
for (let y = 7; y <= 11; y += 0.9) {
  addBox(archGroup, 28, 0.12, 0.9, 0, y, 12.4, matDark);
}

// ── SIDE WING (left) ──
addBox(archGroup, 10, 8, 18, -23, 4, -3, matConcrete);
addBox(archGroup, 0.2, 6, 14, -18.1, 4, -3, matGlass);
addBox(archGroup, 10, 0.5, 18, -23, 8.25, -3, matDark);

// ── SIDE WING (right) — garage / utility ──
addBox(archGroup, 8, 5, 14, 22, 2.5, -2, matStone);
addBox(archGroup, 8, 0.5, 14, 22, 5.25, -2, matDark);
// Garage door
addBox(archGroup, 6, 3.5, 0.2, 22, 2, 5.1, matGlassDark);

// ── VERTICAL ACCENT FINS (left side) ──
for (let z = -8; z <= 8; z += 4) {
  addBox(archGroup, 0.25, 16, 0.6, -18.1, 8, z, matAccent);
}

// ── GOLD ACCENT BAND (horizontal, front face) ──
addBox(archGroup, 36, 0.25, 0.4, 0, 6.5, 12.3, matAccent);
addBox(archGroup, 36, 0.25, 0.4, 0, 11.5, 12.3, matAccent);

// ── ROOF TERRACE ELEMENTS ──
// Parapet wall
addBox(archGroup, 32, 1.2, 0.3, 0, 17.8, 12, matConcrete);
addBox(archGroup, 0.3, 1.2, 24, 16, 17.8, 0, matConcrete);
addBox(archGroup, 0.3, 1.2, 24, -16, 17.8, 0, matConcrete);

// Roof pool (small)
addBox(archGroup, 10, 0.3, 4, 5, 17.2, 2, poolMat);

// Pergola / shade structure
for (let x = -4; x <= 4; x += 4) {
  addBox(archGroup, 0.2, 3, 0.2, x, 19, -6, matDark);
}
addBox(archGroup, 10, 0.15, 6, 0, 20.5, -6, matDark);

// ── INTERIOR LIGHT SLITS (emissive glow through windows) ──
const slitPositions = [
  [-10, 3, 12.05],
  [-4, 3, 12.05],
  [4, 3, 12.05],
  [10, 3, 12.05],
  [-8, 9, 12.05],
  [0, 9, 12.05],
  [8, 9, 12.05],
];
slitPositions.forEach(([x, y, z]) => {
  addBox(archGroup, 3.5, 2.8, 0.05, x, y, z, matLightBox, false, false);
});

// ── LANDSCAPING ELEMENTS ──
// Thin concrete planters
[
  [-16, 0],
  [-10, 0],
  [10, 0],
  [16, 0],
].forEach(([x, z]) => {
  addBox(archGroup, 1.5, 4, 1.5, x, 2, 14.5 + z * 0.3, matStone);
});

// Stone path / stepping stones
for (let z = 16; z <= 28; z += 3) {
  addBox(archGroup, 3, 0.12, 1.5, 0, 0.1, z, matMarble, false, false);
}

// Boundary walls
addBox(archGroup, 0.4, 2.5, 50, -26, 1.25, -5, matStone);
addBox(archGroup, 0.4, 2.5, 50, 26, 1.25, -5, matStone);
addBox(archGroup, 52, 2.5, 0.4, 0, 1.25, 30, matStone);

// Gate posts
addBox(archGroup, 1, 4, 1, -5, 2, 30, matAccent);
addBox(archGroup, 1, 4, 1, 5, 2, 30, matAccent);

// ── DISTANT CITY SILHOUETTE (background atmosphere) ──
const cityPositions = [
  [-60, 20, -80],
  [-45, 14, -85],
  [-30, 30, -90],
  [-15, 18, -88],
  [0, 35, -95],
  [15, 22, -87],
  [30, 26, -85],
  [45, 16, -82],
  [60, 28, -80],
  [-70, 10, -70],
  [70, 12, -70],
  [-80, 8, -60],
  [80, 9, -60],
  [-50, 40, -100],
  [50, 32, -100],
];
const cityMat = new THREE.MeshStandardMaterial({
  color: 0x151618,
  roughness: 1,
  metalness: 0,
});
cityPositions.forEach(([x, h, z]) => {
  const w = 6 + Math.random() * 8;
  const d = 5 + Math.random() * 7;
  addBox(scene, w, h, d, x, h / 2, z, cityMat, false, false);
  // Tiny window lights on buildings
  if (Math.random() > 0.4) {
    const wLight = new THREE.PointLight(0xffd98f, 0.2, 12);
    wLight.position.set(x, h * 0.6, z);
    scene.add(wLight);
  }
});

// ── STARS / FAR PARTICLES ──
const starsGeo = new THREE.BufferGeometry();
const starCount = 300;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 600;
  starPos[i * 3 + 1] = Math.random() * 150 + 20;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 600;
}
starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starsMat = new THREE.PointsMaterial({
  color: 0xfff5e0,
  size: 0.18,
  sizeAttenuation: true,
});
scene.add(new THREE.Points(starsGeo, starsMat));

// ─────────────────────────────────────────────
// 4. CAMERA WAYPOINTS
// ─────────────────────────────────────────────
const waypoints = [
  // Section 1 — Dramatic wide / approaching
  { pos: { x: 0, y: 18, z: 80 }, look: { x: 0, y: 6, z: 0 }, rot: 0 },
  // Section 2 — Mid angle, slight orbit left
  { pos: { x: -28, y: 14, z: 48 }, look: { x: 0, y: 8, z: 0 }, rot: 0.12 },
  // Section 3 — Close, focused on facade detail
  { pos: { x: 12, y: 10, z: 28 }, look: { x: 0, y: 10, z: 0 }, rot: 0.3 },
  // Section 4 — High angle, reveal full estate
  { pos: { x: 30, y: 36, z: 55 }, look: { x: 0, y: 4, z: 5 }, rot: 0.45 },
];

// ─────────────────────────────────────────────
// 5. GSAP SCROLL TIMELINE
// ─────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// We drive everything from a single ScrollTrigger on the scroll container
// and use a normalized progress value (0→1) to interpolate between waypoints.

// Helper: smooth step
function smoothStep(a, b, t) {
  const s = t * t * (3 - 2 * t);
  return a + (b - a) * s;
}

// Interpolate waypoints based on overall scroll progress (0→1 across 4 sections)
function updateCamera(progress) {
  // Map progress to segment index + local t
  const segCount = waypoints.length - 1; // 3
  const raw = progress * segCount;
  const idx = Math.min(Math.floor(raw), segCount - 1);
  const t = raw - idx;

  const wp0 = waypoints[idx];
  const wp1 = waypoints[Math.min(idx + 1, segCount)];

  // Target positions
  camState.x = smoothStep(wp0.pos.x, wp1.pos.x, t);
  camState.y = smoothStep(wp0.pos.y, wp1.pos.y, t);
  camState.z = smoothStep(wp0.pos.z, wp1.pos.z, t);
  camState.lx = smoothStep(wp0.look.x, wp1.look.x, t);
  camState.ly = smoothStep(wp0.look.y, wp1.look.y, t);
  camState.lz = smoothStep(wp0.look.z, wp1.look.z, t);

  // Model Y rotation
  const targetRot = smoothStep(wp0.rot, wp1.rot, t);
  archGroup.rotation.y = targetRot;

  // Update progress bar
  const bar = document.getElementById("progress-bar");
  bar.style.width = progress * 100 + "%";
}

// Scroll trigger — reads entire scroll height
ScrollTrigger.create({
  trigger: "#scroll-container",
  start: "top top",
  end: "bottom bottom",
  scrub: 1.5, // smooth lag (seconds)
  onUpdate: (self) => {
    updateCamera(self.progress);

    // Section opacity switching
    const p = self.progress;
    const sections = ["s1", "s2", "s3", "s4"];
    const ranges = [
      [0, 0.25],
      [0.25, 0.5],
      [0.5, 0.75],
      [0.75, 1.0],
    ];

    sections.forEach((id, i) => {
      const el = document.getElementById(id);
      const [s, e] = ranges[i];
      let localP = (p - s) / (e - s);
      localP = Math.max(0, Math.min(1, localP));

      // Fade in then out (peak in middle of range)
      let alpha;
      if (localP < 0.3) alpha = localP / 0.3;
      else if (localP > 0.7) alpha = (1 - localP) / 0.3;
      else alpha = 1;

      el.style.opacity = alpha;
      el.style.pointerEvents = alpha > 0.3 ? "auto" : "none";
    });

    // Scroll hint fades out after slight scroll
    const hint = document.getElementById("scroll-hint");
    hint.style.opacity = Math.max(0, 1 - p * 18);
  },
});

// ─────────────────────────────────────────────
// 6. ENTRY ANIMATION (GSAP timeline)
// ─────────────────────────────────────────────
function runEntryAnimation() {
  const tl = gsap.timeline({ delay: 0.3 });

  // Phase 1 — fade overlay from black
  tl.to("#entry-overlay", { opacity: 0, duration: 2, ease: "power2.inOut" }, 0)

    // Phase 2 — cinematic bars retract
    .to("#bar-top", { y: "-100%", duration: 1.6, ease: "power3.inOut" }, 0.8)
    .to("#bar-bottom", { y: "100%", duration: 1.6, ease: "power3.inOut" }, 0.8)

    // Phase 3 — nav fades in
    .to("#main-nav", { opacity: 1, duration: 1, ease: "power2.out" }, 1.6)

    // Phase 4 — corner decorations
    .to(
      [".corner"],
      { opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out" },
      1.8,
    )

    // Phase 5 — progress bar
    .to("#progress-bar", { opacity: 1, duration: 0.5 }, 2.0)

    // Phase 6 — hero text reveal (staggered up)
    .to("#s1", { opacity: 1, duration: 0.1 }, 2.0)
    .to(
      "#eyebrow",
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
      2.1,
    )
    .to(
      "#hero-h1",
      { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" },
      2.3,
    )
    .to(
      "#hero-sub",
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
      2.7,
    )
    .to(
      "#hero-cta",
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
      2.9,
    )

    // Phase 7 — scroll hint
    .to("#scroll-hint", { opacity: 1, duration: 0.8, ease: "power2.out" }, 3.3);

  // Camera dramatic zoom in during entry
  // (camera starts further back and slowly approaches)

  // Separate camera animation (not scroll-driven — entry only)
  gsap.fromTo(
    camState,
    { z: 140, y: 28 },
    { z: 80, y: 18, duration: 3.5, ease: "power2.inOut", delay: 0.5 },
  );
}

// ─────────────────────────────────────────────
// 7. MOUSE PARALLAX
// ─────────────────────────────────────────────
const mouse = { x: 0, y: 0 };
document.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ─────────────────────────────────────────────
// 8. CUSTOM CURSOR
// ─────────────────────────────────────────────
const cursorEl = document.getElementById("cursor");
document.addEventListener("mousemove", (e) => {
  gsap.to(cursorEl, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.15,
    ease: "power2.out",
  });
});
document
  .querySelectorAll("button, a, .btn-primary, .btn-secondary")
  .forEach((el) => {
    el.addEventListener("mouseenter", () => cursorEl.classList.add("hovering"));
    el.addEventListener("mouseleave", () =>
      cursorEl.classList.remove("hovering"),
    );
  });

// ─────────────────────────────────────────────
// 9. RENDER LOOP
// ─────────────────────────────────────────────
const LERP_FACTOR = 0.045; // smoothness (lower = smoother / laggier)

// Actual camera position (lerped toward camState)
const camCurrent = {
  x: 0,
  y: 18,
  z: 80,
  lx: 0,
  ly: 6,
  lz: 0,
};

let time = 0;
const clock = new THREE.Clock();

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  time += delta;

  // Mouse parallax offsets (scaled)
  const parallaxX = mouse.x * 2.5;
  const parallaxY = mouse.y * 1.2;

  // Target with parallax applied
  const targetX = camState.x + parallaxX;
  const targetY = camState.y - parallaxY;
  const targetZ = camState.z;

  // Lerp camera toward target
  camCurrent.x = lerp(camCurrent.x, targetX, LERP_FACTOR);
  camCurrent.y = lerp(camCurrent.y, targetY, LERP_FACTOR);
  camCurrent.z = lerp(camCurrent.z, targetZ, LERP_FACTOR);
  camCurrent.lx = lerp(camCurrent.lx, camState.lx, LERP_FACTOR);
  camCurrent.ly = lerp(camCurrent.ly, camState.ly, LERP_FACTOR);
  camCurrent.lz = lerp(camCurrent.lz, camState.lz, LERP_FACTOR);

  camera.position.set(camCurrent.x, camCurrent.y, camCurrent.z);
  camera.lookAt(camCurrent.lx, camCurrent.ly, camCurrent.lz);

  // Animate interior lights (breathing glow)
  scene.children.forEach((child) => {
    if (child.isPointLight && child.intensity < 1.0) {
      child.intensity = 0.15 + Math.sin(time * 1.5 + child.position.x) * 0.05;
    }
  });

  // Subtle ambient animation of the arch model
  archGroup.position.y = Math.sin(time * 0.3) * 0.04;

  renderer.render(scene, camera);
}

// ─────────────────────────────────────────────
// 10. RESIZE HANDLER
// ─────────────────────────────────────────────
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1 / 2 * Math.min(window.devicePixelRatio, 2));
});

// ─────────────────────────────────────────────
// 11. INIT
// ─────────────────────────────────────────────

// Initialize camera start position
camera.position.set(0, 28, 140);
camCurrent.z = 140;
camCurrent.y = 28;

// Start rendering
animate();

// Run entry animation after DOM ready
window.addEventListener("load", () => {
  runEntryAnimation();
  ScrollTrigger.refresh();
});

// this is used for header
// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      // Toggle classes for both the icon and the list
      menuToggle.classList.toggle("active");
      navLinks.classList.toggle("active");
    });

    // Close menu when a link is clicked (useful for one-page sites)
    const links = navLinks.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });
  }
});

// Register ScrollToPlugin
gsap.registerPlugin(ScrollToPlugin);

// Navigation Link Smooth Scroll
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault(); // Stop instant jump

    const targetId = e.target.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    // Since your sections are fixed, we calculate their
    // position based on the total height of the scroll-container
    // Section 1 is at 0, Section 2 is at 100vh, etc.
    let targetScroll;
    if (targetId === "#s1") targetScroll = 0;
    if (targetId === "#s2") targetScroll = window.innerHeight * 1.5; // Adjusted for timing
    if (targetId === "#s3") targetScroll = window.innerHeight * 3.0;
    if (targetId === "#s4") targetScroll = window.innerHeight * 4.5;

    gsap.to(window, {
      duration: 2,
      scrollTo: targetScroll,
      ease: "power4.inOut",
    });

    // Close mobile menu if open
    document.getElementById("nav-links").classList.remove("active");
    document.getElementById("menu-toggle").classList.remove("active");
  });
});

// emailjs code present here
// INIT EMAILJS
(function () {
  emailjs.init("YOUR_PUBLIC_KEY"); // 🔥 replace
})();

function sendMail() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const message = document.getElementById("message").value.trim();

  const status = document.getElementById("form-status");

  // VALIDATION
  if (!name || !email || !phone) {
    status.innerText = "Please fill all required fields.";
    status.style.color = "red";
    return;
  }

  status.innerText = "Sending...";
  status.style.color = "#aaa";

  // SEND MAIL
  emailjs
    .send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
      from_name: name,
      from_email: email,
      phone: phone,
      message: message,
    })
    .then(function () {
      status.innerText = "✅ Message sent successfully!";
      status.style.color = "lightgreen";

      // RESET FORM
      document.getElementById("name").value = "";
      document.getElementById("email").value = "";
      document.getElementById("phone").value = "";
      document.getElementById("message").value = "";
    })
    .catch(function () {
      status.innerText = "❌ Failed to send. Try again.";
      status.style.color = "red";
    });
}
