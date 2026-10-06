"""Test-Stelle 2: the photo processing, checked only through the files it writes.

The script is run as a command against a temporary pins folder, exactly like
`npm run process-pin` does against `src/content/pins/`.
"""
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()  # the tests turn a HEIC original into a JPG input

REPO = Path(__file__).resolve().parents[3]
SCRIPT = REPO / "scripts" / "process-pin" / "process_pin.py"
ORIGINALS = REPO / "src" / "content" / "pins"
HAMBURG_HEIC = ORIGINALS / "hamburg-2026" / "photo.heic"
TROMSO_HEIC = ORIGINALS / "tromso-2026" / "photo.heic"

ASSETS = {"cutout.png", "texture.jpg", "normal.png", "outline.json", "meta.json"}


def run(pins_dir: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--pins-dir", str(pins_dir), *args],
        capture_output=True,
        text=True,
    )


def add_pin(pins_dir: Path, slug: str, files: dict[str, Path]) -> Path:
    folder = pins_dir / slug
    folder.mkdir(parents=True)
    (pins_dir / f"{slug}.md").write_text("---\ncity: Test\n---\n")
    for name, source in files.items():
        shutil.copy(source, folder / name)
    return folder


@pytest.fixture(scope="module")
def hamburg(tmp_path_factory) -> Path:
    """Hamburg processed on its own from the iPhone HEIC."""
    pins = tmp_path_factory.mktemp("pins")
    folder = add_pin(pins, "hamburg-2026", {"photo.heic": HAMBURG_HEIC})
    result = run(pins, "hamburg-2026")
    assert result.returncode == 0, result.stderr
    return folder


def test_single_pin_from_heic_creates_all_assets(hamburg):
    assert {p.name for p in hamburg.iterdir()} == ASSETS | {"photo.heic"}


def test_images_are_1024_squares(hamburg):
    for name in ("cutout.png", "texture.jpg", "normal.png"):
        with Image.open(hamburg / name) as img:
            assert img.size == (1024, 1024), name
    with Image.open(hamburg / "cutout.png") as img:
        assert img.mode == "RGBA"


# --- outline -----------------------------------------------------------------

MIN_HOLE_SHARE = 1e-4  # share of the image square; anything smaller is a speck, not a real cut-out


def area(ring) -> float:
    """Shoelace area of a closed ring (the last point connects back to the first)."""
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))) / 2


def inside(point, ring) -> bool:
    x, y = point
    hit = False
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            hit = not hit
    return hit


def self_intersecting(edges) -> bool:
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    n = len(edges)
    for i in range(n):
        for j in range(i + 2, n):
            if i == 0 and j == n - 1:
                continue  # neighbours through the closing point
            (p, q), (r, s) = edges[i], edges[j]
            if cross(p, q, r) * cross(p, q, s) < 0 and cross(r, s, p) * cross(r, s, q) < 0:
                return True
    return False


def assert_valid_outline(folder: Path) -> list[dict]:
    shapes = json.loads((folder / "outline.json").read_text())
    assert isinstance(shapes, list) and shapes, "outline has no shapes"
    for shape in shapes:
        assert set(shape) == {"outer", "holes"}
        for ring in [shape["outer"], *shape["holes"]]:
            assert len(ring) >= 3
            for point in ring:
                assert len(point) == 2
                assert all(-0.5 <= v <= 0.5 for v in point), point
            # Closed: the ring goes all the way round, so the implicit edge from the last
            # point back to the first is an ordinary edge, and the ring never crosses itself.
            edges = list(zip(ring, ring[1:] + ring[:1]))
            assert all(a != b for a, b in edges), "repeated point"
            assert math.dist(*edges[-1]) <= max(math.dist(a, b) for a, b in edges[:-1])
            assert not self_intersecting(edges)
            assert area(ring) > 0
        for hole in shape["holes"]:
            assert area(hole) >= MIN_HOLE_SHARE, "tiny hole"
            assert all(inside(p, shape["outer"]) for p in hole), "hole outside its shape"
    return shapes


def test_outline_is_valid(hamburg):
    assert_valid_outline(hamburg)


def test_outline_fills_the_square_with_a_margin(hamburg):
    points = [p for s in assert_valid_outline(hamburg) for p in s["outer"]]
    extent = max(max(abs(x), abs(y)) for x, y in points)
    assert 0.4 < extent < 0.5  # centred, longer side ~92 % of the square


# --- all pins, JPG, rim metal ----------------------------------------------------


