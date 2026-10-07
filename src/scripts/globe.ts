/**
 * The globe in the home page's hero: dotted brass continents on a velvet sphere, the cafes as photo
 * markers (HTML buttons over the canvas) and dashed arcs tracing the order of visits. The hero steps
 * from pin to pin and turns the globe to each one's cafe. Loaded lazily, only where WebGL is available.
 * Values: spec "Globus", docs/design.md.
 */
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Points,
  QuadraticBezierCurve3,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { palette } from '../lib/palette';
import { count } from '../lib/text';

/** What the home page hands to the globe (as JSON in `#globe-data`). */
export interface GlobeData {
  /** URL of the land dots precomputed at build time: `[lat, lng, lat, lng, …]`. */
  land: string;
  cafes: GlobeCafe[];
  /** Cafe ids in the order they were visited. */
  route: string[];
}

export interface GlobeCafe {
  id: string;
  /** A Hard Rock Cafe, the place of side finds, or a cafe I left without a pin (each marked differently). */
  kind: 'hard-rock' | 'side-find' | 'missing';
  /** The city of a cafe, the title of a side find. */
  name: string;
  /** Cafe name (if any) and country, e.g. "Universal CityWalk, United States"; for a side find also its city. */
  place: string;
  lat: number;
  lng: number;
  /** Oldest first; none for a missing pin. */
  pins: { slug: string; name: string; date: string; image: string }[];
  /** A missing pin's first visit, e.g. "May 2024". */
  visited?: string;
  /** A missing pin's cafe has closed for good. */
  closed?: boolean;
}

/** Camera distance from the centre (globe radius 1) with a cafe in focus, and the zoom limits. */
const DISTANCE = { focus: 4.4, min: 2.8, max: 6 };
/** Markers further round than this (cosine to the camera) are on the back and hidden. */
const BACK = 0.12;

