# Mitmachen

Danke fürs Interesse. Kurz die Regeln, damit Beiträge schnell durchgehen.

## Entwicklung

```bash
cp .env.example .env
pnpm install
docker compose up -d      # Postgres
pnpm db:migrate
pnpm dev                  # http://localhost:3000
```

Vor einem Pull Request: `pnpm check` (Typecheck und Tests) und `pnpm build` müssen durchlaufen. Die CI prüft das Gleiche.

## Konventionen

- Oberfläche auf Deutsch, Code, Commits und Kommentare auf Englisch (Kommentare dürfen Deutsch sein, wenn sie fachliche Begriffe erklären).
- Kleine, thematisch geschlossene Pull Requests mit einer Beschreibung, was und warum.
- Neue Datenbankänderungen als SQL-Migration in `server/db/migrations` plus Eintrag in `meta/_journal.json`, idempotent (`IF NOT EXISTS`).
- Keine echten Sammler- oder Personendaten in Tests, Fixtures oder Screenshots.
- Neue KI-Anbieter kommen in `shared/utils/aiProviders.ts` (Katalog) und, wenn nötig, als Adapter in `server/utils/ai/client.ts`.

## Issues

Bugs bitte mit Schritten zum Nachstellen, Browser oder Gerät und, wenn möglich, einem Screenshot. Feature-Wünsche mit dem konkreten Problem, das gelöst werden soll.
