# 10: Imprint & Privacy, 404, Besucherstatistik

**What to build:** Die rechtlich nötige Seite „Imprint & privacy“ im Footer, eine 404-Seite im Stil der Seite und die cookielose Besucherstatistik.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite)

**Status:** ready-for-agent

- [x] Offenlegung nach § 25 MedienG (Name, Wohnort)
- [x] Datenschutz-Abschnitt zu Netlify-Hosting und Cloudflare Web Analytics
- [x] Quellenangaben: Natural Earth (Kontinente), © OpenStreetMap contributors (Koordinaten)
- [x] 404-Seite mit klarer Richtung zurück zur Sammlung
- [x] Cloudflare-Web-Analytics-Skript nur im Produktions-Build, Token aus einer Umgebungsvariable; kein Cookie-Banner
- [x] Build-Tests: Imprint-Seite und 404 vorhanden, Analytics-Skript nur mit gesetzter Umgebungsvariable

## Comments

**2026-10-05 (Agent):** Umgesetzt. `/imprint/` hat drei Abschnitte: „Who runs this site“ (Offenlegung nach § 25 MedienG mit Thomas Hochörtler, Kindberg, Austria — keine Platzhalter mehr), „Privacy“ (Netlify-Serverlogs, Cloudflare Web Analytics ohne Cookies, selbst gehostete Schriften, Betroffenenrechte) und „Sources“ (Natural Earth, © OpenStreetMap contributors mit Link auf die Copyright-Seite). Die 404-Seite („Not on the tour“) führt mit „Back to all pins“ zurück zur Sammlung. Das Cloudflare-Beacon steht nur im Produktions-Build im `<head>`, und nur wenn die Umgebungsvariable `CLOUDFLARE_ANALYTICS_TOKEN` gesetzt ist (in Netlify unter Site configuration → Environment variables eintragen; eine lokale `.env` wird dafür nicht gelesen). Kein Cookie-Banner. Tests: `test/legal-pages.test.ts`, `test/analytics.test.ts`. `buildSite` nimmt jetzt optional zusätzliche Umgebungsvariablen und baut immer als Produktions-Build (Vitest setzt sonst `NODE_ENV=test` und `MODE`/`DEV`/`PROD`, die in den Build durchsickern).
