# 08: new-pin: neuen Pin mit einem Befehl anlegen

**What to build:** Ein Befehl, mit dem ich einen neuen Pin anlege: Er fragt Stadt, Land, Datum, Cafe-Name, Serie, Herkunft, „geschlossen“ und das Foto ab, sucht die Koordinaten per **OpenStreetMap Nominatim** und lässt sie bestätigen oder korrigieren, schlägt den Slug vor, schreibt die Pin-Datei und startet die Foto-Verarbeitung.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien)

**Status:** ready-for-agent

- [ ] Datum als `YYYY`, `YYYY-MM` oder `YYYY-MM-DD`; ungültige Eingaben werden mit Erklärung abgelehnt
- [ ] Nominatim mit eigenem User-Agent und höchstens 1 Anfrage pro Sekunde
- [ ] Slug `<stadt>-<jahr>`, bei Kollision `-2`, `-3` …; wird als Datei-ID gespeichert und bleibt stabil
- [ ] Die erzeugte Pin-Datei besteht die Schema-Prüfung aus Ticket 01
- [ ] Startet die Foto-Verarbeitung aus Ticket 02 für den neuen Pin
- [ ] Test: Ortssuche durch Attrappe ersetzt; gültige Pin-Datei entsteht, inklusive Kollisions-Suffix
