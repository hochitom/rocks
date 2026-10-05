"""Photo processing: turns the photo of a pin's front into the pin's assets.

Runs locally only (never in the site build). Reads and writes the pin's asset
folder `src/content/pins/<slug>/`:

  photo.heic | photo.heif | photo.jpg | photo.jpeg   original photo (input)
  cutout-manual.png                                  optional manual cut-out (input)
  cutout.png     cut-out pin, centred on a 1024 px square, transparent background
  texture.jpg    same square, colours bled outwards past the outline (3D front face)
  normal.png     relief map from the photo's brightness
  outline.json   [{outer: [[x, y], ...], holes: [[[x, y], ...], ...]}, ...],
                 x, y in [-0.5, 0.5], origin in the centre, y up
  meta.json      {"rim": "gold" | "silver"}

If `cutout-manual.png` exists it replaces the automatic cut-out (rembg) and is
taken as it is: its holes are kept, nothing is filled in.

Usage:
  npm run process-pin -- <slug> [<slug> ...]
  npm run process-pin -- --all
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

PINS_DIR = Path(__file__).resolve().parents[2] / "src" / "content" / "pins"
PHOTO_NAMES = ("photo.heic", "photo.heif", "photo.jpg", "photo.jpeg")
MANUAL_CUTOUT = "cutout-manual.png"

SIZE = 1024                # side of the square output images
PAD = 0.04                 # margin around the pin, fraction of the pin's longer side
MIN_HOLE_FILL = 0.0015     # automatic cut-out: fill holes smaller than this share of the photo
MIN_SHAPE_AREA = 200       # outline: ignore specks / holes below these areas (px² at SIZE)
MIN_HOLE_AREA = 150
SMOOTH_SIGMA = 3.0         # outline smoothing along the contour, px
SIMPLIFY = 0.6             # outline simplification tolerance, px
NORMAL_STRENGTH = 4.0
GOLD_SATURATION = 0.22     # rim colour saturation above this reads as gold


class PinError(Exception):
    pass


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Photo of a pin -> pin assets.")
    parser.add_argument("slugs", nargs="*", help="pin slug(s), e.g. hamburg-2019")
    parser.add_argument("--all", action="store_true", help="process every pin")
    parser.add_argument("--pins-dir", type=Path, default=PINS_DIR, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)

    pins_dir: Path = args.pins_dir
    if args.all == bool(args.slugs):
        parser.error("give one or more pin slugs or --all")
    slugs = sorted(p.stem for p in pins_dir.glob("*.md")) if args.all else args.slugs

    failed = False
    for slug in slugs:
        try:
            process_pin(pins_dir, slug)
        except PinError as error:
            print(f"✗ {slug}: {error}", file=sys.stderr)
            failed = True
    return 1 if failed else 0


def process_pin(pins_dir: Path, slug: str) -> None:
    if not (pins_dir / f"{slug}.md").is_file():
        raise PinError(f"no pin file {pins_dir / f'{slug}.md'}")
    folder = pins_dir / slug
    manual = folder / MANUAL_CUTOUT
    if manual.is_file():
        print(f"→ {slug}: {MANUAL_CUTOUT}")
        rgba, mask = manual_cutout(manual)
    else:
        photo = find_photo(folder)
        print(f"→ {slug}: {photo.name}")
        rgba, mask = automatic_cutout(photo)

    canvas = centre_on_square(rgba, mask)
    mask = (canvas[:, :, 3] > 128).astype(np.uint8)
    Image.fromarray(canvas).save(folder / "cutout.png")
    Image.fromarray(bleed_texture(canvas, mask)).save(folder / "texture.jpg", quality=90)
    Image.fromarray(normal_map(canvas, mask)).save(folder / "normal.png")
    shapes = outline(mask)
    (folder / "outline.json").write_text(json.dumps(shapes))
    (folder / "meta.json").write_text(json.dumps({"rim": rim_metal(canvas, mask)}) + "\n")

    holes = sum(len(s["holes"]) for s in shapes)
    print(f"  {len(shapes)} shape(s), {holes} hole(s)")


def find_photo(folder: Path) -> Path:
    photos = [folder / name for name in PHOTO_NAMES if (folder / name).is_file()]
    if not photos:
        raise PinError(f"no photo in {folder} (expected one of {', '.join(PHOTO_NAMES)} or {MANUAL_CUTOUT})")
    if len(photos) > 1:
        raise PinError(f"more than one photo in {folder}: {', '.join(p.name for p in photos)}")
    return photos[0]


def load(path: Path, mode: str) -> np.ndarray:
    with Image.open(path) as img:
        return np.array(ImageOps.exif_transpose(img).convert(mode))


def largest_blob(mask: np.ndarray) -> np.ndarray:
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    if n < 2:
        raise PinError("no pin found in the image")
    largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    return (labels == largest).astype(np.uint8)


def automatic_cutout(photo: Path) -> tuple[np.ndarray, np.ndarray]:
    from rembg import new_session, remove  # slow import, only needed here

    rgb = Image.fromarray(load(photo, "RGB"))
    rgba = np.array(remove(rgb, session=new_session("isnet-general-use"), post_process_mask=True))

    # Hard threshold, keep the largest blob, close tiny gaps.
    mask = largest_blob((rgba[:, :, 3] > 128).astype(np.uint8))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # Fill small holes (rembg misreads light enamel as background); keep real cut-outs.
    min_hole = MIN_HOLE_FILL * mask.shape[0] * mask.shape[1]
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    for i, c in enumerate(contours):
        if hierarchy[0][i][3] != -1 and cv2.contourArea(c) < min_hole:
            cv2.drawContours(mask, contours, i, 1, cv2.FILLED)
    return rgba, mask


def manual_cutout(path: Path) -> tuple[np.ndarray, np.ndarray]:
    rgba = load(path, "RGBA")
    return rgba, largest_blob((rgba[:, :, 3] > 128).astype(np.uint8))


def centre_on_square(rgba: np.ndarray, mask: np.ndarray) -> np.ndarray:
    rgba = rgba.copy()
    rgba[:, :, 3] = mask * 255
    x, y, w, h = cv2.boundingRect(mask)
    side = int(max(w, h) * (1 + 2 * PAD))
    canvas = np.zeros((side, side, 4), np.uint8)
    ox, oy = (side - w) // 2, (side - h) // 2
    canvas[oy:oy + h, ox:ox + w] = rgba[y:y + h, x:x + w]
    return cv2.resize(canvas, (SIZE, SIZE), interpolation=cv2.INTER_AREA)


def bleed_texture(canvas: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Spread edge colours outwards so the 3D front never samples black background."""
    tex, valid = canvas[:, :, :3].copy(), mask.astype(bool)
    kernel = np.ones((3, 3), np.uint8)
    for _ in range(12):
        grown = cv2.dilate(tex, kernel)
        tex[~valid] = grown[~valid]
        valid = cv2.dilate(valid.astype(np.uint8), kernel).astype(bool)
    return tex


