# 14: Missing pins — Cafés, in denen ich ohne Pin war

**Status:** done

**Type:** task

Ich war in ein paar Hard Rock Cafes, ohne einen Pin mitzunehmen. Die sollen auch auf die Seite: als Erinnerung und als Wunschliste für den nächsten Besuch. Dieses Ticket führt dafür **Missing pins** ein, ein eigenes Konzept neben den Pins (siehe `CONTEXT.md`).

Entschieden im Grilling am 2026-10-06 (siehe Comments).

## Was zu bauen ist

**Datenmodell** (`src/content.config.ts`)
- [x] Neue Collection `missing`, Dateien `src/content/missing/<stadt>-<jahr>.md` (Slug-Schema wie bei Pins, ASCII: `munchen-2016`).
- [x] Felder: `city`, `country`, `lat`, `lng` (Pflicht, gleiche Prüfungen wie bei Pins), `place` (optional), `date` (Pflicht, erster Besuch, `YYYY` / `YYYY-MM` / `YYYY-MM-DD`), `note` (optional, englisch), `closed` (Standard `false`).
- [x] Kein `kind`, `title`, `series` oder `origin`, kein Foto.
- [x] Build-Prüfung: Gibt es einen Hard Rock pin mit gleichem `city` + `place` (Groß-/Kleinschreibung egal, fehlender Place = leer), scheitert der Build. Die Meldung nennt beide Dateien und sagt, dass der Missing pin gelöscht werden soll.

**Katalog** (`src/lib/catalog.ts`)
- [x] Missing pins kommen über den Katalog zu den Seiten, getrennt von `pins`.
- [x] `stats` bleibt unverändert, Missing pins zählen nicht.
- [x] `neighbours`, Hero und Galerie sehen keine Missing pins.

**Startseite** (`src/pages/index.astro`)
- [x] Statistik-Satz und Galerie bleiben, wie sie sind.
- [x] Unter der Galerie der Abschnitt `id="unfinished-business"`: Überschrift „Unfinished business“, Unterzeile „Cafes I've been to without bringing a pin home. I'll be back.“
- [x] Schlichte Liste: „Hard Rock Cafe <Stadt>“ (+ Place), Land, Besuchsdatum, Notiz; bei geschlossenen „closed for good“.
- [x] Sortierung: offene zuerst, geschlossene am Ende; innerhalb jeder Gruppe der neueste Besuch zuerst.
- [x] Abschnitt fehlt, wenn es keine Missing pins gibt.

**Tour** (`src/pages/tour.astro`)
- [x] Missing pins in ihrem Jahr chronologisch zwischen den Pins, durchgestrichen, ohne Zusatzwort, nicht verlinkt.

**Globus** (`src/lib/catalog-globe.ts`, `src/scripts/globe.ts`, `src/pages/map/`)
- [x] Eigene, hohle Markierung (Umriss), klar unterscheidbar von Messing (Café) und Bone-Ring (Side find).
- [x] Missing pins sind Teil der Route in Besuchsreihenfolge.
- [x] Klick öffnet die Cafe-Karte (statt Tooltip): „Hard Rock Cafe Praha · visited 2008 · no pin yet“ und der Link „Unfinished business →“ zu `/#unfinished-business`.
- [x] Der Zähler „n Hard Rock Cafes“ zählt nur Cafés mit Pin.

**Daten**: die acht Missing pins. Städtenamen lokal wie bei den Pins. Koordinaten nachgeschlagen, alle acht Cafés sind noch offen.

| Datei | city | country | date | note |
|---|---|---|---|---|
| `roma-2024.md` | Roma | IT | 2024-05 | |
| `paris-2026.md` | Paris | FR | 2026-06 | |
| `wien-2015.md` | Wien | AT | 2015 | Been back many times since, still no pin. |
| `munchen-2016.md` | München | DE | 2016 | |
| `praha-2008.md` | Praha | CZ | 2008 | |
| `amsterdam-2017.md` | Amsterdam | NL | 2017-04 | |
| `mallorca-2015.md` | Mallorca | ES | 2015-06 | |
| `tenerife-2016.md` | Tenerife | ES | 2016-08 | |

