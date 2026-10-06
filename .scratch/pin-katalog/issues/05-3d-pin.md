# 05: 3D-Pin auf Detailseite und im Hero

**What to build:** Der Pin wird in der Vitrine zum 3D-Objekt: Der Viewer (Three.js, als nachgeladene Insel) baut das Modell im Browser aus Umriss, Textur, Relief-Karte und Randfarbe — mit den verbindlichen Werten aus Spec und Prototyp (Tiefe, Fase, niedriger Glanz der Vorderseite, Metall für Rand und Rückseite mit Nadel und Verschluss, Licht). Auf der Detailseite schaut der Pin meist nach vorne, schwenkt leicht und macht alle ≈ 12 s eine sanft beschleunigte ganze Drehung; im Hero der Startseite schwenkt ein zufälliger Pin vor seinem Stadtnamen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 03 (Galerie auf der Startseite), 04 (Detailseite komplett (ohne 3D))

**Status:** ready-for-agent

- [x] Modell entsteht im Browser; keine `.glb`-Dateien
- [x] Gold- oder Altsilber-Metall laut Metadaten
- [x] Ziehen (Maus/Touch) dreht den Pin; Eigenbewegung pausiert bei Interaktion und setzt nach ≈ 2,5 s wieder ein
- [x] Bei „Bewegung reduzieren“ keine Eigenbewegung, Ziehen bleibt möglich
- [x] Ohne WebGL: freigestelltes Foto mit CSS-Effekt
- [x] Seitentext ist lesbar, bevor das 3D-Modell geladen ist
- [x] Hero zeigt bei jedem Besuch einen zufälligen Pin mit seinem Stadtnamen in Messing-Kontur
- [x] Smoke-Test im Browser: Startseite und Detailseite laden ohne JavaScript-Fehler; ohne WebGL erscheint die Rückfall-Lösung
- [ ] Manuell geprüft auf Desktop und Handy

## Comments

**2026-10-05 (Agent):** Umgesetzt. Der Viewer ist ein eigenes Element `<pin-viewer>` (`src/components/pin-viewer/`): Es zeigt sofort das freigestellte Foto mit dem Galerie-Effekt (jetzt gemeinsam in `src/styles/tilt.css` und `src/scripts/tilt.ts`) und lädt Three.js erst danach; das Modell blendet über, sobald das erste Bild gezeichnet ist. Ohne WebGL 2 oder bei einem Ladefehler bleibt das Foto. Der Katalog liefert pro Pin Umriss, Textur, Relief-Karte und Randmetall; fehlen Dateien oder ist `rim` weder `gold` noch `silver`, scheitert der Build mit Hinweis auf `npm run process-pin`. Textur und Relief-Karte werden beim Build zu WebP (Relief-Karte Hamburg 1,1 MB → 175 KB). Ziehen dreht den Pin selbst (kein OrbitControls); auf dem Handy bleiben senkrechte Wischer zum Scrollen. Nach der Pause dreht er sich langsam wieder nach vorne. Im Hero wählt ein kleines Skript direkt nach der Vitrine den zufälligen Pin, bevor das (lazy) Foto geladen wird — so lädt das Handy nur ein Foto. Laut Entscheidung des Besitzers steht im Intro nur noch der Statistik-Satz, ohne „The one in the case is …“. Geprüft im eingebetteten Browser (Desktop und 375 px emuliert): keine JavaScript-Fehler, Ziehen, Pause und Wiederaufnahme, „Bewegung reduzieren“ und WebGL-Rückfall per Skript simuliert, Hamburg (Gold) und Reykjavík (Silber) mit denselben Werten wie im Prototyp. Auf einem echten Handy noch nicht geprüft.

**2026-10-06 (Agent):** Entscheidung des Besitzers umgesetzt: Der Zyklus bleibt bei 12 s, die sanft beschleunigte ganze Drehung dauert jetzt aber nur noch ≈ 3 s statt 6 s; die übrigen ≈ 9 s schwenkt der Pin frontal (gleiche Schwenk-Frequenz wie bisher, drei ganze Schwünge). Easing bleibt Smoothstep; Schwenken und Drehung beginnen und enden frontal, daher kein Sprung am Übergang. Hero (nur Schwenken) unverändert. Design und Spec nennen die Aufteilung jetzt.