def outline(mask: np.ndarray) -> list[dict]:
    """Outer contours with their holes, smoothed and simplified, normalised, y up."""
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    shapes = []
    for i, c in enumerate(contours):
        if hierarchy[0][i][3] != -1 or cv2.contourArea(c) < MIN_SHAPE_AREA:
            continue  # holes are attached to their parent below
        holes = []
        child = hierarchy[0][i][2]
        while child != -1:
            if cv2.contourArea(contours[child]) > MIN_HOLE_AREA:
                holes.append(ring(contours[child]))
            child = hierarchy[0][child][0]
        shapes.append({"outer": ring(c), "holes": holes})
    return shapes


def ring(contour: np.ndarray) -> list[list[float]]:
    # Smooth the pixel staircase along the closed contour, else the extruded side
    # wall shows banding from jagged normals; then simplify.
    pts = contour[:, 0, :].astype(np.float32)
    if len(pts) > 20:
        pad = 8
        wrapped = np.concatenate([pts[-pad:], pts, pts[:pad]])
        k = cv2.getGaussianKernel(2 * pad + 1, SMOOTH_SIGMA)[:, 0]
        pts = np.stack([np.convolve(wrapped[:, d], k, "valid") for d in (0, 1)], axis=1)
    approx = cv2.approxPolyDP(pts.astype(np.float32).reshape(-1, 1, 2), SIMPLIFY, True)[:, 0, :]
    return [[round(float(px) / SIZE - 0.5, 5), round(0.5 - float(py) / SIZE, 5)] for px, py in approx]


def normal_map(canvas: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Fake relief from blurred brightness: bright metal lines read as raised."""
    gray = cv2.cvtColor(canvas[:, :, :3], cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    gray = cv2.GaussianBlur(gray, (0, 0), 1.5) * mask
    dx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    dy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    nx, ny, nz = -dx * NORMAL_STRENGTH, dy * NORMAL_STRENGTH, np.ones_like(gray)
    length = np.sqrt(nx**2 + ny**2 + nz**2)
    normal = np.stack([nx / length, ny / length, nz / length], axis=-1)
    return ((normal * 0.5 + 0.5) * 255).astype(np.uint8)


def rim_metal(canvas: np.ndarray, mask: np.ndarray) -> str:
    """Median colour of the outermost ring of pixels (the metal edge): gold or silver.

    Deliberately no colour-based metal detection on the front: in the prototype
    yellow enamel and shaded white read as metal, dark real metal didn't.
    """
    edge = (mask - cv2.erode(mask, np.ones((9, 9), np.uint8))).astype(bool)
    r, g, b = np.median(canvas[:, :, :3][edge], axis=0)
    brightest = max(r, g, b)
    saturation = (brightest - min(r, g, b)) / brightest if brightest else 0.0
    return "gold" if saturation > GOLD_SATURATION else "silver"


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
