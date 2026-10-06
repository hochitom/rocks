# Spec: hochitom.rocks — Katalog meiner Hard Rock Cafe Pins

Status: ready-for-agent

> Erstellt am 2026-10-05.
> Grundlage: [plan.md](../../docs/plan.md), [design.md](../../docs/design.md), [fotografieren.md](../../docs/fotografieren.md), 3D-Prototyp auf Branch `prototype/3d-pins` (`583e13a`), Design-Mockup auf Branch `prototype/design` (`096ba83`, inkl. Globus).

## Problem Statement

Ich sammle Hard Rock Cafe Pins (weniger als 100 Stück, 1–2 neue pro Jahr), aber die Sammlung existiert nur in einer Schachtel. Ich habe keinen Überblick, wo und wann ich welchen Pin bekommen habe, und kann sie Freunden und Familie nicht zeigen — schon gar nicht so, dass man die Pins wirklich „in der Hand“ hat. Eine Liste in einer Tabelle wäre trocken; eine fertige Sammler-Plattform passt nicht zu meinem persönlichen Blick auf die Sammlung.

## Solution

Eine eigene, öffentliche, englischsprachige Website unter `hochitom.rocks` im dunklen, rockigen Look. Sie zeigt jeden Pin freigestellt in einer Galerie, auf einem drehbaren Globus und auf einer Zeitleiste. Jeder Pin hat eine eigene Seite mit einem animierten 3D-Modell, das automatisch aus einem einzigen Foto der Vorderseite entsteht, dazu Ort, Datum und die Geschichte dahinter. Neue Pins lege ich mit einem Befehl an: Er fragt die Daten ab, findet die Koordinaten selbst und verarbeitet das Foto. Danach genügt ein Push, und die Seite ist aktualisiert.

## User Stories

### Besucher: Galerie und Startseite

1. As a visitor, I want to see an eye-catching animated 3D pin when I open the homepage, so that I immediately understand what the site is about.
2. As a visitor, I want the homepage's 3D pin to be a different pin on each visit, so that coming back feels fresh.
3. As a visitor, I want to see a short stat line (number of pins, number of countries, year of the first pin), so that I grasp the size of the collection at a glance.
4. As a visitor, I want to see all pins as a grid of cut-out photos on a dark background, so that the collection looks like a showcase.
5. As a visitor, I want the newest pins to appear first in the gallery, so that I see what's new.
6. As a visitor, I want to filter the gallery by continent, so that I can focus on a region.
7. As a visitor, I want the gallery to work without JavaScript (all pins visible, filter just absent), so that the core content is always accessible.
8. As a visitor, I want a pin in the gallery to tilt and catch a glint of light when I hover over it, so that it feels like a physical object.
9. As a visitor on a phone, I want the gallery to load fast and scroll smoothly, so that browsing on the go is pleasant.
10. As a visitor, I want each gallery tile to show the city (and country), so that I know which pin I'm looking at without opening it.
11. As a visitor, I want closed cafes to be marked as such, so that I know which pins come from cafes that no longer exist.
12. As a visitor, I want to click a pin to open its detail page, so that I can see more.

### Besucher: Detailseite

13. As a visitor, I want a detail page per pin with a stable, readable URL (e.g. `/pins/hamburg-2019`), so that I can share it.
14. As a visitor, I want to see the pin as a 3D model that faces me, sways gently and now and then turns all the way around, so that it looks like a real object without hiding its front.
15. As a visitor, I want to rotate the 3D pin by dragging (mouse or touch), so that I can look at it from every side, including the back with its clasp.
16. As a visitor, I want the auto-rotation to pause while I interact and resume after a moment, so that it doesn't fight my input.
17. As a visitor, I want the 3D pin's enamel to catch light with subtle relief, and its rim and back to look like gold or antique silver matching the real pin, so that it looks convincing.
18. As a visitor with "reduce motion" enabled, I want the 3D pin not to move by itself, so that the page respects my settings; dragging still works.
19. As a visitor whose browser has no WebGL, I want to see the cut-out photo with the tilt effect instead, so that the page still works.
20. As a visitor, I want to see city, country, cafe name (if any), date (as precise as known), series, how the pin was obtained, and the closed flag, so that I know the pin's context.
21. As a visitor, I want to read the personal story behind a pin, so that the collection is more than a list.
22. As a visitor, I want to jump from the detail page to the pin's cafe on the globe, so that I can see where it is.
23. As a visitor, I want to go to the previous/next pin from the detail page, so that I can browse without returning to the gallery.
24. As a visitor, I want the 3D model to load without blocking the page text, so that I can read while it loads.