/** Point on the unit sphere (times `r`) for a latitude and longitude. */
function toVec(lat: number, lng: number, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export interface GlobeControl {
  /** Turns the globe to a cafe and marks it as the current one. */
  turnTo(id: string): void;
}

/**
 * Starts the globe in `view`, turned to the cafe `start`. Choosing a marker calls `onChoose` with
 * its cafe; the page decides what that means (in the hero: show that cafe's newest pin).
 */
export function startGlobe(view: HTMLElement, start: string, onChoose: (cafe: GlobeCafe) => void): GlobeControl {
  const data: GlobeData = JSON.parse(view.querySelector('#globe-data')!.textContent!);
  const stage = view.querySelector<HTMLElement>('.globe-stage')!;
  const markersEl = view.querySelector<HTMLElement>('.globe-markers')!;
  const cafesById = new Map(data.cafes.map((cafe) => [cafe.id, cafe]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Throws without WebGL; the hero then goes on without the globe.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute(
    'aria-label',
    `Globe with ${count(data.cafes.filter((cafe) => cafe.kind === 'hard-rock').length, 'Hard Rock Cafe', 'Hard Rock Cafes')} marked`,
  );
  stage.prepend(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  const first = cafesById.get(start)!;
  camera.position.copy(toVec(first.lat, first.lng, DISTANCE.focus));

  // The controls only turn the globe on their own: no dragging, no zooming, so the page scrolls freely
  // over it (with the mouse wheel and on touch). Looking around is what the map is for.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.disconnect();
  Object.assign(controls, {
    enablePan: false,
    enableDamping: true,
    dampingFactor: 0.08,
    autoRotateSpeed: 0.35,
  });

  // Slow turn of its own, which holds while the pointer is over the globe (so a marker doesn't slide
  // away from under a click), once the visitor travels from pin to pin, and always with reduced motion.
  let hovering = false;
  let travelling = false;
  const updateAutoRotate = () => {
    controls.autoRotate = !(reducedMotion.matches || hovering || travelling);
  };
  stage.addEventListener('pointerenter', (event) => {
    hovering = event.pointerType === 'mouse';
    updateAutoRotate();
  });
  stage.addEventListener('pointerleave', () => {
    hovering = false;
    updateAutoRotate();
  });
  reducedMotion.addEventListener('change', updateAutoRotate);

  // Velvet sphere with a brass rim light (fresnel).
  scene.add(
    new Mesh(
      new SphereGeometry(1, 96, 64),
      new ShaderMaterial({
        uniforms: { body: { value: new Color(palette.globeVelvet) }, rim: { value: new Color(palette.brass) } },
        vertexShader: `varying vec3 vN; varying vec3 vV;
          void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 body; uniform vec3 rim; varying vec3 vN; varying vec3 vV;
          void main() { float f = pow(1. - max(dot(vN, vV), 0.), 3.); gl_FragColor = vec4(mix(body, rim, f * .55), 1.); }`,
      }),
    ),
  );

  // Graticule every 20°, barely visible.
  const graticule: number[] = [];
  for (let lat = -80; lat <= 80; lat += 20)
    for (let lng = -180; lng < 180; lng += 3)
      graticule.push(...toVec(lat, lng, 1.001).toArray(), ...toVec(lat, lng + 3, 1.001).toArray());
  for (let lng = -180; lng < 180; lng += 20)
    for (let lat = -88; lat < 88; lat += 3)
      graticule.push(...toVec(lat, lng, 1.001).toArray(), ...toVec(lat + 3, lng, 1.001).toArray());
  scene.add(
    new LineSegments(
      new BufferGeometry().setAttribute('position', new Float32BufferAttribute(graticule, 3)),
      new LineBasicMaterial({ color: palette.brass, transparent: true, opacity: 0.07 }),
    ),
  );

  // Land dots (precomputed at build time): round brass points, smaller and fainter towards the rim.
  fetch(data.land)
    .then((response) => response.json() as Promise<number[]>)
    .then((land) => {
      const positions: number[] = [];
      for (let i = 0; i < land.length; i += 2) positions.push(...toVec(land[i], land[i + 1], 1.002).toArray());
      scene.add(
        new Points(
          new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3)),
          new ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: { color: { value: new Color(palette.brass) }, size: { value: 2.6 * renderer.getPixelRatio() } },
            vertexShader: `uniform float size; varying float vF;
              void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vF = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
                gl_PointSize = size * (.55 + .45 * vF) * (4.2 / -mv.z); gl_Position = projectionMatrix * mv; }`,
            fragmentShader: `uniform vec3 color; varying float vF;
              void main() { vec2 c = gl_PointCoord - .5; if (dot(c, c) > .25) discard; gl_FragColor = vec4(color, smoothstep(.0, .55, vF) * .9); }`,
          }),
        ),
      );
    })
    .catch((error) => console.error('Could not load the land dots.', error));

  // Tour line: dashed arcs between consecutive cafes; the dashes flow from old to new.
  const arcMaterial = new LineDashedMaterial({ color: palette.brassHighlight, dashSize: 0.03, gapSize: 0.025, transparent: true, opacity: 0.55 });
  const dashOffset = { value: 0 };
  // LineDashedMaterial has no offset of its own: inject one so the dashes can flow.
  arcMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.dashOffset = dashOffset;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float dashOffset;\nvoid main() {')
      .replace('vLineDistance = scale * lineDistance;', 'vLineDistance = scale * lineDistance - dashOffset;');
  };
  const route = data.route.map((id) => cafesById.get(id)!);
  for (let i = 1; i < route.length; i++) {
    const a = toVec(route[i - 1].lat, route[i - 1].lng);
    const b = toVec(route[i].lat, route[i].lng);
    const lift = 1 + a.distanceTo(b) * 0.28;
    const curve = new QuadraticBezierCurve3(a, a.clone().add(b).normalize().multiplyScalar(lift), b);
    const line = new Line(new BufferGeometry().setFromPoints(curve.getPoints(80)), arcMaterial);
    line.computeLineDistances();
    scene.add(line);
  }

  // Markers: real buttons (keyboard, screen readers), projected onto the canvas every frame.
  // A missing pin's ring is only a mark on the globe: the hero has no pin to show for it.
  const markers = data.cafes.map((cafe) => {
    const el = document.createElement(cafe.kind === 'missing' ? 'span' : 'button');
    el.className = `globe-marker ${cafe.kind}`;
    if (el instanceof HTMLButtonElement) {
      el.type = 'button';
      el.setAttribute('aria-label', `${cafe.name}, ${count(cafe.pins.length, 'pin', 'pins')}`);
    } else {
      el.setAttribute('aria-hidden', 'true');
    }
    // A missing pin has no photo: its marker is a hollow ring (see the map page's styles).
    if (cafe.kind !== 'missing') {
      const photo = document.createElement('img');
      photo.src = cafe.pins.at(-1)!.image;
      photo.alt = '';
      el.append(photo);
    }
    if (cafe.pins.length > 1) {
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = String(cafe.pins.length);
      count.setAttribute('aria-hidden', 'true');
      el.append(count);
    }
    if (cafe.kind !== 'missing') {
      el.addEventListener('click', () => onChoose(cafe));
      // A marker on the back can still be reached with the keyboard: the globe turns it to the front.
      el.addEventListener('focus', () => {
        if (el.matches(':focus-visible') && facing(marker) <= BACK) turnTo(cafe);
      });
    }
    markersEl.append(el);
    const marker = { el, cafe, position: toVec(cafe.lat, cafe.lng, 1.01) };
    return marker;
  });
  // Turning a cafe to the front comes only moderately closer, or the globe hits the top and bottom.
  let tween: { from: Vector3; to: Vector3; start: number } | null = null;
  function turnTo(cafe: GlobeCafe) {
    const to = toVec(cafe.lat, cafe.lng, Math.min(camera.position.length(), DISTANCE.focus * fit));
    if (reducedMotion.matches) camera.position.copy(to);
    else tween = { from: camera.position.clone(), to, start: performance.now() };
  }

  // The camera's field of view is vertical: on a portrait screen the globe moves further away to fit the width.
  let fit = 1;
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const next = 1 / Math.min(1, camera.aspect * 1.1);
    camera.position.multiplyScalar(next / fit);
    fit = next;
    controls.minDistance = DISTANCE.min * fit;
    controls.maxDistance = DISTANCE.max * fit;
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  updateAutoRotate();

  const projected = new Vector3();
  const towardsCamera = new Vector3();
  const facing = (marker: (typeof markers)[number]) =>
    marker.position.clone().normalize().dot(towardsCamera.copy(camera.position).normalize());

  renderer.setAnimationLoop((now) => {
    if (tween) {
      const k = Math.min(1, (now - tween.start) / 900);
      const eased = k * k * (3 - 2 * k);
      const length = tween.from.length() + (tween.to.length() - tween.from.length()) * eased;
      camera.position.copy(tween.from).lerp(tween.to, eased).setLength(length);
      if (k === 1) tween = null;
    }
    if (!reducedMotion.matches) dashOffset.value = now / 4000;
    controls.update();
    renderer.render(scene, camera);

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    for (const marker of markers) {
      const front = facing(marker);
      projected.copy(marker.position).project(camera);
      marker.el.style.transform = `translate(${((projected.x + 1) / 2) * width}px, ${((1 - projected.y) / 2) * height}px)`;
      // On the back: invisible and not clickable, but still in the tab order (focus turns it round).
      marker.el.style.opacity = String(Math.max(0, Math.min(1, (front - BACK) * 5)));
      marker.el.style.pointerEvents = front > BACK ? '' : 'none';
    }
  });

  const mark = (id: string) => {
    for (const marker of markers) marker.el.classList.toggle('is-current', marker.cafe.id === id);
  };
  mark(start);
  return {
    turnTo(id) {
      const cafe = cafesById.get(id)!;
      travelling = true;
      updateAutoRotate();
      mark(id);
      turnTo(cafe);
    },
  };
}