@pytest.fixture(scope="module")
def all_pins(tmp_path_factory) -> Path:
    """Both prototype pins processed with --all; Tromsø as a JPG instead of HEIC."""
    pins = tmp_path_factory.mktemp("pins")
    add_pin(pins, "hamburg-2026", {"photo.heic": HAMBURG_HEIC})
    tromso = add_pin(pins, "tromso-2026", {})
    with Image.open(TROMSO_HEIC) as img:
        img.convert("RGB").save(tromso / "photo.jpg", quality=92)
    result = run(pins, "--all")
    assert result.returncode == 0, result.stderr
    return pins


@pytest.mark.parametrize("slug,photo", [("hamburg-2026", "photo.heic"), ("tromso-2026", "photo.jpg")])
def test_all_pins_get_valid_assets(all_pins, slug, photo):
    folder = all_pins / slug
    assert {p.name for p in folder.iterdir()} == ASSETS | {photo}
    assert_valid_outline(folder)


@pytest.mark.parametrize("slug,metal", [("hamburg-2026", "gold"), ("tromso-2026", "silver")])
def test_rim_metal(all_pins, slug, metal):
    assert json.loads((all_pins / slug / "meta.json").read_text()) == {"rim": metal}


def test_manual_rim_replaces_the_detected_one(tmp_path):
    folder = add_pin(tmp_path, "tromso-2026", {"photo.heic": TROMSO_HEIC})
    (folder / "rim-manual.txt").write_text("gold\n")
    result = run(tmp_path, "tromso-2026")
    assert result.returncode == 0, result.stderr
    assert json.loads((folder / "meta.json").read_text()) == {"rim": "gold"}


def test_unknown_manual_rim_fails_with_a_message(tmp_path):
    folder = add_pin(tmp_path, "tromso-2026", {"photo.heic": TROMSO_HEIC})
    (folder / "rim-manual.txt").write_text("bronze")
    result = run(tmp_path, "tromso-2026")
    assert result.returncode != 0
    assert "gold or silver" in result.stderr
    assert not (folder / "meta.json").exists()


# --- manual cut-out --------------------------------------------------------------


@pytest.fixture(scope="module")
def manual(tmp_path_factory) -> Path:
    """Hamburg photo plus a manual cut-out of a completely different shape: a silver
    disc with a small hole that the automatic cut-out would have filled."""
    pins = tmp_path_factory.mktemp("pins")
    folder = add_pin(pins, "hamburg-2026", {"photo.heic": HAMBURG_HEIC})
    disc = np.zeros((800, 800, 4), np.uint8)
    yy, xx = np.mgrid[:800, :800]
    disc[(xx - 400) ** 2 + (yy - 400) ** 2 <= 350**2] = (170, 170, 176, 255)
    disc[(xx - 500) ** 2 + (yy - 300) ** 2 <= 15**2] = 0  # 0.11 % of the image
    Image.fromarray(disc).save(folder / "cutout-manual.png")
    result = run(pins, "hamburg-2026")
    assert result.returncode == 0, result.stderr
    return folder


def test_manual_cutout_is_preferred_over_the_photo(manual):
    assert {p.name for p in manual.iterdir()} == ASSETS | {"photo.heic", "cutout-manual.png"}
    [shape] = assert_valid_outline(manual)
    disc_area = math.pi * (0.5 / 1.08) ** 2  # disc fills the square minus the 4 % margin
    assert area(shape["outer"]) == pytest.approx(disc_area, rel=0.03)
    assert json.loads((manual / "meta.json").read_text()) == {"rim": "silver"}


def test_manual_cutout_keeps_its_small_holes(manual):
    [shape] = assert_valid_outline(manual)
    assert len(shape["holes"]) == 1


# --- errors ----------------------------------------------------------------------


def test_unknown_pin_fails_with_a_message(tmp_path):
    result = run(tmp_path, "atlantis-2020")
    assert result.returncode != 0
    assert "atlantis-2020" in result.stderr


def test_pin_without_photo_fails_and_writes_nothing(tmp_path):
    folder = add_pin(tmp_path, "vienna-2018", {})
    result = run(tmp_path, "vienna-2018")
    assert result.returncode != 0
    assert "no photo" in result.stderr
    assert list(folder.iterdir()) == []


def test_pin_with_two_photos_fails(tmp_path):
    folder = add_pin(tmp_path, "vienna-2018", {"photo.heic": HAMBURG_HEIC})
    (folder / "photo.jpg").write_bytes(b"")
    result = run(tmp_path, "vienna-2018")
    assert result.returncode != 0
    assert "more than one photo" in result.stderr
