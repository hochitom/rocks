# 10: Imprint & Privacy, 404, Besucherstatistik

**What to build:** Die rechtlich nötige Seite „Imprint & privacy“ im Footer, eine 404-Seite im Stil der Seite und die cookielose Besucherstatistik.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite)

**Status:** ready-for-agent

- [ ] Offenlegung nach § 25 MedienG (Name, Wohnort — Platzhalter, bis ich die Angaben liefere)
- [ ] Datenschutz-Abschnitt zu Netlify-Hosting und Cloudflare Web Analytics
- [ ] Quellenangaben: Natural Earth (Kontinente), © OpenStreetMap contributors (Koordinaten)
- [ ] 404-Seite mit klarer Richtung zurück zur Sammlung
- [ ] Cloudflare-Web-Analytics-Skript nur im Produktions-Build, Token aus einer Umgebungsvariable; kein Cookie-Banner
- [ ] Build-Tests: Imprint-Seite und 404 vorhanden, Analytics-Skript nur mit gesetzter Umgebungsvariable
