# Pins fotografieren — Handbuch

Aus jedem Foto entstehen automatisch das freigestellte Bild für die Galerie und der 3D-Pin für die Detailseite. Das Ergebnis kann nie besser sein als das Foto: Der 3D-Prototyp hat gezeigt, dass die Technik zuverlässig funktioniert und **das Foto die eigentliche Schwachstelle ist**. Der Hamburg-Pin (hell, gleichmäßig) sah sofort gut aus, der Wikinger-Pin (zu dunkel) wirkte matschig.

## Was du brauchst

- iPhone (oder anderes Handy)
- Einfarbiger, **matter** Untergrund: ein Bogen hellgraues Papier oder Karton. Hellgrau hat im Prototyp bei Gold und Silber sauber funktioniert
- Ein Stück Schaumstoff, Styropor oder dicker Karton, in das du die Nadel stecken kannst
- Ein Mikrofasertuch
- Tageslicht am Fenster (keine direkte Sonne) — oder zwei gleiche Lampen
- Optional: ein Bogen Backpapier oder ein weißes Tuch als Diffusor

## Aufbau

1. **Verschluss abnehmen und Nadel in den Schaumstoff stecken**, mit dem Papier darüber (Nadel durchs Papier stechen). So liegt der Pin **flach** auf. Liegt er schräg auf seinem Verschluss, wird der Umriss verzerrt und der 3D-Pin sieht schief aus.
2. **Pin abwischen.** Staub und Fingerabdrücke sieht man auf der großen Detailseite deutlich.
3. **Licht von der Seite, weich und gleichmäßig:** Am besten neben einem Fenster mit bedecktem Himmel, oder zwei Lampen links und rechts schräg von oben. Direktes Licht von vorne erzeugt Spiegelungen auf Gold und Emaille; ein einzelnes hartes Licht wirft Schatten, die beim Freistellen als Teil des Pins erkannt werden. Wenn es spiegelt: Backpapier zwischen Licht und Pin halten.

## Fotografieren

1. **Gerade von oben**: Das Handy liegt parallel zum Pin, die Kamera genau über der Mitte. Die Wasserwaage in der iPhone-Kamera hilft (Einstellungen → Kamera → Wasserwaage einschalten; beim Blick nach unten erscheinen zwei Fadenkreuze, die sich decken, wenn das Handy waagrecht ist).
2. **Mit Zoom (2× oder 3×) aus 20–30 cm Abstand**, nicht mit 1× ganz nah dran. Das vermeidet Verzerrung und dass sich das Handy im Gold spiegelt.
3. **Der Pin füllt etwa die Hälfte des Bildes.** Rundherum Rand lassen, nichts abschneiden — auch keine abstehenden Teile wie Hörner oder Axt.
4. **Pin aufrecht ausrichten**, so wie er getragen wird (Schrift waagrecht).
5. **Fokus und Belichtung festsetzen:** Lange auf den Pin tippen (AE/AF-Sperre). **Dann die Belichtung leicht nach oben ziehen**, bis die Emaille-Farben kräftig und die hellen Stellen gerade noch nicht ausgefressen sind. Der Wikinger im Prototyp war zu dunkel.
6. **Kein Blitz**, kein Porträtmodus, keine Filter.
7. Lieber **2–3 Fotos** machen und das schärfste behalten.

## Prüfen, bevor du weitermachst

Foto am Handy groß zoomen:

- [ ] Scharf, auch am Rand des Pins?
- [ ] Hell genug — die dunkelsten Emaille-Flächen sind noch erkennbar?
- [ ] Keine hellen Spiegelflecken auf Gold oder Emaille?
- [ ] Kein Schatten neben dem Pin?
- [ ] Pin liegt flach und gerade, nichts angeschnitten?
- [ ] Kein Staub, keine Fingerabdrücke?

## Ablegen

- Format egal: HEIC direkt vom iPhone passt, das Skript wandelt um.
- Dateiname egal, er wird beim Anlegen des Pins (`npm run new-pin`) zugeordnet.
- Das Original-Foto aufheben. Ändert sich später etwas an der Verarbeitung, wird alles aus den Originalen neu erzeugt.

## Verarbeiten

Die Foto-Verarbeitung ist ein Python-Skript (`scripts/process-pin/`), das nur lokal läuft — nie im Seiten-Build. Die erzeugten Dateien werden committet.

**Einrichten (einmalig, Python ≥ 3.11):**

```sh
npm run setup-python   # legt .venv/ an und installiert scripts/process-pin/requirements.txt
```

Beim ersten Freistellen lädt `rembg` das Modell `isnet-general-use` (≈ 180 MB) nach `~/.rembg/models/`.

**Dateien pro Pin** in `src/content/pins/<slug>/`:

| Datei | Wer | Inhalt |
|---|---|---|
| `photo.heic` oder `photo.jpg` (auch `.heif`, `.jpeg`) | du | Original-Foto, genau eines |
| `cutout-manual.png` | du, optional | manuell freigestellter Pin; ersetzt das automatische Freistellen |
| `cutout.png` | Skript | freigestellter Pin, zentriert auf 1024 × 1024 px, transparent |
| `texture.jpg` | Skript | Textur für die 3D-Vorderseite, Farbe über den Rand hinaus verschmiert |
| `normal.png` | Skript | Relief-Karte |
| `outline.json` | Skript | Umriss mit Löchern, Koordinaten in [-0,5; 0,5], y nach oben |
| `meta.json` | Skript | Randfarbe: `{"rim": "gold"}` oder `{"rim": "silver"}` |

**Ausführen:**

```sh
npm run new-pin                       # neuen Pin anlegen: fragt alles ab, kopiert das Foto, startet die Verarbeitung
npm run process-pin -- hamburg-2019   # ein Pin (mehrere Slugs möglich)
npm run process-pin -- --all          # alle Pins aus ihren Originalen
npm run test:python                   # Tests der Foto-Verarbeitung
```

Liegt `cutout-manual.png` im Ordner, wird es so übernommen, wie es ist: Löcher bleiben erhalten, nichts wird aufgefüllt. Das Original-Foto bleibt trotzdem liegen.

## Wenn das Ergebnis nicht passt

| Problem | Ursache | Lösung |
|---|---|---|
| Teile des Pins fehlen im freigestellten Bild | Untergrund hat ähnliche Farbe wie der Pin | Anderen Untergrund nehmen (z. B. dunkelgrau bei weißen/silbernen Pins) |
| Schatten oder Untergrund-Reste am Rand | Hartes Licht von einer Seite | Licht weicher machen, zweite Lichtquelle |
| 3D-Pin wirkt dunkel und matschig | Foto unterbelichtet | Belichtung beim Fotografieren hochziehen |
| Helle Flecken auf der Vorderseite | Spiegelung | Diffusor, Licht weiter zur Seite, mit Zoom von weiter weg |
| Umriss im 3D-Modell wirkt schief | Pin lag schräg auf dem Verschluss | Nadel in Schaumstoff stecken, gerade von oben fotografieren |
| Lücke im Pin wird gefüllt (oder umgekehrt) | Die Freistellung füllt kleine Löcher automatisch | Manuell freigestelltes PNG ablegen (z. B. iPhone Fotos-App: Motiv lange drücken → „Kopieren“) |
