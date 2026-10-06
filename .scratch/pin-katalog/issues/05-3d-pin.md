# 05: 3D-Pin auf Detailseite und im Hero

**What to build:** Der Pin wird in der Vitrine zum 3D-Objekt: Der Viewer (Three.js, als nachgeladene Insel) baut das Modell im Browser aus Umriss, Textur, Relief-Karte und Randfarbe — mit den verbindlichen Werten aus Spec und Prototyp (Tiefe, Fase, niedriger Glanz der Vorderseite, Metall für Rand und Rückseite mit Nadel und Verschluss, Licht). Auf der Detailseite schaut der Pin meist nach vorne, schwenkt leicht und macht alle ≈ 12 s eine sanft beschleunigte ganze Drehung; im Hero der Startseite schwenkt ein zufälliger Pin vor seinem Stadtnamen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 03 (Galerie auf der Startseite), 04 (Detailseite komplett (ohne 3D))

**Status:** ready-for-agent

- [ ] Modell entsteht im Browser; keine `.glb`-Dateien
- [ ] Gold- oder Altsilber-Metall laut Metadaten
- [ ] Ziehen (Maus/Touch) dreht den Pin; Eigenbewegung pausiert bei Interaktion und setzt nach ≈ 2,5 s wieder ein
- [ ] Bei „Bewegung reduzieren“ keine Eigenbewegung, Ziehen bleibt möglich
- [ ] Ohne WebGL: freigestelltes Foto mit CSS-Effekt
- [ ] Seitentext ist lesbar, bevor das 3D-Modell geladen ist
- [ ] Hero zeigt bei jedem Besuch einen zufälligen Pin mit seinem Stadtnamen in Messing-Kontur
- [ ] Smoke-Test im Browser: Startseite und Detailseite laden ohne JavaScript-Fehler; ohne WebGL erscheint die Rückfall-Lösung
- [ ] Manuell geprüft auf Desktop und Handy
