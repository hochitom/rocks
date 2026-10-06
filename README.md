# hochitom.rocks

Katalog meiner Hard Rock Cafe Pins: **https://hochitom.rocks**

Jeder Pin hat eine eigene Seite mit einem 3D-Modell, das im Browser aus einem einzigen Foto der Vorderseite entsteht. Dazu gibt es eine Galerie auf Filz, einen Globus mit allen Cafés und eine Tour-Liste nach Jahren. Die Seite ist statisch (Astro) und läuft auf Netlify.

## Loslegen

Voraussetzungen: Node 24, für die Foto-Verarbeitung Python ≥ 3.11.

```sh
npm ci                  # Abhängigkeiten installieren
npm run dev             # Entwicklungsserver auf http://localhost:4321
npm run setup-python    # einmalig: Python-Umgebung für die Foto-Verarbeitung (.venv/)
```

## Einen neuen Pin anlegen

1. Pin nach dem [Foto-Handbuch](docs/fotografieren.md) fotografieren (HEIC direkt vom iPhone geht).
2. `npm run new-pin` ausführen. Der Befehl fragt die Art (Hard Rock pin oder Side find, siehe [CONTEXT.md](CONTEXT.md)), bei Side finds den Titel, dann Stadt, Land, Datum, Café bzw. Ort, Serie, Herkunft, „geschlossen“ und das Foto ab, sucht die Koordinaten über OpenStreetMap Nominatim und schlägt den Slug vor (z. B. `vienna-2019`, bei Side finds aus dem Titel: `johnny-cash-2018`). Dann schreibt er die Pin-Datei, kopiert das Foto dazu und startet die Foto-Verarbeitung.
3. Optional die Geschichte zum Pin als Markdown in `src/content/pins/<slug>.md` schreiben.
4. Committen und auf `main` pushen. Netlify baut und veröffentlicht die Seite automatisch.

Ist die automatische Freistellung schlecht, ein manuell freigestelltes `cutout-manual.png` in den Pin-Ordner legen und `npm run process-pin -- <slug>` ausführen. Details zu Dateien und Fehlerbildern stehen im [Foto-Handbuch](docs/fotografieren.md#verarbeiten).

## Ein Pin im Repo

```
src/content/pins/hamburg-2026.md     # Angaben im Frontmatter, Geschichte als Markdown
src/content/pins/hamburg-2026/       # Original-Foto und die erzeugten Dateien
  photo.heic                         # Original (oder photo.jpg)
  cutout.png  texture.jpg  normal.png  outline.json  meta.json
```

| Feld | Pflicht | Beispiel |
|---|---|---|
| `kind` | nein | `side-find` (Standard `hard-rock`) |
| `title` | bei `side-find` | `Johnny Cash` (nur bei Side finds) |
| `city` | ja | `Hamburg` |
| `country` | ja | `DE` (ISO-3166-1-Alpha-2) |
| `lat`, `lng` | ja | `53.5457`, `9.969` |
| `date` | ja | `2019`, `2019-06` oder `2019-06-14` |
| `place` | nein | `Universal CityWalk`, `Johnny Cash Museum` |
| `closed` | nein | `true` (Standard `false`): Café bzw. Ort geschlossen |
| `series` | nein | `City shield` |
| `origin` | nein | `bought`, `traded` oder `gift` |

Der Slug (Dateiname) bleibt für immer gleich, damit Links stabil bleiben. Ein ungültiger Pin oder fehlende Dateien lassen den Build mit einer verständlichen Meldung scheitern.

## Missing pins: Cafés ohne Pin

Ein Hard Rock Cafe, in dem ich war, ohne einen Pin mitzunehmen (siehe [CONTEXT.md](CONTEXT.md)), ist eine Datei `src/content/missing/<stadt>-<jahr>.md` ohne Foto, z. B. `src/content/missing/wien-2015.md`. Es erscheint unter „Unfinished business“ auf der Startseite, durchgestrichen auf der Tour und als hohler Ring auf dem Globus.

| Feld | Pflicht | Beispiel |
|---|---|---|
| `city`, `country`, `lat`, `lng` | ja | wie bei einem Pin |
| `date` | ja | erster Besuch: `2015`, `2015-06` oder `2015-06-14` |
| `place` | nein | wie bei einem Pin, wenn die Stadt mehrere Cafés hat |
| `note` | nein | `Been back many times since, still no pin.` (englisch) |
| `closed` | nein | `true` (Standard `false`): Café für immer geschlossen |

Habe ich dort später doch einen Pin gekauft, den Pin wie oben anlegen und die Missing-pin-Datei löschen. Solange beide da sind (gleiche Stadt und gleicher Place), scheitert der Build und sagt das.

## Befehle

| Befehl | Was er tut |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | statische Seite nach `dist/` bauen |
| `npm run check` | Typprüfung |
| `npm test` | Build-Tests: baut die Seite mit Test-Pins aus `test/fixtures/` und prüft das HTML |
| `npm run test:browser` | Smoke-Test im Browser (Playwright, vorher einmal `npm run test:browser:install`) |
| `npm run test:python` | Tests der Foto-Verarbeitung |
| `npm run new-pin` | neuen Pin anlegen |
| `npm run process-pin -- <slug>` / `-- --all` | Foto-Verarbeitung für einen oder alle Pins |

## Aufbau

- `src/lib/catalog.ts`: der **Katalog**. Alle Seiten holen ihre Pin-Daten nur von hier (Reihenfolge, Statistik, Tour, Globus-Daten, vorheriger/nächster Pin).
- `src/pages/`: Startseite mit Galerie, Detailseiten `/pins/<slug>/`, Globus `/map/`, Tour `/tour/`, Imprint, 404 und die Vorschaubilder unter `/og/`.
- `src/components/`: Vitrine, Messingschild und der 3D-Viewer (`pin-viewer/`, Three.js).
- `scripts/`: `new-pin.ts`, die Foto-Verarbeitung `process-pin/` (Python, läuft nur lokal).
- `CONTEXT.md`: die Fachsprache (Hard Rock pin, Side find, Place …).
- `docs/`: [Plan](docs/plan.md), [Design](docs/design.md), [Foto-Handbuch](docs/fotografieren.md). Spec und Tickets liegen unter `.scratch/pin-katalog/`.

## Hosting

- **Netlify** baut bei jedem Push auf `main` (Einstellungen in `netlify.toml`). Die Foto-Verarbeitung läuft dort nicht: Ihre Ergebnisse sind committet.
- **Domain:** `hochitom.rocks`, DNS beim Registrar (domaintechnik.at): A-Eintrag auf Netlify, `www` als CNAME.
- **Statistik:** vorerst nur die Abruf-Statistiken von Netlify. Cloudflare Web Analytics ist vorbereitet und wird mit der Umgebungsvariable `CLOUDFLARE_ANALYTICS_TOKEN` in Netlify eingeschaltet; der Datenschutz-Abschnitt passt sich dann von selbst an.

## Quellen

Kontinente: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei). Koordinaten: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Hard Rock Cafe ist eine Marke ihres Inhabers; die Pins und Fotos stammen aus meiner Sammlung.
