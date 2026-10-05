# 09: Vorschaubilder fürs Teilen

**What to build:** Wer einen Pin-Link in WhatsApp oder sozialen Netzen teilt, sieht ein Vorschaubild: den freigestellten Pin auf Samt mit dem Stadtnamen, beim Build erzeugt. Die übrigen Seiten bekommen ein allgemeines Vorschaubild.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 02 (Foto-Verarbeitung: vom Foto zu den Pin-Dateien), 04 (Detailseite komplett (ohne 3D))

**Status:** ready-for-agent

- [x] Pro Detailseite ein Vorschaubild im üblichen Format (1200 × 630) mit Pin und Stadtname in den Farben und Schriften der Seite
- [x] Allgemeines Vorschaubild für Startseite, Tour und Globus
- [x] Passende Meta-Tags (Titel, Beschreibung, Bild) auf jeder Seite
- [x] Build-Tests: Meta-Tags und Bild pro Detailseite vorhanden

## Comments

**2026-10-05 (Agent):** Umgesetzt. Die Vorschaubilder entstehen beim Build als statische Dateien: `/og/pins/<slug>.png` pro Pin (freigestellter Pin im Lichtkegel auf Samt, Stadtname groß in Big Shoulders und Messing, darunter Land und Jahr, unten klein „hochitom.rocks“) und `/og/default.png` für alle übrigen Seiten (Schriftzug, „Hard Rock Cafe pins, collected since …“ und die drei neuesten Pins). Gezeichnet wird mit `satori`, gerastert mit `sharp` (`src/lib/preview-image.ts`); die Schrift kommt als WOFF aus `@fontsource/big-shoulders-display`, Latin Extended als zweite Familie für Städte wie „Łódź“. `Base.astro` setzt Beschreibung sowie Open-Graph- und Twitter-Tags; ohne Angaben gelten eine allgemeine Beschreibung und das allgemeine Bild, damit der Globus (Ticket 07) ohne Änderung versorgt ist. Build-Tests: `test/preview-images.test.ts`. Hamburg und Reykjavík per Augenschein geprüft; die Bilder kosten im Build zusammen unter einer halben Sekunde.
