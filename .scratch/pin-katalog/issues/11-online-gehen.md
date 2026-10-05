# 11: Online gehen

**What to build:** Die Seite geht unter `hochitom.rocks` online. Diese Schritte brauchen meine Accounts und kann nur ich ausführen; ein Agent kann dafür mit `/wizard` ein geführtes Skript erzeugen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite)

**Status:** ready-for-human

- [ ] Öffentliches GitHub-Repo angelegt und `main` gepusht (ohne Prototyp-Branches, außer ich will sie öffentlich)
- [ ] Netlify-Seite mit automatischem Deploy bei jedem Push auf `main`
- [ ] DNS beim Registrar: A-Eintrag der Hauptdomain auf den Netlify-Load-Balancer, CNAME für `www`; HTTPS aktiv
- [ ] Cloudflare Web Analytics eingerichtet, Token als Umgebungsvariable in Netlify
- [ ] Angaben für das Imprint (Name, Wohnort) geliefert
