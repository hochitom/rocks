# 04: Detailseite komplett (ohne 3D)

**What to build:** Die Detailseite bekommt ihre endgültige Gestalt: die **Vitrine** mit dem riesigen Stadtnamen in Messing-Kontur als `h1` hinter dem freigestellten Pin-Foto im Lichtkegel, darunter das **Messingschild** (Titelzeile „Hard Rock Cafe <Stadt>“, Land, Cafe-Name, Datum in der bekannten Genauigkeit, Herkunft und Serie), daneben die Geschichte und unten vorheriger/nächster Pin. Referenz für Aussehen und Abstände: Mockup auf Branch `prototype/design`.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite), 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien)

**Status:** ready-for-agent

- [x] Stadtname als `h1` in Messing-Kontur, angeschnitten bei langen Namen; auf schmalen Bildschirmen am oberen Rand der Vitrine
- [x] Messingschild mit gravierter Schrift, Nieten auf Höhe der Titelzeile; nur vorhandene Angaben werden gezeigt
- [x] Datum wird so genau angezeigt, wie es bekannt ist (Jahr / Monat Jahr / Tag Monat Jahr)
- [x] Geschichte mit max. ~66 Zeichen pro Zeile
- [x] Links „Previous pin“ / „Next pin“ mit Stadtnamen
- [x] Link „Back to all pins“
- [x] Am Handy: Vitrine, dann Schild, dann Geschichte; kein seitliches Scrollen
- [x] Build-Tests: alle Felder, Datumsformate, vorheriger/nächster Pin

## Comments

**2026-10-05 (Agent):** Umgesetzt. Die Vitrine ist eine eigene Komponente (`src/components/Vitrine.astro`, Props `city` und `heading`; Standard-Slot = Bühne für das Exponat, Slot `top` für den Zurück-Link), damit Ticket 05 sie für den Hero der Startseite (Name dort kein `h1`, nur Dekoration) und den 3D-Pin wiederverwenden kann. Bis dahin zeigt sie das freigestellte Foto mit Alternativtext „Hard Rock Cafe <Stadt> pin“. Der Stadtname hat auch auf der Detailseite die Hero-Größe aus dem Mockup (nicht die 4.2rem aus der Schrifttabelle); lange Namen werden an beiden Rändern gleichmäßig angeschnitten. Das Messingschild (`src/components/Plaque.astro`) zeigt Land und Datum immer, Cafe-Name und „Pin“ (Herkunft · Serie) nur wenn vorhanden, ein geschlossenes Cafe als Satz „This cafe has closed.“. Der Katalog liefert dafür `cafeName`, `series`, `origin` und `closed`. Der Link zur Karte folgt in Ticket 07. Geprüft im Browser bei 1280 px und 375 px.
