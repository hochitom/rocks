# 13: Side finds — Pins, die nicht aus einem Hard Rock Cafe sind

**Status:** done

**Type:** task

Die Sammlung enthält zwei Pins, die nicht aus einem Hard Rock Cafe stammen (Rock & Roll Hall of Fame, Cleveland; Johnny Cash, Nashville). Sie sind vorläufig wie Cafe-Pins erfasst, deshalb steht überall fälschlich „Hard Rock Cafe …“ (Messingschild, Alt-Texte, Beschreibung, Globus, Intro). Dieses Ticket macht sie zu **Side finds**: gleiche Galerie, eigener Filter, eigene Darstellung wo nötig.

Entschieden im Grilling am 2026-10-06 (siehe Comments).

## Begriffe (neue `CONTEXT.md`)

- **Hard Rock pin**: Pin aus einem Hard Rock Cafe.
- **Side find**: anderer Pin, an einen Ort gebunden (Museum, Sehenswürdigkeit …). Das Modell schließt künftige Pins ohne festen Ort (Merch) nicht aus, verlangt aber vorerst einen Ort.
- **Kind**: die Art eines Pins, `hard-rock` oder `side-find`.
- **Place**: der genaue Ort eines Pins (Cafe-Name oder z. B. „Johnny Cash Museum“).

## Was zu bauen ist

**Datenmodell** (`src/content.config.ts`)
- [x] `kind: hard-rock | side-find`, optional, Standard `hard-rock`.
- [x] `title`: Pflicht bei `side-find`, bei `hard-rock` nicht erlaubt; verständliche Fehlermeldungen.
- [x] `cafeName` → `place` umbenennen (beide Arten). Bestehende Pins und Test-Fixtures anpassen.
- [x] `closed` gilt auch für Side finds (= Ort existiert nicht mehr).
- [x] Stadt, Land, Koordinaten bleiben Pflicht.

**Die beiden Pins** (noch nicht gepusht, Umbenennen ist kostenlos)
- [x] `cleveland-2018` → `rock-and-roll-hall-of-fame-2018`: `kind: side-find`, `title: "Rock & Roll Hall of Fame"`, kein `place`.
- [x] `nashville-2018` → `johnny-cash-2018`: `kind: side-find`, `title: "Johnny Cash"`, `place: "Johnny Cash Museum"`.

**`new-pin`** (`scripts/new-pin.ts`)
- [x] Erste Frage: „Kind (hard-rock, side-find) [hard-rock]:“.
- [x] Bei `side-find`: „Title:“ und „Place (e.g. Johnny Cash Museum):“ statt „Cafe name“.
- [x] Slug-Vorschlag bei Side finds aus dem Titel (`johnny-cash-2018`), sonst wie bisher aus der Stadt.

**Galerie** (`src/pages/index.astro`)
- [x] Zusätzlicher Filter „Side finds“ nach den Kontinenten; nur sichtbar, wenn es Side finds gibt. Side finds erscheinen weiterhin unter ihrem Kontinent.
- [x] Beschriftung: Titel groß, darunter klein „Stadt, Land“. Hover-Platte bleibt Messing.
- [x] Intro-Statistik zählt nur Hard Rock pins, Side finds werden angehängt: „… 11 pins from 8 countries, plus 2 side finds.“ (Singular beachten.)
- [x] Hero (zufälliger Pin in der Vitrine): nur Hard Rock pins.

**Globus** (`src/lib/catalog-globe.ts`, `src/scripts/globe.ts`, `src/pages/map/`)
- [x] Side finds mit eigener, dezenter Markierung in Bone statt Messing; Label zeigt den Titel.
- [x] Gruppierung nach Koordinaten **und** Art (kein Verschmelzen eines Cafés mit einem Side find).
- [x] „n Hard Rock Cafes“ zählt nur echte Cafés.
- [x] Die Reiselinie in Besuchsreihenfolge enthält alle Pins.

**Tour**
- [x] Side finds chronologisch in ihrem Jahr, mit Titel, ohne weitere Kennzeichnung.

**Detailseite und Vorschaubild**
- [x] Großer Umriss-Schriftzug hinter dem Pin bleibt die Stadt.
- [x] Messingschild: Titel statt „Hard Rock Cafe <Stadt>“; Zeile „Place“ statt „Cafe“.
- [x] Beschreibung, Alt-Text und Vorschaubild (`/og/`): „The Johnny Cash pin from hochitom’s collection, brought home from the United States in June 2018.“ bzw. Alt „Johnny Cash pin“.

**Dokumentation**
- [x] `CONTEXT.md` mit den Begriffen oben.
- [x] README: Feldtabelle (`kind`, `title`, `place`) und „Einen neuen Pin anlegen“.
- [x] Kein ADR (leicht umkehrbar).

**Tests**
- [x] Build-Tests mit einem Side-find-Fixture: Schild, Alt-Text, Filter, Statistik, Globus-Daten, Tour.
- [x] Schema-Fehler: Side find ohne Titel, Hard Rock pin mit Titel.
- [x] `new-pin`: Side-find-Durchlauf mit Slug aus dem Titel.

## Comments

**2026-10-06, Grilling:** Alle Empfehlungen angenommen.
- Q1: gleiche Galerie, aber erkennbar (Filter + Darstellung), statt eigenem Bereich.
- Q2: vorerst nur ortsgebundene Pins (Museen, Sehenswürdigkeiten); Ort bleibt Pflicht.
- Q3: frei gesetzter Titel pro Side find (was auf dem Pin steht).
- Q4: ausdrückliches `kind` + `title`; `cafeName` → `place`.
- Q5: Begriff „Side find“ (Beifang), Filter „Side finds“.
- Q6: Kontinent-Filter zeigen Side finds weiterhin.
- Q7: Galerie zeigt Titel statt Stadt, keine Extra-Marke, Hover-Platte Messing.
- Q8: Statistik nur Hard Rock pins, „plus n side finds“.
- Q9: Side finds auf dem Globus in Bone; Zähler nur Cafés.
- Q10: Tour chronologisch mit; Hero nur Hard Rock pins.
- Q11: Umriss-Schriftzug bleibt Stadt; Texte „The <Titel> pin …“.
- Q12: `kind` optional, Standard `hard-rock`.
- Q13: Slugs nach Titel; Umbenennung der beiden Pins.
- Q14: `new-pin` fragt zuerst nach Kind.
- Q15: `closed` auch für Side finds.
- Q16: Globus gruppiert nach Koordinaten und Art.
- Q17: `CONTEXT.md` + README, kein ADR.

**2026-10-06, umgesetzt:** Wie oben. Zusätzlich zum Plan: Auf dem Messingschild eines Side finds steht die Stadt als eigene Zeile („City“), da der Titel sie ersetzt; der Seitentitel (`<title>`) ist der Name (Titel bzw. Stadt); `new-pin` macht aus `&` im Slug „and“. Tests: `test/side-finds.test.ts` (Fixture `test/fixtures/side-finds`), Schema-Fehler in `test/invalid-pins.test.ts`, Side-find-Durchlauf in `test/new-pin.test.ts`.
