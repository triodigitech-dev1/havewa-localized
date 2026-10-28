# Localea — Miet- & Immobilienverwaltung

_🇬🇧 [English](README.md) · 🇩🇪 Deutsch_

Vollständige Immobilienverwaltungssoftware für **Wohn- und Gewerbevermietung**, Mietverträge, Abrechnungen, Mieter-/Eigentümerportale, Instandhaltung und KES/EUR-Währungsunterstützung.
Mandantenfähig, rollenbasierte Rechteverwaltung (RBAC), zweisprachig (DE/EN).

---

## 🌟 Hauptfunktionen

- **Objekte & Einheiten**: Gebäude, Gewerbe- und Wohneinheiten, Zählerstände, Verteilerschlüssel und Flächenmodelle.
- **Mietverwaltung**: Mietverträge, Index- und Staffelmieten, Kautionskonten mit Zinsberechnung und Kündigungsfristen.
- **Finanzen & Abrechnung**: Automatische Sollstellung, Zahlungszuordnung, Offene-Posten-Verwaltung und 3-stufiges Mahnwesen.
- **Betriebskostenabrechnung**: Umlageschlüssel nach BetrKV, HeizkostenV (30/70), Gradtagszahlen und Flächen-Zeit-Modelle.
- **Tickets & Handwerker**: Instandhaltungsmeldungen mit Statusworkflow, Zeiterfassung und Dienstleisterverwaltung.
- **Dokumentenmanagement**: Revisionssichere GoBD-Ablage, E-Rechnungserkennung (ZUGFeRD) und DATEV/SEPA-Export.
- **Portale**: Bewohner- und Eigentümer-Self-Service mit Anfragen und Dokumenteneinsicht.
- **KI-Assistent & MCP-Server**: Integrierte KI-Hilfe und voller [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server (`/api/mcp`) für externe KI-Assistenten (Claude, ChatGPT etc.).
- **REST-API**: OpenAPI 3.1 Dokumentation unter `/api-reference`.

---

## 💻 Tech-Stack

Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL · Prisma ORM · shadcn/ui & Tailwind CSS · next-intl · Auth.js · Vitest.

---

## 🚀 Lokale Entwicklung

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run dev
```

Browser: [http://localhost:3000](http://localhost:3000).

---

## 🔑 Ersteinrichtung & Demo-Logins

Bei leerer Datenbank führt der Setup-Assistent unter `/setup` durch die Registrierung des ersten Mandanten und Administrators.

Demo-Zugänge nach `npm run db:seed`:
| Rolle | E-Mail | Passwort | Bereich |
|---|---|---|---|
| **Administrator** | `admin@localea.app` | `admin` | Verwalter-App (Vollzugriff) |
| **Mieter** | `mieter@localea.app` | `mieter` | Mieterportal (`/portal`) |
| **Eigentümer** | `eigentuemer@localea.app` | `eigentuemer` | Eigentümerportal (`/portal`) |

---

## 🚢 Produktions-Deployment & Mandantenfähigkeit

Detaillierte Anleitungen für VPS-Server (Docker Compose mit Caddy HTTPS) und Multi-Tenancy-Architektur finden sich im englischen Hauptdokument [README.md](README.md).

---

## 📄 Lizenz

© 2026 Localea Rental Management. Alle Rechte vorbehalten.
