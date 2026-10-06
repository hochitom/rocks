/**
 * The 3D pin, built in the browser from the pin's outline, texture, relief map and rim metal.
 * Look and parameters come from the prototype (branch `prototype/3d-pins`, variant B) — see the
 * 3D-Viewer section of the spec. Loaded on demand by `element.ts`, so Three.js never delays the page.
 */
import {
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  Path,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { RimMetal } from '../../lib/rim-metal';

export type Motion = 'turn' | 'sway';

export interface PinFiles {
  outline: string;
  texture: string;
  normal: string;
  rim: RimMetal;
}

/** The pin's outline: x, y ∈ [-0.5, 0.5] of the photo's square, origin in the middle, y up. */
type Outline = Array<{ outer: [number, number][]; holes: [number, number][][] }>;

interface Options {
  motion: Motion;
  /** Label of the canvas for assistive technology. */
  label: string;
  /** Called once the first frame is drawn, so the photo can make way. */
  onReady(): void;
}

// Body: a real pin is ≈ 45 mm wide and ≈ 1.5 mm thick; the unit is the width of the photo's square.
const DEPTH = 0.022;
const BEVEL_THICKNESS = 0.006;
const BEVEL_SIZE = 0.004;

const METALS = {
  gold: { color: 0xd9ab4a, metalness: 1, roughness: 0.28 },
  silver: { color: 0x9c9a92, metalness: 1, roughness: 0.4 },
} as const;

/** Vertical field of view of the camera, in degrees. */
const FOV = 30;
/** Share of the stage the photo's square takes up — as for the cut-out photo, so nothing jumps at the swap. */
const PHOTO_SHARE = 0.84;

/** After dragging, the pin rests this long before it moves by itself again. */
const RESUME_AFTER_MS = 2500;
/** Detail page: one cycle of frontal sway followed by a full turn. */
const TURN_CYCLE_S = 12;
/** The full turn at the end of each cycle; the rest of the cycle is the sway. */
const TURN_S = 3;
/** One back-and-forth of the sway. The sway time (cycle minus turn) holds a whole number of them, so it ends facing ahead. */
const SWAY_PERIOD_S = 3;

/** Builds the pin into `host` and keeps it moving. Rejects if the files can't be loaded. */
export async function showPin(host: HTMLElement, files: PinFiles, { motion, label, onReady }: Options) {
  const loader = new TextureLoader();
  const [outline, map, normalMap] = await Promise.all([
    fetch(files.outline).then((response) => {
      if (!response.ok) throw new Error(`${files.outline}: ${response.status}`);
      return response.json() as Promise<Outline>;
    }),
    loader.loadAsync(files.texture),
    loader.loadAsync(files.normal),
  ]);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.35;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${label}, 3D view: drag to turn it`);

  // Light: a room to reflect, a warm key light from the front and a reddish light from behind.
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xfff1dd, 1.6);
  key.position.set(1.5, 2, 3);
  const back = new DirectionalLight(0xff5533, 1.2);
  back.position.set(-2, -1, -1.5);
  scene.add(key, back);

  map.colorSpace = SRGBColorSpace;
  map.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const root = new Group();
  root.add(buildPin(outline, map, normalMap, files.rim));
  scene.add(root);

  const camera = new PerspectiveCamera(FOV, 1, 0.01, 50);
  function fit() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // The photo's square fills PHOTO_SHARE of the stage's shorter side.
    const visibleHeight = height / (PHOTO_SHARE * Math.min(width, height));
    camera.position.set(0, 0, visibleHeight / 2 / Math.tan(MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
    dirty = true;
  }

  // ---- Motion and dragging ----
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  /** Time the pin has spent moving by itself; stands still while it's dragged or resting. */
  let motionTime = 0;
  /** What the visitor added by dragging, on top of the pin's own motion. */
  const dragged = { yaw: 0, pitch: 0 };
  const spin = { yaw: 0, pitch: 0 };
  let pointer: { id: number; x: number; y: number; time: number } | undefined;
  let lastInteraction = -Infinity;
  let dirty = true;

  canvas.addEventListener('pointerdown', (event) => {
    if (pointer) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
    spin.yaw = spin.pitch = 0;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer?.id) return;
    // Dragging across the whole stage turns the pin half way round.
    const perPixel = Math.PI / canvas.clientWidth;
    const yaw = (event.clientX - pointer.x) * perPixel;
    const pitch = (event.clientY - pointer.y) * perPixel;
    dragged.yaw += yaw;
    dragged.pitch = MathUtils.clamp(dragged.pitch + pitch, -1.1, 1.1);
    const seconds = Math.max((event.timeStamp - pointer.time) / 1000, 1 / 120);
    spin.yaw = yaw / seconds;
    spin.pitch = pitch / seconds;
    Object.assign(pointer, { x: event.clientX, y: event.clientY, time: event.timeStamp });
    dirty = true;
  });
  const release = (event: PointerEvent) => {
    if (event.pointerId !== pointer?.id) return;
    // A drag that stopped before letting go doesn't fling the pin.
    if (event.timeStamp - pointer.time > 80 || event.type === 'pointercancel') spin.yaw = spin.pitch = 0;
    pointer = undefined;
    lastInteraction = performance.now();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  function step(dt: number) {
    if (pointer) {
      lastInteraction = performance.now();
      return;
    }
    // Let a flick run out, unless the visitor prefers no motion.
    if (!reducedMotion.matches && (Math.abs(spin.yaw) > 0.01 || Math.abs(spin.pitch) > 0.01)) {
      const fade = Math.exp(-dt * 4);
      dragged.yaw += spin.yaw * dt;
      dragged.pitch = MathUtils.clamp(dragged.pitch + spin.pitch * dt, -1.1, 1.1);
      spin.yaw *= fade;
      spin.pitch *= fade;
      dirty = true;
    }
    if (reducedMotion.matches || performance.now() - lastInteraction < RESUME_AFTER_MS) return;
    // Resting is over: the pin moves by itself again and slowly turns back to face the visitor.
    motionTime += dt;
    const back = Math.exp(-dt / 0.9);
    dragged.yaw = Math.atan2(Math.sin(dragged.yaw), Math.cos(dragged.yaw)) * back;
    dragged.pitch *= back;
    dirty = true;
  }

  function pose() {
    // At time 0 both motions face the visitor, so with "reduce motion" the pin just looks ahead.
    const own = ownMotion(motion, motionTime);
    root.rotation.set(own.pitch + dragged.pitch, own.yaw + dragged.yaw, 0);
  }

  // ---- Drawing: only while the case is on screen ----
  let lastFrame: number | undefined;
  let ready = false;
  function frame(time: number) {
    step(lastFrame === undefined ? 0 : Math.min((time - lastFrame) / 1000, 0.05));
    lastFrame = time;
    if (!dirty) return;
    dirty = false;
    pose();
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }
  }
  host.append(canvas);
  new ResizeObserver(fit).observe(host);
  fit();
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      renderer.setAnimationLoop(frame);
    } else {
      lastFrame = undefined;
      renderer.setAnimationLoop(null);
    }
  }).observe(host);
}

/** The pin's own motion at time `t` (seconds), as rotation in radians. */
function ownMotion(motion: Motion, t: number) {
  if (motion === 'sway') return { pitch: Math.sin(t * 0.45) * 0.1, yaw: Math.sin(t * 0.6) * 0.45 };
  // Mostly face the visitor with a gentle sway, then one gently accelerated full turn per cycle,
  // so the first impression is never an edge or the back.
  // Sway and turn both start and end facing ahead, so they join without a jump.
  const s = t % TURN_CYCLE_S;
  const swayS = TURN_CYCLE_S - TURN_S;
  if (s < swayS) return { pitch: 0, yaw: Math.sin((s / SWAY_PERIOD_S) * 2 * Math.PI) * 0.3 };
  const q = (s - swayS) / TURN_S;
  return { pitch: 0, yaw: q * q * (3 - 2 * q) * Math.PI * 2 };
}

/** The pin: metal body with bevelled edge, enamel front with photo and relief, post and clutch on the back. */
function buildPin(outline: Outline, map: Texture, normalMap: Texture, rim: PinFiles['rim']) {
  const shapes = outline.map(({ outer, holes }) => {
    const shape = new Shape(outer.map(([x, y]) => new Vector2(x, y)));
    for (const hole of holes) shape.holes.push(new Path(hole.map(([x, y]) => new Vector2(x, y))));
    return shape;
  });
  const metal = new MeshPhysicalMaterial(METALS[rim]);

  const body = new Mesh(
    new ExtrudeGeometry(shapes, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL_THICKNESS,
      bevelSize: BEVEL_SIZE,
      bevelSegments: 4,
      curveSegments: 1,
    }),
    metal,
  );

  // Front: the outline as its own face on top of the bevel, the photo mapped by position.
  const frontGeometry = new ShapeGeometry(shapes);
  const position = frontGeometry.attributes.position;
  const uv = frontGeometry.attributes.uv;
  for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) + 0.5, position.getY(i) + 0.5);
  const front = new Mesh(
    frontGeometry,
    // Enamel, no metal. A flat face mirrors the key light everywhere at once: keep the gloss low
    // or the photo washes out.
    new MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new Vector2(0.9, 0.9),
      roughness: 0.35,
      metalness: 0,
      envMapIntensity: 0.3,
      specularIntensity: 0.25,
      clearcoat: 0.35,
      clearcoatRoughness: 0.15,
    }),
  );
  front.position.z = DEPTH + BEVEL_THICKNESS + 0.0004;

  // Back: the post with a butterfly clutch, roughly in the middle.
  const post = new Mesh(new CylinderGeometry(0.007, 0.007, 0.11, 16), metal);
  post.rotation.x = Math.PI / 2;
  post.position.z = -BEVEL_THICKNESS - 0.055;
  const clutchMetal = new MeshPhysicalMaterial({ color: 0x8f8a80, metalness: 1, roughness: 0.35 });
  const clutch = new Group();
  for (const side of [-1, 1]) {
    const wing = new Mesh(new SphereGeometry(0.035, 24, 12), clutchMetal);
    wing.scale.set(1, 0.75, 0.3);
    wing.position.x = side * 0.03;
    clutch.add(wing);
  }
  clutch.position.z = -BEVEL_THICKNESS - 0.07;

  const pin = new Group();
  pin.add(body, front, post, clutch);
  // Turn around the middle of the body.
  pin.position.z = -DEPTH / 2;
  return pin;
}
