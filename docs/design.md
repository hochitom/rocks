# Design: hochitom.rocks

Designplan nach dem Skill `frontend-design`. Grundlage: [plan.md](plan.md) (dunkel, rockig, angelehnt an die Hard-Rock-Ästhetik, ohne Logo und Marke).

## Was ist das, für wen, wofür?

- **Gegenstand:** eine private Sammlung von Hard Rock Cafe Pins — kleine Emaille-Objekte mit Goldrand, jedes an eine Stadt und eine Reise gebunden.
- **Publikum:** ich selbst, Freunde und Familie, die einen Link geschickt bekommen.
- **Hauptaufgabe:** die Pins wie echte Objekte zeigen — man soll sie „in die Hand nehmen“ wollen.

## Woher die Bildsprache kommt

Aus der Welt der Pin-Sammler und der Hard Rock Cafes selbst, nicht aus „dunkle Website mit Akzentfarbe“:

- **Die Vitrine:** In Hard Rock Cafes hängen Gitarren und Bühnenkostüme in beleuchteten Vitrinen mit kleinen **Messingschildern**. → Die Detailseite zeigt den Pin im Lichtkegel, die Fakten stehen auf einem Messingschild.
- **Das Pin-Banner:** Sammler stecken ihre Pins auf **Filz-Banner**. → Die Galerie ist kein Kartenraster, sondern Pins, die direkt auf Filz stecken.
- **Das Tour-Shirt:** Auf dem Rücken von Tour-Shirts stehen **Städte und Daten untereinander**. → Die Zeitleiste ist eine Tour-Liste: Jahr für Jahr die Städte, in denen ich war.
- **Der Stadtname:** Jeder Hard-Rock-Pin trägt seine Stadt. → Die Stadt ist überall das typografische Hauptelement.

## Farben

Samt und Messing statt Schwarz und Neon. Die Pins sind das einzig wirklich Bunte auf der Seite.

| Name | Hex | Rolle |
|---|---|---|
| Velvet | `#1C1315` | Seitenhintergrund — dunkler Vitrinensamt, leicht bordeaux, kein neutrales Schwarz |
| Felt | `#2B1B1F` | Flächen: Pin-Banner, Kartenhintergrund unter Popups |
| Brass | `#C9A24B` | Messing: Plaketten, Rahmen, Links, Fokus-Ring — der einzige Akzent |
| Bone | `#EDE3D1` | Text — gealtertes Elfenbein wie ein Gitarrensattel |
| Smoke | `#9A8C84` | gedämpfter Text: Länder, Daten, Hinweise |
| Lamp | `#FFE7B8` | nur als Lichtkegel-Verlauf hinter Pins, nie als Fläche |

Kontrast (nachgerechnet, WCAG): Bone auf Velvet 14,3 : 1 (auf Felt 12,9), Smoke 5,6 : 1 (auf Felt 5,0), Brass 7,6 : 1 (auf Felt 6,8) — alle über AA für normalen Text.

## Schrift

Zwei klar verschiedene Familien, beide von Google Fonts:

- **Big Shoulders Display** (Black/ExtraBold) — schmal, industriell, wie Tour-Poster-Drucke. Nur für **Stadtnamen und Jahreszahlen**, groß und als Bildelement eingesetzt (z. B. riesig und angeschnitten hinter dem Hero-Pin, in Messing-Kontur auf Samt).
- **Newsreader** — Serif für alles andere: Fließtext, Geschichten, Navigation, Fakten. Warm, gut lesbar, passt zu persönlichen Erinnerungen.

Schriftgrade (Basis 18 px, Verhältnis ≈ 1,333):

| Stufe | Größe | Einsatz |
|---|---|---|
| Hero-Stadt | clamp(6rem, 22vw, 18rem) | Stadtname hinter dem Hero-Pin |
| H1 | 4.2rem | Stadt auf der Detailseite |
| H2 | 2.4rem | Jahreszahl in der Zeitleiste |
| H3 | 1.33rem | Städte in Galerie und Tour-Liste |
| Text | 1rem / 18 px, Zeilenhöhe 1.6 | Geschichten, max. ~66 Zeichen pro Zeile |
| Klein | 0.83rem | Land, Datum |

