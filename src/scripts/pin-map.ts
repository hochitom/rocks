/**
 * The flat map on the map and continent pages (Leaflet): Natural Earth's countries and the US states
 * drawn in the site's colours, no tiles and no outside service. The cafes are brass dots (a ring for a
 * missing pin), a card shows the pins of the chosen cafe, and Older/Newer step from cafe to cafe.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { Feature, Geometry } from 'geojson';
import { palette } from '../lib/palette';
import { count } from '../lib/text';

/** What a map page hands to the script (as JSON in `.map-data`). */
export interface MapData {
  /** URL of the country shapes (TopoJSON, object `countries`). */
  countries: string;
  /** URL of the US state borders (TopoJSON, object `states`). */
  states: string;
  /** Ids of the countries I have been to, shaded a step lighter. */
  visited: string[];
  cafes: MapCafe[];
  /** Ids of the cafes with pins, newest pin first: the order Older/Newer step through. */
  order: string[];
  /** The whole world, or just enough to show every marker. */
  view: 'world' | 'fit';
}

export interface MapCafe {
  id: string;
  /** A Hard Rock Cafe, the place of side finds, or a cafe I left without a pin (each marked differently). */
  kind: 'hard-rock' | 'side-find' | 'missing';
  /** The city of a cafe, the title of a side find. */
  name: string;
  /** Cafe name (if any) and country; for a side find also its city. */
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

/** The shades of the map, a step apart: sea, land, land I have been to, borders. */
const SHADE = { land: palette.felt, visitedLand: '#4a2f33', border: '#5a3f42' };
/** Antarctica only takes up room at the bottom of the world. */
const ANTARCTICA = '010';
const WORLD: L.LatLngBoundsExpression = [
  [-48, -165],
  [74, 178],
];
/** Thumbnails either side of the chosen cafe in the card. */
const STRIP = 3;

export interface PinMap {
  /** Marks a cafe's marker (e.g. while its pin is pointed at in a list), or none. */
  highlight(id: string | null): void;
}

export function startPinMap(view: HTMLElement): PinMap {
  const data: MapData = JSON.parse(view.querySelector('.map-data')!.textContent!);
  const canvas = view.querySelector<HTMLElement>('.map-canvas')!;
  const card = view.querySelector<HTMLElement>('.map-card')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cafesById = new Map(data.cafes.map((cafe) => [cafe.id, cafe]));

  const map = L.map(canvas, {
    zoomSnap: 0.25,
    minZoom: 1,
    maxZoom: 8,
    worldCopyJump: true,
    // Scrolling the page must not get caught in the map: zoom with the buttons, a pinch or a double click.
    scrollWheelZoom: false,
    attributionControl: false,
  });
  L.control
    .attribution({ prefix: '<a href="https://leafletjs.com">Leaflet</a>' })
    .addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>')
    .addTo(map);
  const fitAll = () => {
    if (data.view === 'world' || !data.cafes.length) map.fitBounds(WORLD);
    else map.fitBounds(L.latLngBounds(data.cafes.map((cafe) => [cafe.lat, cafe.lng])), { padding: [48, 48], maxZoom: 6 });
  };
  fitAll();

  // Countries first, then the state borders over them, then the markers on top.
  const visited = new Set(data.visited);
  map.createPane('shapes').style.zIndex = '200';
  fetch(data.countries)
    .then((response) => response.json() as Promise<Topology<{ countries: GeometryCollection }>>)
    .then((topology) => {
      const shapes = (feature(topology, topology.objects.countries).features as Feature<Geometry>[]).filter(
        (shape) => String(shape.id) !== ANTARCTICA,
      );
      L.geoJSON(shapes, {
        pane: 'shapes',
        interactive: false,
        style: (shape) => ({
          fillColor: visited.has(String(shape?.id)) ? SHADE.visitedLand : SHADE.land,
          fillOpacity: 1,
          color: SHADE.border,
          weight: 0.7,
        }),
      }).addTo(map);
      return fetch(data.states);
    })
    .then((response) => response.json() as Promise<Topology<{ states: GeometryCollection }>>)
    .then((topology) => {
      L.geoJSON(mesh(topology, topology.objects.states, (a, b) => a !== b), {
        pane: 'shapes',
        interactive: false,
        style: { color: SHADE.border, weight: 0.6, dashArray: '2 3' },
      }).addTo(map);
    })
    .catch((error) => console.error('Could not load the countries of the map.', error));

  const markers = new Map(
    data.cafes.map((cafe) => {
      const pins = cafe.pins.length;
      const marker = L.marker([cafe.lat, cafe.lng], {
        keyboard: true,
        riseOnHover: true,
        icon: L.divIcon({
          className: `map-marker ${cafe.kind}`,
          html: pins > 1 ? `<span class="count" aria-hidden="true">${pins}</span>` : '',
          iconSize: [22, 22],
        }),
      }).addTo(map);
      const label = `${cafe.name}, ${cafe.kind === 'missing' ? missingStatus(cafe) : count(pins, 'pin', 'pins')}`;
      const el = marker.getElement()!;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', label);
      el.setAttribute('aria-controls', card.id);
      el.setAttribute('aria-expanded', 'false');
      marker.on('click', () => show(cafe));
      // Leaflet makes markers focusable but doesn't press them: Enter and Space do, as on a button.
      el.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        show(cafe);
        card.querySelector<HTMLElement>('a, button:not(.card-close)')?.focus();
      });
      return [cafe.id, marker] as const;
    }),
  );

  let chosen: MapCafe | undefined;
  function show(cafe: MapCafe, { move = true } = {}) {
    if (chosen) markers.get(chosen.id)?.getElement()?.setAttribute('aria-expanded', 'false');
    chosen = cafe;
    const marker = markers.get(cafe.id)!;
    marker.getElement()?.setAttribute('aria-expanded', 'true');
    for (const [id, other] of markers) other.getElement()?.classList.toggle('is-chosen', id === cafe.id);
    card.replaceChildren(...cardOf(cafe));
    card.hidden = false;
    if (move) {
      const target = L.latLng(cafe.lat, cafe.lng);
      if (!map.getBounds().pad(-0.15).contains(target)) map.panTo(target, { animate: !reducedMotion.matches });
    }
    const pin = cafe.pins.at(-1);
    history.replaceState(null, '', pin ? `?pin=${encodeURIComponent(pin.slug)}` : location.pathname);
  }

  function close() {
    const returnFocus = card.contains(document.activeElement);
    card.hidden = true;
    if (!chosen) return;
    const el = markers.get(chosen.id)?.getElement();
    el?.setAttribute('aria-expanded', 'false');
    el?.classList.remove('is-chosen');
    if (returnFocus) el?.focus();
    chosen = undefined;
    history.replaceState(null, '', location.pathname);
  }
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  /** The card's content: the cafe, its pins (or why there is none), and the steps to the next cafes. */
  function cardOf(cafe: MapCafe): HTMLElement[] {
    const header = el('header');
    const title = el('p', 'card-title');
    title.append(el('strong', '', cafe.name), el('span', '', cafe.place));
    const closeButton = el('button', 'card-close', '×');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', close);
    header.append(title, closeButton);
    if (cafe.kind === 'missing') {
      const visit = el('p', 'card-missing', `Visited ${cafe.visited}, ${missingStatus(cafe)}. `);
      const link = el('a', '', 'Unfinished business →');
      link.href = '/#unfinished-business';
      visit.append(link);
      return [header, visit];
    }
    const list = el('ul', 'card-pins');
    for (const pin of cafe.pins) {
      const link = el('a');
      link.href = `/pins/${pin.slug}/`;
      const photo = el('img');
      photo.src = pin.image;
      photo.alt = '';
      link.append(photo, el('span', '', pin.date));
      link.setAttribute('aria-label', `${pin.name}, ${pin.date}`);
      list.append(el('li'));
      list.lastElementChild!.append(link);
    }
    return [header, list, stepsOf(cafe)];
  }

  /** Neighbouring cafes as thumbnails, then Older / position / Newer. */
  function stepsOf(cafe: MapCafe): HTMLElement {
    const nav = el('nav', 'steps');
    nav.setAttribute('aria-label', 'Travel between cafes');
    const index = data.order.indexOf(cafe.id);
    const from = Math.max(0, Math.min(data.order.length - (2 * STRIP + 1), index - STRIP));
    const strip = el('ol', 'step-strip');
    for (const id of data.order.slice(from, from + 2 * STRIP + 1)) {
      const other = cafesById.get(id)!;
      const button = el('button');
      button.type = 'button';
      button.setAttribute('aria-label', `${other.name}, ${other.pins.at(-1)!.date}`);
      if (id === cafe.id) button.setAttribute('aria-current', 'true');
      const photo = el('img');
      photo.src = other.pins.at(-1)!.image;
      photo.alt = '';
      button.append(photo);
      button.addEventListener('click', () => go(id));
      strip.append(el('li'));
      strip.lastElementChild!.append(button);
    }
    const buttons = el('div', 'step-buttons');
    const older = stepButton('Older', index + 1);
    const newer = stepButton('Newer', index - 1);
    buttons.append(older, el('span', 'step-count', `${index + 1} / ${data.order.length}`), newer);
    nav.append(strip, buttons);
    return nav;
  }
  function stepButton(label: 'Older' | 'Newer', target: number) {
    const button = el('button', `step ${label.toLowerCase()}`, label);
    button.type = 'button';
    button.disabled = target < 0 || target >= data.order.length;
    button.addEventListener('click', () => go(data.order[target]));
    return button;
  }
  /** Steps to another cafe, keeping the keyboard focus on the same control in the new card. */
  function go(id: string) {
    const focused = card.contains(document.activeElement) ? (document.activeElement as HTMLElement) : null;
    const which = focused?.classList.contains('older') ? '.older' : focused?.classList.contains('newer') ? '.newer' : null;
    show(cafesById.get(id)!);
    if (focused) {
      const again = (which && card.querySelector<HTMLButtonElement>(`${which}:not(:disabled)`)) || card.querySelector<HTMLElement>('[aria-current="true"]');
      again?.focus();
    }
  }

  const focus = data.cafes.find((cafe) => cafe.pins.some((pin) => pin.slug === new URLSearchParams(location.search).get('pin')));
  if (focus) {
    map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 4));
    show(focus, { move: false });
  }

  new ResizeObserver(() => map.invalidateSize()).observe(canvas);

  return {
    highlight(id) {
      for (const [other, marker] of markers) marker.getElement()?.classList.toggle('is-pointed', other === id);
    },
  };
}

/** Why a missing pin is still missing: "no pin yet", or "closed for good" if it will stay that way. */
const missingStatus = (cafe: MapCafe) => (cafe.closed ? 'closed for good' : 'no pin yet');

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}