### Besucher: Karte (Globus)

25. As a visitor, I want an abstract globe with dotted continents that marks every cafe I have a pin from, so that I see where the collection comes from at a glance.
26. As a visitor, I want to turn the globe by dragging (mouse or touch) and zoom with the wheel or a pinch, so that I can explore every part of the world.
27. As a visitor, I want pins with identical coordinates (two pins from the same cafe) to appear as one marker with a count whose card lists both, so that nothing overlaps.
28. As a visitor, I want picking a marker to turn that cafe to the front and show a card with the pin photo, city, date and a link to the detail page, so that I can go from the globe to the pin.
29. As a visitor, I want the globe to open turned to a specific cafe with its card open when I come from a detail page, so that the jump is meaningful.
29a. As a visitor, I want a line that connects the cafes in the order they were visited, so that I can follow the collection's journey around the world.
29b. As a visitor, I want the markers to be reachable by keyboard and announced by screen readers, so that the globe isn't mouse-only.

### Besucher: Zeitleiste

30. As a visitor, I want a timeline of all pins grouped by year (newest year first), so that I see the collection grow over time.
31. As a visitor, I want pins whose date is only known as a year (or year and month) to be placed correctly in the timeline, so that imprecise dates don't break the order.
32. As a visitor, I want to see the count per year, so that I see busy travel years.

### Besucher: Allgemein

33. As a visitor, I want a consistent dark, rock-inspired design across all pages, so that the site feels like one piece.
34. As a visitor, I want navigation between Home, Map (globe) and Timeline on every page, so that I never get stuck.
35. As a visitor, I want the site to be usable on phone, tablet and desktop, so that I can show it anywhere.
36. As a visitor, I want the site to be accessible (alt texts, keyboard navigation, sufficient contrast), so that everyone can use it.
37. As a visitor sharing a pin link in WhatsApp or social media, I want a preview image of the cut-out pin on a dark background with the city name, so that the link looks good.
38. As a visitor, I want an "Imprint & Privacy" page in the footer, so that I know who runs the site and what data is processed (hosting, analytics) and where the map data comes from.
39. As a visitor, I want no cookie banner, so that the site is pleasant to use.
40. As a visitor, I want a meaningful 404 page in the site's style, so that broken links don't feel broken.

### Ich als Sammler: Pins pflegen

