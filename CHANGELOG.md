# Changelog

Alle nennenswerten Änderungen an Vitrine-Hub. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

### Neu
- **Wunschliste mit Foto**: Zu jedem Wunsch lässt sich direkt an der Karte ein Foto aufnehmen oder hochladen. Fotos erscheinen auch in der öffentlichen „Gesucht"-Liste.
- **Lücken im Bestand**: Vergleicht die Katalognummern der Sammlung je Gebiet, Typ und Serie und meldet fehlende Nummern. Ausgewählte Lücken wandern per Klick auf die Wunschliste. Große Sprünge werden übersprungen, schon eingetragene Wünsche nicht doppelt vorgeschlagen.
- **Serie vervollständigen**: Die KI nennt die Ausgaben einer Serie, markiert vorhandene und bietet die fehlenden zur Übernahme an. Erfindet keine Nummern, sondern sagt, wenn sie die Serie nicht kennt.
- **Habe ich das schon?**: Angebot fotografieren, die App erkennt die Stücke und zeigt je Stück, ob es schon im Bestand ist, auf der Wunschliste steht oder neu wäre. Speichert nichts, neue Stücke lassen sich direkt als Wunsch übernehmen.
- **Preisradar**: Zielpreis je Wunsch im Vergleich zu beobachteten Preisen und KI-Schätzung, mit Ampel und Suchlinks.

### Behoben
- Positionsrahmen auf dem Gesamtfoto lagen neben dem Bild statt darauf, sobald das Foto schmaler war als sein Container. Betraf Positionsseite, Satzansicht und die Prüfliste beim Erfassen. Die Rahmen liegen jetzt in allen Ansichten exakt auf dem Foto.
- Bei Münzen und Banknoten stand an mehreren Stellen „Mi" vor der Katalognummer. Münzen zeigen jetzt „J." (Jaeger), Banknoten „R." (Rosenberg).
- Ein zu enges Rate-Limit warf angemeldete Nutzer beim schnellen Blättern kommentarlos auf die Anmeldeseite. Die Sitzungsabfrage ist jetzt ausgenommen, und nur eine echte Abmeldung setzt die Sitzung zurück.
- Fotos über 2 MB wurden beim neuen Börsen-Scan abgewiesen, weil die Größengrenze den Pfad nicht kannte.
- Balkendiagramme waren auf dem Handy unlesbar: feste Zeichenfläche stauchte Schrift auf 7 Pixel und ließ große Leerräume. Sie sind jetzt in HTML gebaut und skalieren mit der Breite. Säulen- und Verlaufsdiagramm wurden ebenfalls korrigiert.
- Das Mini-Diagramm auf der Startseite zeigte fast alle Gebiete als 4-Pixel-Strich.
- Auf der Startseite lief der Text der Erfassen-Kachel unter den Kamera-Knopf.
- In der Alben-Liste stand dauerhaft ein Eingabefeld neben der Überschrift, und der Name wiederholte nur die Nummer. Umbenennen läuft jetzt über einen eigenen Knopf.
- Leere Diagrammkarten übernahmen die Höhe der Nachbarkarte.
- Karten einer Rasterzeile in der Sammlung standen wegen unterschiedlich hoher Bilder auf verschiedenen Höhen.
- Die Filterleiste der Sammlung schnitt Einträge ohne sichtbaren Hinweis ab.
- Die Kopfzeile von „Sortieren" brach auf dem Handy mehrfach um.
- Im Erfassen-Formular saß das erste Feld tiefer als die übrigen, weil sein Beschriftungstext umbrach.
- Ein Info-Zeichen im Fließtext der Einstellungen wurde nicht dargestellt.
- Kleine Bedienelemente (Info-Zeichen, Filter-Chips, Zurück-Knöpfe, Suchlinks) waren für Finger zu klein.
- Einzelseiten begannen an unterschiedlichen Stellen, und die Fußzeile öffentlicher Seiten war nicht bündig mit dem Inhalt.
- Das Logo auf öffentlichen Seiten war über die ganze Breite anklickbar.

## [0.1.0-beta.1] – 2026-09-20

Erste Beta. Die App ist vollständig nutzbar und läuft im Alltagsbetrieb, das Datenmodell kann sich vor 1.0 aber noch ändern.

