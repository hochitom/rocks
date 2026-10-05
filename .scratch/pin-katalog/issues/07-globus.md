# 07: Globus

**What to build:** Die Kartenseite als abstrakter, drehbarer **Globus** über die ganze Breite: Kontinente aus Messing-Punkten auf einer Samt-Kugel mit Messing-Randlicht, „Around the world“ als `h1` riesig in Messing-Kontur dahinter, echte Pins als Foto-Marker, eine **Tour-Linie** in der Reihenfolge der Besuche und ein Café-Kärtchen als Ebene über dem Globus. Die verbindlichen Werte stehen in der Spec (Abschnitt Globus); Referenz: Branch `prototype/design` (`096ba83`). Die Detailseite bekommt den Link „Show <Stadt> on the map“.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien), 04 (Detailseite komplett (ohne 3D))

**Status:** ready-for-agent

- [x] Land-Punkte werden **beim Build** aus `world-atlas` `land-110m` (Natural Earth) vorberechnet, nicht im Browser
- [x] Katalog liefert Globus-Daten: Cafés (identische Koordinaten zusammengefasst) und Tour-Route (chronologisch, ohne direkte Wiederholung desselben Cafés)
- [x] Marker sind Buttons (Tastatur, Screenreader), mit Zahl bei mehreren Pins, auf der Rückseite ausgeblendet, am Rand der Globus-Fläche abgeschnitten
- [x] Auswählen dreht das Café nach vorne, zoomt moderat heran und zeigt das Kärtchen mit Pins (Foto, Stadt, Datum, Link)
- [x] Drehen per Maus/Touch, Zoom per Mausrad/zwei Finger, begrenzt; Kamera-Abstand passt sich dem Seitenverhältnis an
- [x] Eigendrehung pausiert unter der Maus, entfällt bei „Bewegung reduzieren“; Tour-Linie fließt von alt nach neu
- [x] Fokus per URL-Parameter; Link von der Detailseite öffnet den Globus mit gedrehtem Café und offenem Kärtchen
- [x] Ohne WebGL: Liste der Cafés mit Links
- [x] Build-Tests: gemeinsamer Marker, Tour-Route, vorberechnete Land-Punkte vorhanden
- [x] Smoke-Test im Browser: Globus lädt ohne JavaScript-Fehler
- [ ] Manuell geprüft auf Desktop und Handy

## Comments

**2026-10-05 (Agent):** Umgesetzt. Die Land-Punkte entstehen beim Build als `/map/land.json` (≈ 7.600 Punkte, 87 KB, gzip 23 KB) aus `world-atlas` `land-110m` mit `topojson-client` und `d3-geo` (`src/lib/land-dots.ts`). Der Katalog liefert `cafes` und `route` in einem eigenen Globus-Block; die Kartenseite gibt Cafés, Tour-Route und kleine Pin-Fotos (`astro:assets`, 112 px WebP) als JSON an das Globus-Skript (`src/scripts/globe.ts`), das Three.js nur nachlädt, wenn WebGL da ist. Ohne JavaScript oder WebGL zeigt die Seite die Café-Liste mit Links. Marker auf der Rückseite sind unsichtbar, bleiben aber per Tab erreichbar: Der Fokus dreht sie nach vorne. Ein ausgewähltes Café steht im URL-Parameter `pin`. Build-Tests in `test/globe.test.ts`, für den späteren Wiederbesuch eines Cafés mit eigenem Beispiel-Satz `test/fixtures/revisit/`. Im Browser geprüft (Desktop und 375 px, mit Beispiel-Pins): keine JavaScript-Fehler, Auswahl per Klick und Tastatur, `?pin=`, Pause unter der Maus, keine Eigendrehung bei „Bewegung reduzieren“ (per Attrappe von `matchMedia`). Offen: Prüfung auf einem echten Handy; der Three.js-Teil ist ein eigenes Skript mit ≈ 560 KB (Vite warnt wegen der Größe), es wird aber nur auf der Kartenseite geladen.