41. As the collector, I want to add a new pin with one command that asks me for city, country, date, cafe name, series, origin, closed flag and the photo, so that adding pins is effortless.
42. As the collector, I want the command to look up the coordinates via OpenStreetMap Nominatim and let me confirm or correct them, so that I never look up coordinates by hand.
43. As the collector, I want the command to propose the URL slug (city + year, with a suffix on collision) and store it permanently, so that URLs never change when I add more pins later.
44. As the collector, I want to enter dates as `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, so that I can record old pins whose exact date I don't remember.
45. As the collector, I want the command to process the photo automatically (cut-out, texture, outline, relief map, rim metal), so that the 3D pin and gallery image exist without manual work.
46. As the collector, I want to feed in HEIC photos straight from my iPhone, so that I don't have to convert anything.
47. As the collector, I want to drop in a manually cut-out PNG when the automatic cut-out is bad, and re-run processing from it, so that I can fix edge cases.
48. As the collector, I want to re-run processing for all pins from their original photos, so that improvements to the processing apply to the whole collection.
49. As the collector, I want to write the pin's story as Markdown in the pin file, so that I can edit it in any editor.
50. As the collector, I want to edit any pin field later by editing its file, so that corrections are simple.
51. As the collector, I want the build to fail with a clear message if a pin file is invalid (e.g. missing year, unknown country, missing assets), so that I never publish a broken page.
52. As the collector, I want the site to deploy automatically when I push to GitHub, so that publishing is just a push.
53. As the collector, I want a guide for photographing pins, so that the photos produce good results.
54. As the collector, I want processed assets to be committed and not regenerated on every build, so that builds stay fast and reliable.
55. As the collector, I want visitor statistics without cookies, so that I can see if anyone looks at the site.

## Implementation Decisions

### Stack und Hosting
- Statische Seite mit **Astro**. Pins sind eine Content-Collection mit Schema-Prüfung; der Build schlägt bei ungültigen Pins fehl.
- Hosting auf **Netlify** mit automatischem Deploy bei jedem Push auf `main`. Öffentliches GitHub-Repo.
- Domain `hochitom.rocks`: DNS bleibt beim Registrar; A-Eintrag der Hauptdomain auf den Netlify-Load-Balancer, CNAME für `www`.
- Analytics: Cloudflare Web Analytics (Skript-Beacon, cookielos).
- Kein Kartendienst im Browser: Der Globus kommt ohne externen Dienst, Account oder Token aus.
- Sprache der Seite: Englisch.

### Datenmodell: Pin
Eine Datei pro Pin (Markdown mit Frontmatter, Body = Story). Die Datei-ID ist der Slug.

| Feld | Typ | Pflicht |
|---|---|---|
| city | Text | ja |
| country | ISO-3166-1-Alpha-2-Code (z. B. `DE`, `IS`) | ja |
| lat, lng | Zahl | ja |
| date | `YYYY`, `YYYY-MM` oder `YYYY-MM-DD` | ja |
| cafeName | Text | nein |
| closed | Boolean, Standard `false` | nein |
| series | Freitext | nein |
| origin | `bought` / `traded` / `gift` | nein |

- **Ländercode statt Freitext**, damit Ländername (Englisch) und Kontinent zuverlässig abgeleitet werden können; die Zuordnung Land → Kontinent ist eine statische Tabelle.
- Kein Preis, kein Wert, keine Anzahl.
- **Slug** = `<stadt-slug>-<jahr>`, bei Kollision `-2`, `-3` … Er wird beim Anlegen festgelegt und als Datei-ID gespeichert, nicht beim Build berechnet — dadurch bleiben URLs stabil.
- **Sortierung**: nach Datum absteigend; unvollständige Daten werden wie der früheste mögliche Zeitpunkt behandelt (`2015` = `2015-01-01`), bei Gleichstand nach Slug.

### Pin-Assets
Pro Pin liegen neben dem Original-Foto die erzeugten Dateien im Repo (committet, nicht im Build erzeugt):
- freigestelltes PNG (Galerie, Vorschaubild, Rückfall-Lösung)
- Textur-JPEG mit an den Rand „verschmierter“ Farbe (Vorderseite des 3D-Modells)
- Relief-Karte (Normal Map)
- Umriss (JSON)
- Metadaten (JSON) mit der Randfarbe als `gold` oder `silver`

Umriss-Format aus dem Prototyp — Koordinaten normiert auf das Bildquadrat, Ursprung in der Mitte, y nach oben:

```ts
// aus dem Prototyp
type Outline = Array<{
  outer: [number, number][];     // x, y ∈ [-0.5, 0.5]
  holes: [number, number][][];
}>;
```

### Module

- **Katalog** (tiefes Modul, reine Logik ohne Darstellung): nimmt die validierten Pins und liefert alles Abgeleitete — Galerie-Reihenfolge, verfügbare Kontinente, Zeitleisten-Gruppen nach Jahr, Statistik (Pins, Länder, erstes Jahr), Globus-Daten — Cafés (Pins mit identischen Koordinaten zusammengefasst) und die Tour-Route (Cafés in chronologischer Reihenfolge, ohne direkt aufeinanderfolgende Wiederholungen) —, vorheriger/nächster Pin. Alle Seiten beziehen ihre Daten ausschließlich hierüber.
- **Seiten**: Startseite (Hero + Statistik + Galerie), Detailseite pro Pin, Karte (Globus), Zeitleiste, Imprint & Privacy, 404. Gemeinsames Layout mit Navigation und Footer.
- **Galerie-Effekt**: CSS-Neigung mit Glanz-Streifen, maskiert auf die Pin-Form, kleines Skript für die Zeigerposition. Kontinent-Filter als progressive Verbesserung.
- **3D-Viewer** (Astro-Island, Three.js, wird nachgeladen): baut das Modell im Browser aus Umriss, Textur, Relief-Karte und Randfarbe. Verbindliche Erkenntnisse aus dem Prototyp:
  - Körper: Umriss extrudiert (Tiefe ≈ 0,022, Fase 0,006 dick / 0,004 breit, normiert auf die Pin-Breite), Vorderseite als eigene Fläche auf der Fase mit Textur, UV aus der Position.
  - Vorderseite: Emaille ohne Metallanteil, Relief-Karte aktiv, **niedriger Glanz** (Spiegelanteil ≈ 0,25, Klarlack ≈ 0,35, Umgebungsreflexion ≈ 0,3) — sonst bleicht das Foto aus.
  - Rand und Rückseite: Metall, Gold oder Altsilber laut Metadaten. Rückseite mit Nadel und Schmetterlingsverschluss.
  - Licht: Raum-Umgebung plus warmes Hauptlicht und rötliches Gegenlicht; neutrales Tone-Mapping mit leicht erhöhter Belichtung.
  - Bewegung: auf der Detailseite meist frontal mit leichtem Schwenken und einer sanft beschleunigten ganzen Drehung pro ≈ 12-s-Zyklus (≈ 9 s Schwenken, ≈ 3 s Drehung), im Hero nur Schwenken; pausiert bei Interaktion und setzt nach ≈ 2,5 s wieder ein. Keine automatische Bewegung bei `prefers-reduced-motion`.
  - Ohne WebGL: freigestelltes Foto mit Galerie-Effekt.
- **Globus** (Astro-Island, Three.js — dieselbe Bibliothek wie der 3D-Viewer). Verbindliche Erkenntnisse aus dem Mockup:
  - Kontinente als Punkte auf einer Kugel: Landmaske aus `world-atlas` `land-110m` (Natural Earth), **beim Build** zu einem kompakten Punkte-Array vorberechnet (Gitter ≈ 1,25°, je Breitengrad an den Umfang angepasst) — nicht im Browser.
  - Kugel in Samt mit Messing-Randlicht (Fresnel), Gradnetz alle 20° mit sehr geringer Deckkraft, Punkte in Messing, zum Rand hin kleiner und blasser.
  - Marker als HTML-Buttons über dem Canvas, pro Frame projiziert, auf der Rückseite ausgeblendet und außerhalb der Globus-Fläche abgeschnitten. Echte Pins als kleines freigestelltes Foto, sonst Messing-Ring; Zahl bei mehreren Pins.
  - Tour-Linie: gestrichelte Bögen zwischen aufeinanderfolgenden Cafés, Striche fließen von alt nach neu.
  - Kamera-Abstand skaliert mit dem Seitenverhältnis (vertikales Sichtfeld), damit der Globus auch im Hochformat passt; Zoom begrenzt.
  - Eigendrehung langsam, pausiert unter der Maus und bei Interaktion, entfällt bei `prefers-reduced-motion`. Auswählen dreht das Café nach vorne und zoomt moderat heran.
  - Fokus per URL-Parameter (`pin`), von der Detailseite verlinkt.
  - Ohne WebGL: Liste der Cafés mit Links statt Globus.
- **Vorschaubilder** (beim Build): freigestellter Pin auf dunklem Hintergrund mit Stadtname, pro Detailseite; dazu ein allgemeines Bild für die übrigen Seiten.
- **Foto-Verarbeitung** (Python-Skript, läuft nur lokal): Foto → Pin-Assets. Verbindliche Erkenntnisse aus dem Prototyp:
  - Freistellen mit `rembg`, Modell `isnet-general-use`; Maske hart schwellen, größte Fläche behalten, Löcher unter 0,15 % der Bildfläche füllen.
  - Pin zentriert auf quadratischer Fläche (1024 px) mit etwas Rand.
  - Umriss: Konturen samt Löchern, entlang der Kontur geglättet (Gauß, σ ≈ 3 px), dann vereinfacht (≈ 0,6 px Toleranz) — sonst Streifen an der Seitenwand.
  - Relief-Karte aus der geglätteten Helligkeit (Sobel, Stärke ≈ 4).
  - Randfarbe: Median des äußersten Pixelrings; Sättigung über 0,22 → Gold, sonst Silber.
  - **Keine** farbbasierte Metall-Erkennung auf der Vorderseite (im Prototyp verworfen).
  - Ein manuell freigestelltes PNG ersetzt den Freistell-Schritt.
  - Kann für einen Pin oder alle Pins laufen.
- **`new-pin`** (Node-Befehl): fragt die Felder ab, sucht die Koordinaten per OpenStreetMap Nominatim (mit Bestätigung; eigener User-Agent, höchstens 1 Anfrage pro Sekunde), schlägt den Slug vor, legt die Pin-Datei an und startet die Foto-Verarbeitung.

### Design
- Verbindlich ist [design.md](../../docs/design.md): Farben (Velvet, Felt, Brass, Bone, Smoke, Lamp), Schriften (Big Shoulders Display für Stadtnamen und Jahreszahlen, Newsreader für alles andere), Schriftgrade und Layout je Seite.
- **Vitrine** auf Startseite und jeder Detailseite: riesiger Stadtname in Messing-Kontur hinter dem 3D-Pin im Lichtkegel; auf der Detailseite ist er die `h1`. Auf schmalen Bildschirmen steht der Name am oberen Rand der Vitrine.
- **Messingschild** auf der Detailseite mit Titelzeile „Hard Rock Cafe <Stadt>“ und den Angaben darunter.
- **Galerie** als Filz-Banner ohne Kacheln; **Tour** zweispaltig (Jahr | Stationen).
- **Bewegung des Detail-Pins:** schaut meist nach vorne und schwenkt leicht, dann eine sanft beschleunigte ganze Drehung pro ≈ 12-s-Zyklus — keine Dauerdrehung.
- Das Mockup auf `prototype/design` ist Referenz für Aussehen und Abstände, nicht für Code.

### Rechtliches
- Kein Hard-Rock-Logo und keine Marke im Seitendesign (die Pins selbst zeigen es natürlich).
- Imprint mit Offenlegung nach § 25 MedienG (Name, Wohnort); Privacy-Abschnitt zu Cloudflare Web Analytics und Netlify-Hosting. Quellenangaben: Natural Earth (Kontinente), © OpenStreetMap contributors (Koordinaten).

## Testing Decisions

- **Gute Tests prüfen nur äußeres Verhalten**: was ein Besucher im gebauten HTML sieht bzw. welche Dateien die Foto-Verarbeitung erzeugt — nie interne Funktionen oder Zwischenzustände. Ein Umbau der Interna darf keinen Test brechen.
- **Test-Stelle 1 — die gebaute Seite** (Haupt-Stelle): Die Seite wird mit einer kleinen Menge Beispiel-Pins gebaut, die nur für die Tests existieren (inkl. zwei Pins mit identischen Koordinaten, zwei Pins aus derselben Stadt im selben Jahr, Pins mit nur Jahr bzw. Jahr-Monat, ein geschlossenes Cafe, Pins aus mehreren Kontinenten). Geprüft wird das erzeugte HTML/JSON:
  - Detailseiten existieren unter den erwarteten Slugs, zeigen alle Felder, Story, vorherigen/nächsten Pin.
  - Galerie-Reihenfolge, Kontinent-Filter-Optionen, Markierung geschlossener Cafes.
  - Zeitleiste: Gruppen und Reihenfolge, korrekte Einordnung unvollständiger Daten, Anzahl pro Jahr.
  - Statistik-Zeile.
  - Globus-Daten: ein gemeinsamer Marker für identische Koordinaten; Tour-Route in chronologischer Reihenfolge ohne direkte Wiederholung desselben Cafés; vorberechnete Land-Punkte vorhanden.
  - Vorschaubild-Meta-Tags pro Detailseite, Imprint & Privacy, 404.
  - Ein ungültiger Pin lässt den Build mit verständlicher Meldung scheitern.
- **Test-Stelle 2 — die Foto-Verarbeitung**: Mit den zwei Prototyp-Fotos (Hamburg, Reykjavík) als Testbeispiele: alle Asset-Dateien werden erzeugt, der Umriss ist gültig (geschlossen, im Wertebereich, keine winzigen Löcher), Hamburg wird als Gold, der Wikinger als Silber erkannt; ein manuelles PNG wird bevorzugt. Für `new-pin`: die Nominatim-Ortssuche wird durch eine Attrappe ersetzt; geprüft wird, dass eine gültige Pin-Datei mit Slug (inkl. Kollisions-Suffix) entsteht.
- **Smoke-Test im Browser**: Startseite, Detailseite und Globus laden ohne JavaScript-Fehler; ohne WebGL erscheinen die Rückfall-Lösungen (Foto statt 3D-Pin, Café-Liste statt Globus).
- **Manuell geprüft** (keine automatischen Tests): Aussehen und Bewegung des 3D-Viewers und des Globus, Galerie-Effekt — wie im Prototyp per Augenschein in Browser und auf dem Handy.
- **Prior Art**: Es gibt noch keine Tests im Repo. Referenz für Aussehen und Parameter ist der Prototyp auf Branch `prototype/3d-pins`.

## Out of Scope

- Wunschliste bzw. Anzeige fehlender Cafes, Liste aller Hard Rock Cafes
- Community-Funktionen: Tauschen, Kontakt, Kommentare, Accounts
- Preis, Wert, Anzahl/Duplikate
- Fotos der Rückseite
- Suche in der Galerie
- Reisen als eigenes Konzept
- Straßenkarte bzw. Zoom bis auf Straßenebene, Kartendienste wie Mapbox
- Admin-Oberfläche oder Pflege vom Handy aus
- Mehrsprachigkeit
- KI-Tiefenkarte für echtes Relief, Fotogrammetrie
- Automatische Metall-Erkennung auf der Vorderseite
- `.glb`-Export pro Pin
- Echtes 3D in der Galerie
- Foto-Verarbeitung im Build oder in CI

## Further Notes

- Die Pin-Daten und Fotos existieren noch nicht; sie entstehen nach dem [Foto-Handbuch](../../docs/fotografieren.md). Für die Entwicklung reichen die Beispiel-Pins der Tests plus die zwei Prototyp-Fotos.
- Die Qualität der Fotos ist der größte Hebel für das Ergebnis (Prototyp: zu dunkle Fotos wirken matschig).
- Bei der Wikinger-Freistellung wurde eine mögliche echte Lücke zwischen Axt und Bart gefüllt; das muss am echten Pin geprüft und ggf. per manuellem PNG korrigiert werden.