### Erfassen
- Fotoerfassung ganzer Albumblätter, Steckkarten und Münztabletts. Die KI liefert pro Stück eine Box und füllt Gebiet, Jahr, Nennwert, Motiv, Farbe, Erhaltung und Serie vor.
- Vorschlag für Michel-Nummer (Marken) und Jaeger-Nummer (Münzen), klar als Vermutung gekennzeichnet.
- Automatisches Aufrechtdrehen der Ausschnitte, Gesamtfoto des Blatts bleibt bei jeder Position sichtbar.
- Münzen: Erhaltungsgrad s bis PP, Prägestätte, Material, Durchmesser. Vor dem Speichern fragt die App nach Rückseitenfotos.
- Sätze: Kursmünzensätze und Markensätze als Einheit mit Stückzahl, dazu jedes Einzelstück.
- Erfassungsmodus wählbar (automatisch, Briefmarken, Münzen), Album und Blatt zählen automatisch hoch.
- Offline-Warteschlange: Fotos ohne Netz sammeln, später analysieren. Installierbar als PWA.

### Sammlung
- Volltextsuche mit Ähnlichkeitstreffern über alle Felder (pg_trgm), Filter nach Album, Gebiet, Erhaltung, Status und Typ.
- Alben- und Satzansicht, Satzdetail mit Gesamtfoto und nummerierten Positionen.
- Sortieren per Wischen: Dublette, zum Verkauf, behalten, mit Rückgängig.
- Wunschliste für fehlende Stücke.
- CSV-Export der gesamten Sammlung.

### Statistik und Preise
- Kennzahlen, Bestand nach Gebiet, Jahrzehnt, Erhaltung und Status, Erfassungsverlauf, Datenqualität. Jedes Diagramm mit Tabellenansicht.
- Preisrecherche mit typgerechten Suchlinks (eBay verkauft und aktuell, Delcampe, Philasearch oder MA-Shops, Catawiki, Colnect).
- Eigene Preisbeobachtungen mit Median und Spanne, KI-Schätzung als Orientierung, einzeln oder für bis zu 15 Positionen.

### Teilen und Mitglieder
- Öffentliche Sammlung per Link oder für Suchmaschinen, mit Wunschliste als „Gesucht".
- Anfragen und Preisvorschläge ohne sichtbare E-Mail-Adresse, mit Honeypot und Rate-Limits.
- Rollen je Sammlung: Eigentümer, Bearbeiten, Nur ansehen. Einladungslinks statt offener Registrierung.

### KI-Anbieter
- Auswahl in der App: Google Gemini, OpenAI, Anthropic, Mistral, Groq, OpenRouter, Ollama lokal oder eigener OpenAI-kompatibler Server.
- Pro Anbieter Kosten, Datenschutzhinweis und Schritt-für-Schritt-Anleitung zum Schlüssel, dazu Modellliste vom Anbieter und Verbindungstest.
- Schlüssel werden mit AES-256-GCM verschlüsselt gespeichert und nie im Klartext angezeigt.
- Server-Standard über `.env`, pro Sammlung überschreibbar.

### Sicherheit
- Content-Security-Policy und HSTS in Produktion, nosniff, `frame-ancestors none`, Cross-Origin-Opener-Policy.
- Rate-Limits für Anmeldung und Registrierung, Größenlimits für Uploads.
- Bilder werden nur nach Berechtigungsprüfung ausgeliefert, öffentliche Sammlungen nur mit freigegebenen Stücken.
- SSRF-Schutz für selbst eingetragene KI-Adressen, keine Weiterleitungen, keine fremden Antwortinhalte in Fehlermeldungen.
- Einladungscodes mit 80 Bit Entropie, Startprüfung der Betreiber-Einstellungen.
- CSV-Export gegen Formel-Injection abgesichert.

### Betrieb
- Docker Compose für lokale Entwicklung, Produktion und Coolify. Migrationen laufen beim Start.
- Impressum und Datenschutz aus Umgebungsvariablen, öffentliche Seite „So funktioniert's" mit echter Erkennungs-Demo.
- Info-Zeichen in der Oberfläche erklären erklärungsbedürftige Felder.

### Bekannte Einschränkungen
- Zähnung und Wasserzeichen kann kein Modell vom Foto lesen.
- Katalognummern sind Vorschläge und sollten am Katalog geprüft werden.
- Anfragen erscheinen nur in der App, es gibt noch keine E-Mail-Benachrichtigung.
- Impressum und Datenschutz sind Vorlagen und ersetzen keine Rechtsberatung.
- Das Datenmodell kann sich vor 1.0 ändern. Migrationen sind vorhanden, ein Backup vor Updates ist trotzdem ratsam.
