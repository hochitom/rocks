# 06: Tour-Seite

**What to build:** Die Zeitleiste als Rückseite eines Tour-Shirts: links die Jahreszahl groß in Messing mit Anzahl darunter, rechts die Stationen mit Datum, Stadt (verlinkt) und Land. Neuestes Jahr zuerst. Am Handy steht das Jahr über den Stationen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite)

**Status:** ready-for-agent

- [x] Gruppierung nach Jahr, neuestes zuerst, mit Anzahl („1 pin“ / „3 pins“)
- [x] Pins mit nur Jahr bzw. Jahr und Monat werden korrekt eingeordnet; unbekannter Tag/Monat bleibt leer
- [x] Tabellenziffern für Daten
- [x] Jede Stadt verlinkt auf ihre Detailseite
- [x] Build-Tests: Gruppen, Reihenfolge, ungenaue Daten, Anzahl pro Jahr

## Comments

**2026-10-05 (Agent):** Umgesetzt unter `/tour/`. Die Gruppen kommen aus dem Katalog (`tour`), die Seite liest nur von dort. Reihenfolge: neuestes Jahr zuerst, innerhalb eines Jahres chronologisch wie auf dem Tour-Shirt (so wie die Skizze in `docs/design.md`, das Mockup hatte noch die Galerie-Reihenfolge); ungenaue Daten zählen wie in der Galerie als frühester Tag, Gleichstand nach Slug. Datum als „Jun 14“, nur Monat als „Dec“, nur Jahr bleibt leer. Build-Tests in `test/tour.test.ts`; Handy-Layout (375 px, kein horizontales Scrollen) und Tabellenziffern im Browser geprüft.
