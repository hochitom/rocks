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
2. `npm run new-pin` ausführen. Der Befehl fragt Stadt, Land, Datum, Café, Serie, Herkunft, „geschlossen“ und das Foto ab, sucht die Koordinaten über OpenStreetMap Nominatim und schlägt den Slug vor (z. B. `vienna-2019`). Dann schreibt er die Pin-Datei, kopiert das Foto dazu und startet die Foto-Verarbeitung.
3. Optional die Geschichte zum Pin als Markdown in `src/content/pins/<slug>.md` schreiben.
4. Committen und auf `main` pushen. Netlify baut und veröffentlicht die Seite automatisch.

Ist die automatische Freistellung schlecht, ein manuell freigestelltes `cutout-manual.png` in den Pin-Ordner legen und `npm run process-pin -- <slug>` ausführen. Details zu Dateien und Fehlerbildern stehen im [Foto-Handbuch](docs/fotografieren.md#verarbeiten).

## Ein Pin im Repo

```
src/content/pins/hamburg-2019.md     # Angaben im Frontmatter, Geschichte als Markdown
src/content/pins/hamburg-2019/       # Original-Foto und die erzeugten Dateien
  photo.heic                         # Original (oder photo.jpg)
  cutout.png  texture.jpg  normal.png  outline.json  meta.json
```

| Feld | Pflicht | Beispiel |
|---|---|---|
| `city` | ja | `Hamburg` |
| `country` | ja | `DE` (ISO-3166-1-Alpha-2) |
| `lat`, `lng` | ja | `53.5457`, `9.969` |
| `date` | ja | `2019`, `2019-06` oder `2019-06-14` |
| `cafeName` | nein | `Universal CityWalk` |
| `closed` | nein | `true` (Standard `false`) |
| `series` | nein | `City shield` |
| `origin` | nein | `bought`, `traded` oder `gift` |

Der Slug (Dateiname) bleibt für immer gleich, damit Links stabil bleiben. Ein ungültiger Pin oder fehlende Dateien lassen den Build mit einer verständlichen Meldung scheitern.

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
- `scripts/`: `new-pin.ts`, die Foto-Verarbeitung `process-pin/` (Python, läuft nur lokal) und `go-live.sh` (Einrichtung von Netlify und Domain).
- `docs/`: [Plan](docs/plan.md), [Design](docs/design.md), [Foto-Handbuch](docs/fotografieren.md). Spec und Tickets liegen unter `.scratch/pin-katalog/`.

## Hosting

- **Netlify** baut bei jedem Push auf `main` (Einstellungen in `netlify.toml`). Die Foto-Verarbeitung läuft dort nicht: Ihre Ergebnisse sind committet.
- **Domain:** `hochitom.rocks`, DNS beim Registrar (domaintechnik.at): A-Eintrag auf Netlify, `www` als CNAME.
- **Statistik:** vorerst nur die Abruf-Statistiken von Netlify. Cloudflare Web Analytics ist vorbereitet und wird mit der Umgebungsvariable `CLOUDFLARE_ANALYTICS_TOKEN` in Netlify eingeschaltet; der Datenschutz-Abschnitt passt sich dann von selbst an.

## Quellen

Kontinente: [Natural Earth](https://www.naturalearthdata.com/) (gemeinfrei). Koordinaten: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Hard Rock Cafe ist eine Marke ihres Inhabers; die Pins und Fotos stammen aus meiner Sammlung.
