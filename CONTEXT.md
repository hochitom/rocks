# hochitom.rocks — Fachsprache

Ein Katalog meiner Pins. Begriffe so, wie sie im Code und auf der Seite verwendet werden.

## Pins

- **Pin**: ein Pin aus meiner Sammlung, eine Datei `src/content/pins/<slug>.md` plus Foto. Hat immer einen Ort (Stadt, Land, Koordinaten) und ein Datum.
- **Kind**: die Art eines Pins, Feld `kind`: `hard-rock` (Standard) oder `side-find`.
- **Hard Rock pin**: Pin aus einem Hard Rock Cafe. Heißt auf der Seite nach seiner Stadt („Hard Rock Cafe Hamburg“). Nur Hard Rock pins zählen in der Statistik und erscheinen in der Vitrine der Startseite.
- **Side find** (Beifang): Pin, der nicht aus einem Hard Rock Cafe stammt, z. B. aus einem Museum. Hat einen **Title** (was auf dem Pin steht, z. B. „Johnny Cash“), unter dem er auf der Seite erscheint. In Galerie, Tour und Globus ist er dabei, aber erkennbar: eigener Filter, Bone-Ring auf dem Globus.
- **Title**: Name eines Side finds; Pflicht bei Side finds, bei Hard Rock pins nicht erlaubt.
- **Place**: der genaue Ort, Feld `place`: der eigene Name eines Cafés, wenn die Stadt mehrere hat („Universal CityWalk“), oder woher ein Side find stammt („Johnny Cash Museum“).
- **Name** (im Code `pin.name`): wie die Seite einen Pin nennt: die Stadt bei Hard Rock pins, der Title bei Side finds.
- **Slug**: Dateiname und URL eines Pins, für immer stabil. Aus Stadt und Jahr (`vienna-2019`), bei Side finds aus Title und Jahr (`johnny-cash-2018`).

## Missing pins

- **Missing pin**: ein Hard Rock Cafe, das ich besucht habe, ohne einen Pin mitzunehmen. Kein Pin: eigene Datei `src/content/missing/<stadt>-<jahr>.md`, ohne Foto und ohne Detailseite. Hat Ort (Stadt, Land, Koordinaten, ggf. Place), das Datum des ersten Besuchs, optional eine Notiz und `closed`. Nur für Hard Rock Cafes, nie für Orte von Side finds.
- Kaufe ich dort später einen Pin, wird der Missing pin gelöscht. Pin und Missing pin mit gleicher Stadt und gleichem Place lassen den Build scheitern.
- Missing pins zählen nicht in der Statistik.

## Seite

- **Katalog** (`src/lib/catalog.ts`): die einzige Quelle der Seiten für Pin-Daten.
- **Vitrine**: der Schaukasten mit einem Pin im Lampenlicht, davor groß die Stadt im Umriss.
- **Messingschild** (Plaque): die Angaben zum Pin unter der Vitrine.
- **Galerie**: alle Pins auf Filz, filterbar nach Kontinent und nach Side finds.
- **Unfinished business**: Abschnitt unter der Galerie, die Liste der Missing pins.
- **Tour**: alle Pins nach Jahren, wie die Rückseite eines Tour-Shirts; Missing pins als durchgestrichene Tourstopps.
- **Globus**: jedes Café (und der Ort jedes Side finds) als Markierung, verbunden in Besuchsreihenfolge; Missing pins mit hohler Markierung.
