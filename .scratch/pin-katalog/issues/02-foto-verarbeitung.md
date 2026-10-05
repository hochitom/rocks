# 02: Foto-Verarbeitung: vom Foto zu den Pin-Dateien

**What to build:** Ein lokales Python-Skript macht aus einem Foto der Pin-Vorderseite alle Pin-Assets: freigestelltes PNG, Textur-JPEG mit an den Rand verschmierter Farbe, Umriss (JSON), Relief-Karte und Metadaten mit der Randfarbe (`gold`/`silver`). Die verbindlichen Werte aus dem 3D-Prototyp stehen in der Spec (Freistellen mit `rembg` `isnet-general-use`, Löcher unter 0,15 % füllen, Umriss glätten σ ≈ 3 px und vereinfachen ≈ 0,6 px, Relief-Karte per Sobel, Randfarbe über Sättigung > 0,22). Referenz-Code: Branch `prototype/3d-pins`.

Umriss-Format (aus dem Prototyp):

```ts
type Outline = Array<{
  outer: [number, number][];     // x, y ∈ [-0.5, 0.5], Ursprung Mitte, y nach oben
  holes: [number, number][][];
}>;
```

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Nimmt HEIC (direkt vom iPhone) und JPG
- [x] Läuft für einen einzelnen Pin oder für alle Pins aus ihren Original-Fotos
- [x] Liegt ein manuell freigestelltes PNG vor, ersetzt es den Freistell-Schritt; die übrigen Assets werden daraus erzeugt
- [x] Keine farbbasierte Metall-Erkennung auf der Vorderseite
- [x] Die erzeugten Assets werden committet; der Seiten-Build ruft das Skript nicht auf
- [x] **Test-Stelle 2** mit den Prototyp-Fotos (Hamburg, Reykjavík): alle Assets entstehen, Umriss ist gültig (geschlossen, im Wertebereich, keine winzigen Löcher), Hamburg → `gold`, Reykjavík → `silver`, manuelles PNG wird bevorzugt
- [x] Einrichtung der Python-Umgebung ist mit einem Befehl möglich und dokumentiert

## Comments

**2026-10-05 (Agent):** Umgesetzt in `scripts/process-pin/process_pin.py` (Werte aus dem Prototyp übernommen). Einrichten: `npm run setup-python` (legt `.venv/` aus `scripts/process-pin/requirements.txt` mit festen Versionen an). Ausführen: `npm run process-pin -- <slug>` bzw. `-- --all`; Tests (Test-Stelle 2, pytest): `npm run test:python`. Dateien pro Pin in `src/content/pins/<slug>/`: Original als `photo.heic` oder `photo.jpg` (genau eines), optional `cutout-manual.png`; erzeugt werden `cutout.png`, `texture.jpg`, `normal.png`, `outline.json` und `meta.json` (`{"rim": "gold"}` bzw. `"silver"`). Ein manuelles PNG wird unverändert übernommen, seine Löcher bleiben erhalten. Hamburg und Reykjavík sind aus den HEIC-Originalen neu erzeugt (höhere Auflösung als die Prototyp-JPGs, Ergebnis praktisch gleich); die alten `photo.jpg` sind ersetzt. Dokumentiert im Foto-Handbuch (`docs/fotografieren.md`, Abschnitt „Verarbeiten“).
