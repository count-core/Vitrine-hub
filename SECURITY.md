# Sicherheit

## Schwachstelle melden

Bitte keine öffentlichen Issues für Sicherheitslücken. Schreib stattdessen an die im Impressum der jeweiligen Installation genannte Adresse oder nutze die private Meldung über GitHub ("Report a vulnerability" im Reiter Security). Du bekommst innerhalb von 7 Tagen eine Antwort.

## Was die App schützt

- Zugang nur mit Konto, Registrierung standardmäßig nur per Einladungslink (`ALLOW_SIGNUP=false`).
- Rollen pro Sammlung: Eigentümer, Bearbeiten, Nur ansehen. Schreibende Aufrufe werden serverseitig geprüft.
- Bilder liegen außerhalb des Web-Roots und werden nur nach Berechtigungsprüfung ausgeliefert. Öffentliche Sammlungen liefern nur freigegebene Bilder.
- API-Schlüssel für KI-Anbieter werden mit AES-256-GCM verschlüsselt gespeichert und nie im Klartext angezeigt.
- Sicherheits-Header (CSP, HSTS hinter HTTPS, nosniff, frame-ancestors none), Größenlimits für Uploads, Rate-Limits für Login und öffentliche Anfragen, Honeypot gegen Spam.
- Eigene KI-Adressen werden gegen Link-Local- und Metadaten-Ziele geprüft, Weiterleitungen werden nicht verfolgt.

## Betreiberpflichten

- `BETTER_AUTH_SECRET` mit mindestens 32 zufälligen Zeichen setzen. Der Server startet in Produktion sonst nicht.
- Hinter HTTPS betreiben (Reverse-Proxy).
- `ALLOW_SIGNUP` nach dem Anlegen der Konten auf `false` setzen.
- Regelmäßig `pnpm audit` und Updates einspielen. Dependabot ist im Repository konfiguriert.
