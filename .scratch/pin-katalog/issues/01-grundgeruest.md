# 01: Grundgerüst: ein Pin wird zur Seite

**What to build:** Ein Astro-Projekt, in dem ein Pin als Markdown-Datei angelegt wird und als eigene Detailseite im fertigen Design-Rahmen erscheint. Es legt die Pin-Sammlung mit Schema-Prüfung an, das **Katalog**-Modul (alle abgeleiteten Daten, zunächst Sortierung und vorheriger/nächster Pin) und das gemeinsame Layout (Samt, Messing, Elfenbein; Big Shoulders Display und Newsreader; Navigation Pins / Map / Tour; Footer). Dazu die **Test-Stelle 1**: Die Seite wird mit Beispiel-Pins gebaut, die nur für Tests existieren, und die Tests prüfen das erzeugte HTML.

Für die Entwicklung dienen die Pins aus Hamburg und Reykjavík (Assets vom Branch `prototype/3d-pins`) als Beispielinhalt.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Pin-Schema laut Spec: city, country (ISO-3166-1-Alpha-2), lat, lng, date (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`), cafeName, closed, series, origin (`bought`/`traded`/`gift`); Body = Geschichte; Datei-ID = Slug
- [ ] Englischer Ländername und Kontinent werden aus dem Ländercode abgeleitet
- [ ] Sortierung: Datum absteigend, ungenaue Daten zählen als frühester möglicher Tag, Gleichstand nach Slug
- [ ] Jeder Pin hat eine Seite unter `/pins/<slug>` mit Stadt, Land, Datum und Geschichte (schlicht; die volle Detailseite folgt in Ticket 04)
- [ ] Gemeinsames Layout mit Farb-Tokens, beiden Schriften, Navigation (aktive Seite markiert), Footer und sichtbarem Fokus-Ring
- [ ] Ein ungültiger Pin (z. B. ohne Jahr, unbekannter Ländercode) lässt den Build mit verständlicher Meldung scheitern
- [ ] Build-Tests mit eigenen Beispiel-Pins laufen mit einem Befehl und sind grün
- [ ] Seite funktioniert ohne seitliches Scrollen ab 375 px Breite
