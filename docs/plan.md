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

Durch den Prototyp bestätigt (Branch `prototype/3d-pins`, Commit `583e13a`).

- **Detailseite und Hero:** Aus dem Umriss des freigestellten Fotos wird ein flacher Körper (wenige mm) extrudiert: Foto vorne, Metallkante, Rückseite mit Pin-Verschluss. Dazu eine Relief-Karte (Normal Map), die aus der Helligkeit des Fotos abgeleitet wird, und ein dezenter Emaille-Glanz. Darstellung mit Three.js
- **Galerie:** nur das freigestellte Foto mit CSS-Neige-/Glanz-Effekt, kein WebGL (Performance auf dem Handy). Dasselbe dient als Rückfall-Lösung ohne WebGL
- **Modell wird im Browser erzeugt, keine `.glb`-Dateien:** Pro Pin werden nur `outline.json` (4–8 KB), `texture.jpg` (100–250 KB) und die Relief-Karte committet. Eine exportierte `.glb` wäre 1,7–2,3 MB groß, weil die Texturen als PNG eingebettet werden. Außerdem gelten Änderungen am Aussehen so sofort für alle Pins
- **Randfarbe:** wird aus dem Rand des Fotos bestimmt und wählt zwischen Gold und Altsilber; das funktioniert zuverlässig
- **Keine automatische Metall-Erkennung auf der Vorderseite:** Getestet und verworfen, weil gelbe Emaille und schattiertes Weiß als Metall erkannt werden, echtes dunkles Metall nicht. Die Vorderseite bekommt einheitlich Emaille-Glanz
- **Freistellung:** `rembg` mit Modell `isnet-general-use`. Kleine Löcher in der Maske werden gefüllt, der Umriss wird geglättet (sonst Streifen an der Seitenwand)
- **Glanz der Vorderseite niedrig halten:** Die flache Fläche spiegelt das Hauptlicht überall gleichzeitig, sonst bleicht das Foto aus
- **Bewegung:** langsames Drehen um 360° oder Schwenken um ±30°, per Ziehen drehbar. Bei `prefers-reduced-motion` keine automatische Bewegung, Ziehen bleibt möglich
- **Fotos sind die Schwachstelle:** Zu dunkle Fotos wirken matschig. Siehe [Foto-Handbuch](fotografieren.md)
- Die KI-Tiefenkarte für echtes Relief (ehemals Ansatz c) ist nicht nötig

## Workflow: neuen Pin anlegen

1. Pin nach dem [Foto-Handbuch](fotografieren.md) fotografieren
2. `npm run new-pin` fragt Stadt, Land, Datum usw. ab, sucht die Koordinaten per Mapbox-Geocoding und legt die Markdown-Datei an
3. Das Skript stellt das Foto lokal frei (`rembg`) und erzeugt freigestelltes PNG, Textur, Umriss, Relief-Karte und Randfarbe
4. Diese Dateien werden mit committet; der Build erzeugt nichts davon neu
5. Ist die Freistellung schlecht, kann ein manuell freigestelltes PNG abgelegt werden; dann werden nur die übrigen Dateien daraus neu erzeugt

Die Daten werden neu erfasst: Es gibt noch keine Liste und keine Fotos.

## Design

Dunkel, rockig, angelehnt an die Hard-Rock-Ästhetik — aber **ohne** Hard-Rock-Logo oder Markenzeichen (Markenrecht).

## Infrastruktur

- **Repo:** GitHub, öffentlich
- **Hosting:** Netlify, statischer Build, automatischer Deploy bei jedem Push
- **Domain:** `hochitom.rocks` (registriert, Nameserver `domaintechnik.at`). DNS bleibt beim Registrar: A-Eintrag der Hauptdomain auf den Netlify-Load-Balancer, CNAME für `www`
- **Karte:** Mapbox-Account (lege ich selbst an); öffentlicher Token, auf `hochitom.rocks` beschränkt; Free Tier reicht
- **Analytics:** Cloudflare Web Analytics (cookielos, kein Banner)

## Framework

**Astro**, entschieden nach dem 3D-Prototyp: Content-Collections mit Schema-Prüfung für die Pins, Islands für Three.js-Viewer und Mapbox-Karte, während Galerie und Zeitleiste ohne JavaScript auskommen, dazu eingebaute Bildoptimierung.

## Nächster Schritt

Spec schreiben (`/to-spec`), in Tickets aufteilen (`/to-tickets`) und umsetzen (`/implement`). Parallel dazu die Pins nach dem [Foto-Handbuch](fotografieren.md) fotografieren.
