# saat.

**Was muss ich jetzt säen?** saat. sagt es dir, passend zu deinem Frostdatum und deinen Beeten.

saat. ist ein Aussaatkalender für Gemüsebeet, Hochbeet und Balkonkasten. Du gibst einmal deine zwei Frostdaten ein, den letzten Frost im Frühjahr und den ersten im Herbst. Daraus rechnet die App für jede Pflanze die Zeitfenster zum Vorziehen, Säen und Pflanzen. Trägst du ein, was in deinen Beeten wächst, siehst du das Erntefenster und eine Ampel, ob die Ernte vor dem Herbstfrost fertig wird.

Reine Rechnung, keine KI, kein Server. Alles bleibt auf deinem Handy.

<p align="center"><img src="bilder/1-uebersicht.png" width="240" alt="saat. auf dem Handy: der Screen jetzt mit Frostdaten, Aufgaben und Navigation unten"></p>

<p align="center"><img src="bilder/2-breit.png" width="640" alt="saat. am großen Bildschirm: Navigation links, jetzt in zwei Spalten"></p>

## Warum

Gartenplaner gibt es viele, die guten meist im Abo. Bezahlt wird dort vor allem für eine einzige Frage: Was ist jetzt dran, und wann kann ich ernten? Dafür brauchst du ein Konto, deine Daten liegen beim Anbieter, und die Apps sind voll mit Community, Fotos und Shop. Die Termine kommen als feste Tage, obwohl Gärtnern nie auf den Tag genau geht.

saat. macht nur den Kalender. Ohne Konto, ohne Netz, und jeder Termin ist ein ehrliches Zeitfenster.

## Funktionen

- **Frostdaten**: letzter Frost im Frühjahr und erster Frost im Herbst, als Tag und Monat, gelten für jedes Jahr. Die Vorbelegung 10.05. und 15.10. ist als Platzhalter markiert
- **Pflanzenliste** mit 14 Richtwerten zum Start (Tomate, Paprika, Gurke, Zucchini, Kürbis, Buschbohne, Erbse, Möhre, Radieschen, Pflücksalat, Spinat, Kohlrabi, Steckzwiebel, Mangold), alles bearbeitbar, dazu eigene Pflanzen
- **Zeitfenster** pro Pflanze für Vorziehen, Direktsaat und Auspflanzen in Wochen relativ zum letzten Frost, dazu die Kulturdauer als Spanne in Tagen
- **Beete** mit Name und Notiz, darin deine Kulturen: Pflanze, Art (vorgezogen und gepflanzt oder direkt gesät) und Datum
- **Erntefenster** pro Kultur als Spanne, mit Vorschau schon vor dem Speichern
- **Ampel** gegen den Herbstfrost: passt, knapp, zu spät
- **jetzt**: was in den nächsten 14 Tagen ansteht, ob das Fenster schon läuft oder in wie vielen Tagen es aufgeht, dazu alle offenen Erntefenster samt Beet
- **Jahreskalender**: pro Pflanze Balken für Vorziehen, Säen und Pflanzen über zwölf Monate, mit Markierung für heute und beide Frostdaten. Vergangene Fenster werden grau
- **Export und Import** als JSON Datei, mit Vorschau vor dem Ersetzen
- **Beispieldaten** zum Ausprobieren, als Beispiel markiert und mit einem Klick entfernt
- Hell und dunkel, funktioniert offline, installierbar als App

## Datenschutz

Nichts verlässt dein Gerät. saat. hat keinen Server, kein Konto, keine Analyse, keine Werbung und lädt nichts aus dem Netz nach. Frostdaten, Pflanzen, Beete und Kulturen liegen nur im lokalen Speicher deines Browsers (localStorage). Eine Exportdatei entsteht nur, wenn du sie selbst auslöst.

Weil die Daten nur im Browser liegen: Wer die Websitedaten löscht, löscht auch saat. Exportiere deshalb ab und zu, das Datum des letzten Exports steht in den Einstellungen.

## Installation

saat. ist eine statische Web-App. Es gibt keinen Build-Schritt und keine Abhängigkeiten.

1. Den Ordner `saat/` auf einen beliebigen statischen Host legen, zum Beispiel deinen eigenen Webspace. Für die Installation als App ist HTTPS nötig.
2. Die Adresse im Handybrowser öffnen.
3. Im Browsermenü **Zum Startbildschirm hinzufügen** wählen. Danach startet saat. wie eine App und funktioniert auch ohne Netz, auch mitten im Garten.

Lokal testen:

```
cd saat
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen.

## Wie gerechnet wird

Alle Daten sind reine Kalendertage. Gerechnet wird über `Date.UTC`, damit die Zeitumstellung keinen Tag verschiebt.

**1. Zeitfenster.** Jedes Fenster steht in Wochen relativ zum letzten Frühjahrsfrost, minus heißt davor. Beginn = Frostdatum + 7 × von, Ende = Frostdatum + 7 × bis.
Beispiel Tomate vorziehen, -8 bis -6 Wochen, Frost am 10.05.2026: 10.05. minus 56 Tage ergibt 15.03., minus 42 Tage ergibt 29.03. Auspflanzen 0 bis 3 Wochen: 10.05. bis 31.05.

**2. Erntefenster.** Datum der Direktsaat oder Auspflanzung plus Kulturdauer, kürzeste bis längste.
Beispiel Tomate gepflanzt am 20.05.2026, Kultur 60 bis 85 Tage: Ernte 19.07. bis 13.08.

**3. Ampel.** Gilt nur für frostempfindliche Pflanzen, alle anderen bekommen immer passt. Verglichen wird mit dem ersten Herbstfrost im Jahr der Kultur:
- zu spät, wenn die Ernte erst nach dem Herbstfrost beginnt
- knapp, wenn sie nach dem Herbstfrost endet
- sonst passt. Endet die Ernte genau am Frosttag, passt es noch

Beispiel Buschbohne, Kultur 60 bis 75 Tage, Herbstfrost 15.10.2026: Saat am 20.08. ergibt Ernte 19.10. bis 03.11., zu spät. Saat am 05.08. ergibt 04.10. bis 19.10., knapp.

**4. Was ansteht.** Auf dem Screen jetzt erscheinen alle Fenster, die in den nächsten 14 Tagen beginnen oder schon laufen und heute noch nicht vorbei sind, sortiert nach Beginn. Dazu alle Kulturen, deren Erntefenster in diesem Zeitraum offen ist.

**Grenzen.** Die Kulturdauer ist vereinfacht: Sie zählt ab Saat oder Pflanzung und kennt weder Sorten noch Temperatur. Die Startliste sind Richtwerte aus Nachschlagewerken, keine Garantie. Boden, Lage und Wetter verschieben alles um Tage bis Wochen. Deshalb zeigt saat. jeden Termin als Spanne, nie als einzelnen Tag.

Die Rechenfunktionen in `rechnen.js` sind reine Funktionen und mit `node test-calc.js` gegen diese Handrechnungen getestet.

## Lizenz

GNU Affero General Public License v3.0 (AGPL-3.0), siehe `LICENSE`.

---

**gedacht.gemacht.** Kleine, ehrliche Software. Alles bleibt auf deinem Gerät.
