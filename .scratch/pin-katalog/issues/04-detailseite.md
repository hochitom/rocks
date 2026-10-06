# 04: Detailseite komplett (ohne 3D)

**What to build:** Die Detailseite bekommt ihre endgültige Gestalt: die **Vitrine** mit dem riesigen Stadtnamen in Messing-Kontur als `h1` hinter dem freigestellten Pin-Foto im Lichtkegel, darunter das **Messingschild** (Titelzeile „Hard Rock Cafe <Stadt>“, Land, Cafe-Name, Datum in der bekannten Genauigkeit, Herkunft und Serie), daneben die Geschichte und unten vorheriger/nächster Pin. Referenz für Aussehen und Abstände: Mockup auf Branch `prototype/design`.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien)

**Status:** ready-for-agent

- [ ] Stadtname als `h1` in Messing-Kontur, angeschnitten bei langen Namen; auf schmalen Bildschirmen am oberen Rand der Vitrine
- [ ] Messingschild mit gravierter Schrift, Nieten auf Höhe der Titelzeile; nur vorhandene Angaben werden gezeigt
- [ ] Datum wird so genau angezeigt, wie es bekannt ist (Jahr / Monat Jahr / Tag Monat Jahr)
- [ ] Geschichte mit max. ~66 Zeichen pro Zeile
- [ ] Links „Previous pin“ / „Next pin“ mit Stadtnamen
- [ ] Link „Back to all pins“
- [ ] Am Handy: Vitrine, dann Schild, dann Geschichte; kein seitliches Scrollen
- [ ] Build-Tests: alle Felder, Datumsformate, vorheriger/nächster Pin
