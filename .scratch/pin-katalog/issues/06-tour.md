# 06: Tour-Seite

**What to build:** Die Zeitleiste als Rückseite eines Tour-Shirts: links die Jahreszahl groß in Messing mit Anzahl darunter, rechts die Stationen mit Datum, Stadt (verlinkt) und Land. Neuestes Jahr zuerst. Am Handy steht das Jahr über den Stationen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite)

**Status:** ready-for-agent

- [ ] Gruppierung nach Jahr, neuestes zuerst, mit Anzahl („1 pin“ / „3 pins“)
- [ ] Pins mit nur Jahr bzw. Jahr und Monat werden korrekt eingeordnet; unbekannter Tag/Monat bleibt leer
- [ ] Tabellenziffern für Daten
- [ ] Jede Stadt verlinkt auf ihre Detailseite
- [ ] Build-Tests: Gruppen, Reihenfolge, ungenaue Daten, Anzahl pro Jahr
