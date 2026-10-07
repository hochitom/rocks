# hochitom.rocks — Fachsprache

Ein Katalog meiner Pins. Begriffe so, wie sie im Code und auf der Seite verwendet werden.

## Pins

- **Pin**: ein Pin aus meiner Sammlung, eine Datei `src/content/pins/<slug>.md` plus Foto. Hat immer einen Ort (Stadt, Land, Koordinaten) und ein Datum.
- **Kind**: die Art eines Pins, Feld `kind`: `hard-rock` (Standard) oder `side-find`.
- **Hard Rock pin**: Pin aus einem Hard Rock Cafe. Heißt auf der Seite nach seiner Stadt („Hard Rock Cafe Hamburg“). Nur Hard Rock pins zählen in der Statistik.
- **Side find** (Beifang): Pin, der nicht aus einem Hard Rock Cafe stammt, z. B. aus einem Museum. Hat einen **Title** (was auf dem Pin steht, z. B. „Johnny Cash“), unter dem er auf der Seite erscheint. In Galerie, Tour, Globus und Karte ist er dabei, aber erkennbar: Bone-Ring auf Globus und Karte, „Side find“ im Hero.
- **Title**: Name eines Side finds; Pflicht bei Side finds, bei Hard Rock pins nicht erlaubt.
- **Place**: der genaue Ort, Feld `place`: der eigene Name eines Cafés, wenn die Stadt mehrere hat („Universal CityWalk“), oder woher ein Side find stammt („Johnny Cash Museum“).
- **Name** (im Code `pin.name`): wie die Seite einen Pin nennt: die Stadt bei Hard Rock pins, der Title bei Side finds.
- **Trip**: die Reise, auf der ein Pin gesammelt wurde, Feld `trip` (bisher nur „World trip“: alle Pins von 2018 und Bali 2019). Von Hand gesetzt, nicht aus Daten erraten.
- **Slug**: Dateiname und URL eines Pins, für immer stabil. Aus Stadt und Jahr (`vienna-2019`), bei Side finds aus Title und Jahr (`johnny-cash-2018`).

## Missing pins

- **Missing pin**: ein Hard Rock Cafe, das ich besucht habe, ohne einen Pin mitzunehmen. Kein Pin: eigene Datei `src/content/missing/<stadt>-<jahr>.md`, ohne Foto und ohne Detailseite. Hat Ort (Stadt, Land, Koordinaten, ggf. Place), das Datum des ersten Besuchs, optional eine Notiz und `closed`. Nur für Hard Rock Cafes, nie für Orte von Side finds.
- Kaufe ich dort später einen Pin, wird der Missing pin gelöscht. Pin und Missing pin mit gleicher Stadt und gleichem Place lassen den Build scheitern.
- Missing pins zählen nicht in der Statistik.

## Seite

- **Katalog** (`src/lib/catalog.ts`): die einzige Quelle der Seiten für Pin-Daten.
- **Vitrine**: der Schaukasten mit einem Pin im Lampenlicht auf der Detailseite, davor groß die Stadt im Umriss.
- **Messingschild** (Plaque): die Angaben zum Pin unter der Vitrine.
- **Pin-Seite** (`/pins/<slug>/`): Vitrine, direkt darunter „My story“ (nur wenn der Pin Text hat), dann Messingschild, kleine Karte und die Einordnung in die Sammlung, die übrigen Pins des Trips, Older/Newer mit Bild und mehr Pins vom Kontinent.
- **Hero**: oben auf der Startseite der Globus, gedreht zum Café eines Pins; mit Older/Newer und einer Leiste von Vorschaubildern geht es von Pin zu Pin, neuester zuerst.
- **Galerie**: alle Pins auf Filz in einer Liste, neueste zuerst; darüber die Wege zur Karte und zu den Kontinenten.
- **Unfinished business**: Abschnitt unter der Galerie, die Liste der Missing pins.
- **Tour**: alle Pins nach Jahren, wie die Rückseite eines Tour-Shirts; Missing pins als durchgestrichene „cancelled shows“. Pins eines Trips stehen unter seinem Namen, Pins nur mit Jahreszahl gesammelt unter „Sometime in <Jahr>“. Kilometer sind Luftlinie zwischen Stopps, deren Reihenfolge bekannt ist.
- **Globus**: im Hero; jedes Café (und der Ort jedes Side finds) als Markierung, verbunden in Besuchsreihenfolge; Missing pins mit hohler Markierung.
- **Karte** (`/map/`): flache Karte (Leaflet) aller Cafés, nur Länder und US-Bundesstaaten, ohne fremden Kartendienst. Messing-Punkt = Pin, Ring = Missing pin; besuchte Länder heller. Eine Karte pro Café mit seinen Pins, Older/Newer gehen von Café zu Café.
- **Kontinent-Seite** (`/map/<kontinent>/`): eine pro Kontinent mit Pins; links die Karte des Kontinents (bleibt stehen), rechts seine Pins und Missing pins. Hierarchie: Startseite › Karte › Kontinent.
- **Footer**: unter jeder Seite das Ende der Show: die ganze Tour als eine Linie über die Welt, das Plektrum, „Thank you, good night!“ und Stupid facts als Messing-Plaketten (`src/lib/tally.ts`). Preis und Gewicht sind nicht pro Pin erfasst, sondern geschätzt: 12 US$ (≈ 10 €) und 15–20 g pro Pin.