Mallorca und Tenerife heißen so, wie die Cafés heißen, nicht nach der Gemeinde (Palma bzw. Adeje).

**Dokumentation**
- [x] `CONTEXT.md`: Missing pin, Unfinished business, Tour und Globus ergänzt.
- [x] README: Missing pin anlegen bzw. löschen, sobald ein Pin gekauft ist; Feldtabelle.
- [x] Kein ADR (leicht umkehrbar).

**Tests**
- [x] Build-Tests mit einem Missing-pin-Fixture: Abschnitt und Sortierung, Tour-Eintrag, Globus-Daten (Markierung, Route), Statistik unverändert, keine Detailseite.
- [x] Schema-Fehler: fehlende Pflichtfelder; Konflikt Pin ↔ Missing pin (gleiches `city` + `place`).

## Comments

**2026-10-06, Grilling:** Alle Empfehlungen angenommen.
- Q1: Begriff intern „Missing pin“, auf der Seite „Unfinished business“.
- Q2: eigenes Konzept, eigene Collection, kein dritter `kind`.
- Q3: nur Hard Rock Cafes, keine Side-find-Orte.
- Q4: Ortsfelder + ein Datum (erster Besuch) + optionale Notiz + `closed`; kein Foto.
- Q5: Pin gekauft → Missing pin löschen; Build-Prüfung gegen Doppelte.
- Q6: geschlossene Cafés bleiben drin, mit `closed`.
- Q7: Globus: hohle Markierung, Teil der Route.
- Q8: eigener Abschnitt unter der Galerie statt leerer Plätze im Filz.
- Q9: Tour: durchgestrichener Tourstopp.
- Q10: Statistik-Satz unverändert.
- Q11: keine Detailseite, keine Vor/Zurück-Navigation.
- Q12: gleiches Café = gleiches `city` + `place`, Groß-/Kleinschreibung egal.
- Q13: Slug `<stadt>-<jahr>`.
- Q14: Texte „Unfinished business“, Unterzeile, Tour ohne Zusatzwort, „closed for good“, Notizen englisch.
- Q15: offene zuerst, dann geschlossene; jeweils neuester Besuch zuerst.
- Q16: Globus-Tooltip, Klick → `/#unfinished-business`.
- Q18: erst `CONTEXT.md` + Ticket, Umsetzung separat.
- Q19: Städtenamen lokal (Roma, Wien, München, Praha).
- Q20: Mallorca und Tenerife als `city`, wie die Cafés heißen.
- Q21: Wien mit Notiz „Been back many times since, still no pin.“

**2026-10-06, umgesetzt (test-first):** Wie oben, mit diesen Abweichungen bzw. Ergänzungen:
- Globus: Der Globus hat keine Tooltips. Ein Missing pin öffnet deshalb dieselbe Karte wie ein Café, mit Besuch, Status und dem Link „Unfinished business →“. Bei geschlossenen Cafés steht „closed for good“ statt „no pin yet“. Die Liste ohne WebGL zeigt Missing pins ebenfalls, mit Link zum Abschnitt.
- Tour: Ein Jahr, das nur Missing pins hat, zeigt als Zähler „no pin“.
- Verzeichnis per `HOCHITOM_MISSING_DIR` (Tests: `test/fixtures/<fixture>/missing/`), analog zu `HOCHITOM_PINS_DIR`.
- Tests: `test/missing-pins.test.ts` (Fixture `test/fixtures/missing-pins`), Build-Fehler in `test/invalid-pins.test.ts`, Browser-Smoke in `test/browser/smoke.spec.ts` (Playwright nutzt die Missing pins des Fixtures `missing-pins`).
