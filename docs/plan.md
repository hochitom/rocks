# hochitom.rocks — Plan

Ergebnis der Grilling-Session vom 2026-10-05.

## Zweck

Öffentlicher, englischsprachiger Katalog meiner Hard Rock Cafe Pins — für mich selbst und zum Herzeigen für Freunde und Familie.

- Weniger als 100 Pins, 1–2 neue pro Jahr
- Es wird nur gezeigt, was ich habe: keine Wunschliste, keine Liste fehlender Cafes
- Keine Community-Features (kein Tauschen, kein Kontakt)

## Datenmodell

Nur Pins, keine separate Cafe-Liste (nur ein Cafe hat 2 Pins). Ein Pin = eine Markdown-Datei mit Frontmatter; die Notiz ist der Body.

| Feld | Pflicht | Anmerkung |
|---|---|---|
| Stadt | ja | |
| Land | ja | Kontinent wird für den Galerie-Filter abgeleitet |
| Koordinaten | ja | automatisch per Mapbox-Geocoding beim Anlegen |
| Datum | ja | Jahr ist Pflicht, Monat/Tag optional (`2015`, `2015-06`, `2015-06-12`) |
| Foto | ja | nur Vorderseite |
| Cafe-Name | nein | für Städte mit mehreren Cafes, z. B. „Orlando – Universal CityWalk“ |
| Geschlossen | nein | ja/nein |
| Serie | nein | Freitext, z. B. „Guitar“, „Limited Edition 2019“ |
| Herkunft | nein | gekauft / getauscht / geschenkt |
| Notiz | nein | Markdown-Body |

Kein Preis bzw. Wert.

**URL-Schema:** `/pins/<stadt>-<jahr>`, z. B. `/pins/vienna-2019`. Bei Kollision ein Suffix anhängen.

## Seiten

- **Startseite:** Hero mit zufälligem, animiertem 3D-Pin und Statistik („42 pins · 18 countries · since 2009“), darunter die Galerie
- **Galerie:** Raster aus freigestellten Pin-Fotos, neueste zuerst, Filter nach Kontinent, keine Suche. Beim Hover ein CSS-Neige-/Glanz-Effekt (kein WebGL)
- **Karte:** Mapbox, Style `dark-v11` (eigener Style später). Clustering beim Rauszoomen; bei identischen Koordinaten ein Marker mit Popup für alle Pins
- **Zeitleiste:** nach Datum, gruppiert nach Jahr
- **Detailseite pro Pin:** echtes 3D-Modell (dreht sich langsam, per Ziehen drehbar), großes Foto, Notiz, Cafe-Infos. Eigenes Vorschaubild für Messenger und soziale Netze (freigestellter Pin auf dunklem Hintergrund mit Stadtname, beim Build erzeugt)
- **Imprint & Privacy:** im Footer — Offenlegung nach § 25 MedienG (Name, Wohnort) und Datenschutzhinweis (Mapbox überträgt IP-Adressen in die USA; Analytics)

## 3D-Pins

- **Ansatz (b):** Aus dem Umriss des freigestellten Fotos wird ein flacher Körper (wenige mm) extrudiert: Foto vorne, Metallkante, goldene Rückseite mit Nadel. Export als `.glb`, Darstellung mit Three.js
- **Mögliche Ausbaustufe (c):** KI-Tiefenkarte für plastisches Relief
- Echtes 3D nur auf der Detailseite und im Hero, nicht in der Galerie (Performance auf dem Handy)
- **Rückfall-Lösung:** ohne WebGL das freigestellte Foto mit CSS-Neige-Effekt
- **`prefers-reduced-motion`:** keine automatische Rotation, Ziehen bleibt möglich

## Workflow: neuen Pin anlegen

1. Pin auf einfarbigem Untergrund fotografieren
2. `npm run new-pin` fragt Stadt, Land, Datum usw. ab, sucht die Koordinaten per Mapbox-Geocoding und legt die Markdown-Datei an
3. Das Skript stellt das Foto lokal frei (`rembg`) und erzeugt das `.glb`
4. Freigestelltes PNG und `.glb` werden mit committet; der Build erzeugt nichts davon neu
5. Ist die Freistellung schlecht, kann ein manuell freigestelltes PNG abgelegt werden; dann wird nur das 3D-Modell neu erzeugt

Die Daten werden neu erfasst: Es gibt noch keine Liste und keine Fotos.

## Design

Dunkel, rockig, angelehnt an die Hard-Rock-Ästhetik — aber **ohne** Hard-Rock-Logo oder Markenzeichen (Markenrecht).

## Infrastruktur

- **Repo:** GitHub, öffentlich
- **Hosting:** Netlify, statischer Build, automatischer Deploy bei jedem Push
- **Domain:** `hochitom.rocks` (registriert, Nameserver `domaintechnik.at`). DNS bleibt beim Registrar: A-Eintrag der Hauptdomain auf den Netlify-Load-Balancer, CNAME für `www`
- **Karte:** Mapbox-Account (lege ich selbst an); öffentlicher Token, auf `hochitom.rocks` beschränkt; Free Tier reicht
- **Analytics:** Cloudflare Web Analytics (cookielos, kein Banner)

## Offen

- **Framework:** Entscheidung erst nach dem 3D-Prototyp. Favorit ist Astro (Content-Collections mit Schema-Prüfung, Islands für Three.js-Viewer und Mapbox-Karte, Bildoptimierung). Alternativen: Eleventy, SvelteKit (statisch)

## Nächster Schritt

`/prototype` für die 3D-Frage: 2–3 echte Pin-Fotos auf einfarbigem Untergrund → Freistellen mit `rembg` → Extrusion des Umrisses → Darstellung in Three.js. Danach bewerten, ob Ansatz (b) reicht oder (c) nötig ist, und das Framework festlegen.
