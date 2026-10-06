# 03: Galerie auf der Startseite

**What to build:** Die Startseite zeigt die ganze Sammlung als **Filz-Banner**: freigestellte Pins direkt auf Filz-Struktur, ohne Kacheln, Rahmen oder Kartenschatten, darunter Stadt und Land. Darüber steht der Einleitungssatz mit Statistik als ganzer Satz („hochitom's Hard Rock Cafe pins, collected since 2009: 42 pins from 18 countries.“). Der Hero mit 3D-Pin kommt in Ticket 05; bis dahin darf der Hero-Bereich das freigestellte Foto eines zufälligen Pins zeigen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien)

**Status:** ready-for-agent

- [ ] Neueste Pins zuerst
- [ ] Kontinent-Filter als Textschalter (All + vorhandene Kontinente), aktiver Schalter mit Messing-Unterstrich; ohne JavaScript sind alle Pins sichtbar und kein Filter
- [ ] Leerer Filter-Zustand mit Satz statt leerem Raster
- [ ] CSS-Neige- und Glanz-Effekt beim Hover, kein WebGL; aus bei „Bewegung reduzieren“
- [ ] Geschlossene Cafés sind gekennzeichnet
- [ ] Statistik-Satz zählt Pins, Länder und erstes Jahr korrekt
- [ ] Alternativtexte „Hard Rock Cafe <Stadt> pin“
- [ ] Build-Tests: Reihenfolge, Filter-Optionen, Markierung geschlossener Cafés, Statistik
