/**
 * Lets a `.tilt` element (see `src/styles/tilt.css`) lean towards the mouse and move its glint with
 * it. CSS alone gives a fixed tilt on hover; touch and "reduce motion" keep that.
 */
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function enableTilt(tilt: HTMLElement) {
  tilt.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || event.pointerType !== 'mouse') return;
    const box = tilt.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    tilt.style.setProperty('--ry', `${(x - 0.5) * 26}deg`);
    tilt.style.setProperty('--rx', `${(0.5 - y) * 22}deg`);
    tilt.style.setProperty('--glint', `${(1 - x) * 100}%`);
  });
  tilt.addEventListener('pointerleave', () => {
    for (const property of ['--rx', '--ry', '--glint']) tilt.style.removeProperty(property);
  });
}