Regeln: keine Großbuchstaben-Labels, keine Überschriften mit einem farbig hervorgehobenen Wort, keine kleinen Labels über Abschnitten. Zahlen in der Tour-Liste mit Tabellenziffern.

## Layout

Text grundsätzlich **linksbündig**. Zentriert ist nur, was in einer Vitrine steht: der Hero-Pin und der Pin auf der Detailseite.

**Startseite**

```
┌──────────────────────────────────────────────┐
│ hochitom.rocks            Pins  Map  Tour    │
│                                              │
│  HAMBURG  (riesig, Messing-Kontur, angeschnitten)
│              ╭───────╮                       │
│              │ 3D-Pin│  ← im Lichtkegel      │
│              ╰───────╯                       │
│  hochitom's Hard Rock Cafe pins, collected   │
│  since 2009: 42 pins from 18 countries.      │
├──────────────────────────────────────────────┤
│  All  Europe  North America  Asia …          │
│ ░░░░░░░░░░░░░ Filz ░░░░░░░░░░░░░░░░░░░░░░░░░ │
│   (pin)     (pin)     (pin)     (pin)        │
│  Hamburg  Reykjavík   Vienna    Prague       │
│   (pin)     (pin)     (pin)     (pin)        │
└──────────────────────────────────────────────┘
```

Die Statistik ist ein Satz, keine Zahlenreihe. Die Galerie hat keine Kacheln mit Rahmen oder Schatten — die Pins stecken direkt auf einer Filz-Textur, darunter nur der Stadtname.

**Detailseite**

Dieselbe Vitrine wie auf der Startseite: Der riesige Stadtname in Messing-Kontur steht hinter dem 3D-Pin und ist die Hauptüberschrift (`h1`) der Seite. Weil der Pin den Namen teilweise verdeckt, trägt das Messingschild eine gut lesbare Titelzeile („Hard Rock Cafe Hamburg“) wie das Schild unter einem Museumsexponat. Darunter stehen Schild und Geschichte nebeneinander.

```
┌──────────────────────────────────────────────┐
│ hochitom.rocks            Pins  Map  Tour    │
│ Back to all pins                             │
│  HAMBURG  (riesig, Messing-Kontur = h1)      │
│              ╭───────╮                       │
│              │ 3D-Pin│  ← im Lichtkegel      │
│              ╰───────╯                       │
├──────────────────────────────────────────────┤
│ ┌─ Messingschild ─────┐  Geschichte in       │
│ │ Hard Rock Cafe      │  Newsreader, max.    │
│ │ Hamburg             │  66 Zeichen pro      │
│ │ Country   Germany   │  Zeile               │
│ │ Collected 14 June … │                      │
│ └─────────────────────┘                      │
│  Previous pin: Vienna      Next pin: Prague  │
└──────────────────────────────────────────────┘
```

Auf dem Handy rückt der Stadtname an den oberen Rand der Vitrine (sonst verdeckt ihn der Pin ganz), der Pin überlappt ihn nur unten; darunter Schild, dann Geschichte. Dasselbe gilt für den Hero der Startseite.

**Tour (Zeitleiste)**

```
  2019                                  3 pins
  Jun 14   Hamburg        Germany
  Aug 02   Reykjavík      Iceland
  Dec 20   Vienna         Austria

  2015                                  1 pin
           Prague         Czechia
```

Wie die Rückseite eines Tour-Shirts: Jahreszahl groß in Big Shoulders, darunter die Städte in Spalten. Unbekannter Tag/Monat bleibt einfach leer.

**Karte:** Vollbild, Mapbox `dark-v11`, Marker als kleine Messing-Punkte, Cluster als Messing-Kreis mit Zahl. Popup auf Felt mit Pin-Foto und Stadt.

## Prinzipien

