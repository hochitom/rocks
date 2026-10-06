# 11: Online gehen

**What to build:** Die Seite geht unter `hochitom.rocks` online. Diese Schritte brauchen meine Accounts und kann nur ich ausführen; ein Agent kann dafür mit `/wizard` ein geführtes Skript erzeugen.

Grundlage: Spec (`.scratch/pin-katalog/spec.md`), Design (`docs/design.md`), Plan (`docs/plan.md`).

**Blocked by:** 01 (Grundgerüst: ein Pin wird zur Seite)

**Status:** ready-for-human

- [ ] Öffentliches GitHub-Repo angelegt und `main` gepusht (ohne Prototyp-Branches, außer ich will sie öffentlich)
- [ ] Netlify-Seite mit automatischem Deploy bei jedem Push auf `main`
- [ ] DNS beim Registrar: A-Eintrag der Hauptdomain auf den Netlify-Load-Balancer, CNAME für `www`; HTTPS aktiv
- [ ] Cloudflare Web Analytics eingerichtet, Token als Umgebungsvariable in Netlify
- [x] Angaben für das Imprint (Name, Wohnort) geliefert

## Comments

**2026-10-06 (Agent):** Vorbereitet. Stand vorher: Repo `hochitom/rocks` öffentlich, `main` gepusht; Netlify-Seite `hochitomrocks` baut noch den alten `master`; DNS bei domaintechnik.at zeigt schon auf Netlify (`75.2.60.5`, `www` → `hochitomrocks.netlify.app`). Neu: `netlify.toml` (Build `npm run build` → `dist`, Node 24) und der Wizard `bash scripts/go-live.sh` (7 Schritte: `main` pushen, Netlify auf `main` umstellen, Cloudflare-Token holen, als `CLOUDFLARE_ANALYTICS_TOKEN` in Netlify setzen und neu deployen, Live-Prüfung, Domain/HTTPS prüfen, alten `master` als Tag `old-site` archivieren und löschen). Prototyp-Branches bleiben lokal.
