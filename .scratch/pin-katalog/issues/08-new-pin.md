# 08: new-pin: neuen Pin mit einem Befehl anlegen

**What to build:** Ein Befehl, mit dem ich einen neuen Pin anlege: Er fragt Stadt, Land, Datum, Cafe-Name, Serie, Herkunft, „geschlossen“ und das Foto ab, sucht die Koordinaten per **OpenStreetMap Nominatim** und lässt sie bestätigen oder korrigieren, schlägt den Slug vor, schreibt die Pin-Datei und startet die Foto-Verarbeitung.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien)

**Status:** ready-for-agent

- [x] Datum als `YYYY`, `YYYY-MM` oder `YYYY-MM-DD`; ungültige Eingaben werden mit Erklärung abgelehnt
- [x] Nominatim mit eigenem User-Agent und höchstens 1 Anfrage pro Sekunde
- [x] Slug `<stadt>-<jahr>`, bei Kollision `-2`, `-3` …; wird als Datei-ID gespeichert und bleibt stabil
- [x] Die erzeugte Pin-Datei besteht die Schema-Prüfung aus Ticket 01
- [x] Startet die Foto-Verarbeitung aus Ticket 02 für den neuen Pin
- [x] Test: Ortssuche durch Attrappe ersetzt; gültige Pin-Datei entsteht, inklusive Kollisions-Suffix

## Comments

**2026-10-05 (Agent):** Umgesetzt in `scripts/new-pin.ts` (läuft mit Node 24 direkt, ohne Build-Schritt; Datum und Ländercode werden mit denselben Funktionen wie im Schema geprüft, `src/lib/pin-date.ts` und `src/lib/countries.ts`). Aufruf: `npm run new-pin`. Reihenfolge: Stadt, Ländercode, Ortssuche (Treffer bestätigen, anderen Suchbegriff probieren oder Breite/Länge selbst eingeben; auf 4 Nachkommastellen gerundet), Datum, Cafe-Name, Serie, Herkunft, „geschlossen“, Foto-Pfad (ins Terminal ziehen genügt), Slug (Vorschlag mit Enter übernehmen oder eigenen eingeben). Nominatim: User-Agent `hochitom.rocks new-pin (hochitom@me.com)`, Suche mit `countrycodes`, frühestens 1 s nach der letzten Antwort. Die Pin-Datei schreibt Texte als Strings in Anführungszeichen und `closed` immer mit; die Geschichte kommt danach als Markdown unter das Frontmatter. Schlägt die Foto-Verarbeitung fehl (oder fehlt `.venv/`), bleiben Pin-Datei und Foto liegen, der Befehl endet mit Fehler und nennt `npm run process-pin -- <slug>`. Für Tests: `HOCHITOM_PINS_DIR`, `HOCHITOM_NOMINATIM_URL` und `HOCHITOM_PROCESS_PIN` (Ersatz für die Verarbeitung). Tests in `test/new-pin.test.ts` (Nominatim-Attrappe als lokaler Server, Verarbeitung als Stub; ein Test baut die Seite mit dem neuen Pin). Einmal gegen das echte Nominatim ausprobiert (Reykjavík → 64.146, -21.9422). Dokumentiert in `docs/plan.md` (Workflow) und `docs/fotografieren.md`.