1. **Die Pins sind das einzig Bunte.** Die Oberfläche bleibt Samt, Messing und Elfenbein.
2. **Die Kühnheit steckt an einer Stelle:** in der Vitrine — der 3D-Pin im Lichtkegel vor seinem riesigen Stadtnamen, auf der Startseite und auf jeder Detailseite. Pro Seite bleibt sie das einzige laute Element, alles andere ist ruhig.
3. **Bewegung nur bei den Pins:** Der Hero-Pin schwenkt, der Detail-Pin dreht sich, Galerie-Pins neigen sich beim Hover. Keine Einblend-Animationen für Abschnitte. Bei „Bewegung reduzieren“ steht alles still.
4. **Sammler-Vokabular statt Web-Vokabular:** Vitrine, Messingschild, Filz-Banner, Tour-Liste.
5. **Texte sind schlicht und persönlich**, auf Englisch, in Satzform: „Next pin: Prague“ statt Pfeil-Buttons, „No pins from Asia yet.“ statt eines leeren Rasters.

## Abgleich mit typischen Standard-Looks

Geprüft gegen die Muster, die generierte Seiten verraten — und was ich deshalb geändert habe:

- **„Fast-Schwarz mit einem grellen Akzent“** lag nahe, weil der Auftrag „dunkel und rockig“ lautet. → Statt `#111` und Neonrot: bordeaux getönter Samt und Messing als einziger Akzent, abgeleitet aus Vitrine und Pin-Rändern. Rot kommt nur noch in den Pins selbst vor.
- **Statistik-Zeile mit Mittelpunkten** („42 pins · 18 countries · since 2009“) stand so im Plan. → Ersetzt durch einen ganzen Satz.
- **Karten-Raster mit Schatten** für die Galerie wäre der Standard gewesen. → Pins direkt auf Filz, ohne Rahmen.
- **Nummerierte Abschnitte, Großbuchstaben-Labels, Monospace für Daten, `→` an Links** → alle bewusst weggelassen. Die Zeitleiste ist tatsächlich eine Abfolge, deshalb dort Jahreszahlen als Struktur.
- **Einblend-Animationen pro Abschnitt** → keine; Bewegung gehört allein den Pins.
- Ausnahme mit Absicht: Auf dem Messingschild trennt ein Mittelpunkt „Bought · City pin“, weil es dort wirklich zwei gleichrangige Angaben auf einer Gravur-Zeile sind.

## Qualitätsboden

Ohne es extra zu zeigen: läuft auf dem Handy, sichtbarer Fokus-Ring in Messing, Alternativtexte für jeden Pin („Hard Rock Cafe Hamburg pin“), „Bewegung reduzieren“ wird respektiert, alle Kontraste über AA.

## Erkenntnisse aus dem Mockup

Mockup auf Branch `prototype/design` (`a69b65a`, `python3 -m http.server 5174 -d prototype/design`). Was sich beim Bauen und Prüfen geändert hat:

- **Detail-Pin dreht sich nicht stur um 360°.** Bei Dauerdrehung zeigt er die Hälfte der Zeit Kante oder Rückseite, und der erste Eindruck kann eine Kante sein. Stattdessen: Er schaut meist nach vorne und schwenkt leicht, dann folgt eine sanft beschleunigte ganze Drehung (Zyklus ≈ 12 s).
- **Tour als zwei Spalten:** Jahreszahl links (mit Anzahl darunter), Städte rechts — wie auf einem Tour-Shirt. Mit je einer großen Jahreszahl über jeder Stadt wirkte die Seite bei 1–2 Pins pro Jahr leer. Auf dem Handy steht das Jahr über den Städten.
- **Noch nicht fotografierte Pins** erscheinen als leise, gestrichelte leere Stelle auf dem Filz. Messingfarbene Platzhalter haben die echten Pins überstrahlt.
- **Filz-Struktur** braucht etwas mehr Rauschen, sonst unterscheidet sich das Banner kaum vom Samt.
- **Messingschild** funktioniert: dunkle „gravierte“ Schrift auf Messingverlauf mit zwei Nieten.
- Dunkle Pin-Fotos (Wikinger) wirken auf Samt noch dunkler — ein Grund mehr, hell zu fotografieren.
