# 07: Globus

**What to build:** Die Kartenseite als abstrakter, drehbarer **Globus** über die ganze Breite: Kontinente aus Messing-Punkten auf einer Samt-Kugel mit Messing-Randlicht, „Around the world“ als `h1` riesig in Messing-Kontur dahinter, echte Pins als Foto-Marker, eine **Tour-Linie** in der Reihenfolge der Besuche und ein Café-Kärtchen als Ebene über dem Globus. Die verbindlichen Werte stehen in der Spec (Abschnitt Globus); Referenz: Branch `prototype/design` (`096ba83`). Die Detailseite bekommt den Link „Show <Stadt> on the map“.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien), 04 (Detailseite komplett (ohne 3D))

**Status:** ready-for-agent

- [ ] Land-Punkte werden **beim Build** aus `world-atlas` `land-110m` (Natural Earth) vorberechnet, nicht im Browser
- [ ] Katalog liefert Globus-Daten: Cafés (identische Koordinaten zusammengefasst) und Tour-Route (chronologisch, ohne direkte Wiederholung desselben Cafés)
- [ ] Marker sind Buttons (Tastatur, Screenreader), mit Zahl bei mehreren Pins, auf der Rückseite ausgeblendet, am Rand der Globus-Fläche abgeschnitten
- [ ] Auswählen dreht das Café nach vorne, zoomt moderat heran und zeigt das Kärtchen mit Pins (Foto, Stadt, Datum, Link)
- [ ] Drehen per Maus/Touch, Zoom per Mausrad/zwei Finger, begrenzt; Kamera-Abstand passt sich dem Seitenverhältnis an
- [ ] Eigendrehung pausiert unter der Maus, entfällt bei „Bewegung reduzieren“; Tour-Linie fließt von alt nach neu
- [ ] Fokus per URL-Parameter; Link von der Detailseite öffnet den Globus mit gedrehtem Café und offenem Kärtchen
- [ ] Ohne WebGL: Liste der Cafés mit Links
- [ ] Build-Tests: gemeinsamer Marker, Tour-Route, vorberechnete Land-Punkte vorhanden
- [ ] Smoke-Test im Browser: Globus lädt ohne JavaScript-Fehler
- [ ] Manuell geprüft auf Desktop und Handy
