# 03: Galerie auf der Startseite

**What to build:** Die Startseite zeigt die ganze Sammlung als **Filz-Banner**: freigestellte Pins direkt auf Filz-Struktur, ohne Kacheln, Rahmen oder Kartenschatten, darunter Stadt und Land. Darüber steht der Einleitungssatz mit Statistik als ganzer Satz („hochitom's Hard Rock Cafe pins, collected since 2009: 42 pins from 18 countries.“). Der Hero mit 3D-Pin kommt in Ticket 05; bis dahin darf der Hero-Bereich das freigestellte Foto eines zufälligen Pins zeigen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien)

**Status:** ready-for-agent

- [x] Neueste Pins zuerst
- [x] Kontinent-Filter als Textschalter (All + vorhandene Kontinente), aktiver Schalter mit Messing-Unterstrich; ohne JavaScript sind alle Pins sichtbar und kein Filter
- [x] Leerer Filter-Zustand mit Satz statt leerem Raster
- [x] CSS-Neige- und Glanz-Effekt beim Hover, kein WebGL; aus bei „Bewegung reduzieren“
- [x] Geschlossene Cafés sind gekennzeichnet
- [x] Statistik-Satz zählt Pins, Länder und erstes Jahr korrekt
- [x] Alternativtexte „Hard Rock Cafe <Stadt> pin“
- [x] Build-Tests: Reihenfolge, Filter-Optionen, Markierung geschlossener Cafés, Statistik

## Comments

**2026-10-05 (Agent):** Umgesetzt. Der Katalog liefert zusätzlich `closed`, `continents` (vorhandene Kontinente, alphabetisch) und `stats` (Pins, Länder, erstes Jahr). Der Hero zeigt bis Ticket 05 das freigestellte Foto im Lichtkegel: ohne JavaScript den neuesten Pin, mit Skript bei jedem Besuch einen zufälligen; den großen Stadtnamen (Vitrine) bringen Ticket 04/05. Der Filter steht in der URL (`?continent=Asia`): So lässt sich ein gefilterter Link teilen, und der leere Zustand („No pins from Asia yet.“) wird erreichbar. Neige- und Glanz-Effekt sind CSS (der Glanz ist per `mask` auf die Pin-Form begrenzt); das Skript führt nur die Neigung mit der Maus nach. Bei „Bewegung reduzieren“ ist beides aus. Galerie-Bilder: ein WebP mit 400 px pro Pin. Build-Tests in `test/gallery.test.ts`, dazu das Beispiel-Set `test/fixtures/one-pin/` für die Einzahl („1 pin from 1 country“); der Startseiten-Test aus `layout.test.ts` ist dorthin umgezogen. Im Browser geprüft bei 800 px und 375 px (kein seitliches Scrollen), mit Filter, leerem Zustand und Hover.
