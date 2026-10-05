/**
 * `<pin-viewer>`: shows the cut-out photo with tilt and glint right away and swaps in the 3D pin
 * once Three.js and the pin's files are loaded. Without WebGL, or if anything fails, the photo stays.
 * See `PinViewer.astro`.
 */
import { enableTilt } from '../../scripts/tilt';
import type { Motion } from './scene';

/** Three.js needs WebGL 2. */
function hasWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

class PinViewer extends HTMLElement {
  connectedCallback() {
    const tilt = this.querySelector<HTMLElement>('.tilt');
    const photo = tilt?.querySelector('img');
    if (tilt && photo) {
      enableTilt(tilt);
      // The glint is masked to the photo the browser picked from the srcset, so nothing extra loads.
      const mask = () => tilt.style.setProperty('--cutout', `url("${photo.currentSrc || photo.src}")`);
      if (photo.complete && photo.naturalWidth) mask();
      else photo.addEventListener('load', mask, { once: true });
    }

    if (!hasWebGL()) {
      this.dataset.state = 'photo';
      return;
    }
    const { motion, outline, texture, normal, rim } = this.dataset;
    if (!outline || !texture || !normal || (rim !== 'gold' && rim !== 'silver')) return;
    import('./scene')
      .then(({ showPin }) =>
        showPin(
          this,
          { outline, texture, normal, rim },
          {
            motion: (motion === 'sway' ? 'sway' : 'turn') satisfies Motion,
            label: photo?.alt ?? 'Pin',
            onReady: () => (this.dataset.state = '3d'),
          },
        ),
      )
      .catch((error: unknown) => {
        // The photo stays in the case.
        this.dataset.state = 'photo';
        console.warn('3D pin not available:', error);
      });
  }
}

customElements.define('pin-viewer', PinViewer);
