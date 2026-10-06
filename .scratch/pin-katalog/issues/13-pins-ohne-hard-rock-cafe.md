# 13: Pins, die nicht aus einem Hard Rock Cafe sind

**Status:** needs-triage

**Type:** grilling

Die Sammlung enthält jetzt zwei Pins, die nicht aus einem Hard Rock Cafe stammen:

- `cleveland-2018`: Rock & Roll Hall of Fame, Cleveland (Museumsshop)
- `nashville-2018`: Johnny Cash (Official Merchandise), vermutlich Johnny Cash Museum, Nashville

Vorläufig sind sie wie Cafe-Pins erfasst, mit dem Ort in `cafeName`. Die Seite behandelt aber jeden Pin als Hard Rock Cafe Pin, deshalb stimmt einiges nicht:

- Messingschild (`src/components/Plaque.astro`): „Hard Rock Cafe Cleveland“, darunter „Cafe: Rock & Roll Hall of Fame“
- Alt-Texte (`src/lib/catalog.ts`): „Hard Rock Cafe Cleveland pin“
- Beschreibung der Detailseite (`src/pages/pins/[slug].astro`): „The Hard Rock Cafe Cleveland pin …“
- Globus (`src/lib/catalog-globe.ts`, `src/scripts/globe.ts`): die Orte zählen als „Hard Rock Cafes“
- Statistik und Texte der Startseite: „Hard Rock Cafe pins“

## Zu klären

- Gehören solche Pins in denselben Katalog, oder in einen eigenen Bereich („Beifang“, „Andere Pins“)?
- Neues Feld im Frontmatter, z. B. `venue: "Rock & Roll Hall of Fame"` statt `cafeName`, oder `kind: cafe | other`?
- Wie sieht das Messingschild aus (Titel = Ort statt „Hard Rock Cafe <Stadt>“)?
- Erscheinen sie auf dem Globus und in der Tour, und wenn ja, sichtbar anders (andere Markierung)?
- Zählen sie in der Statistik („n Cafés, m Länder“) mit?
- Galerie: gleiche Vitrine oder abgesetzt?

## Comments
