# saat.

Dein Aussaatkalender: wann vorziehen, säen, pflanzen, ernten, passend zu deinem Frostdatum und deinen Beeten.

## Problem

Wer Gemüse anbaut, zahlt heute für Gartenplaner mit Abo (Planter, Gardenize und Ähnliche). Bezahlt wird vor allem für eine Frage: Was muss ich jetzt säen oder pflanzen, und wann kann ich ernten? Daran stört: Konto und Server sind Pflicht, die Daten liegen beim Anbieter, die Apps sind mit Community, Fotos und Shop überladen, und die Termine kommen als feste Tage statt als ehrliches Zeitfenster. Offene Alternativen zielen auf Marktgärtner und brauchen einen Server.

## Zielgruppe

Hobbygärtnerinnen und Hobbygärtner mit Gemüsebeet, Hochbeet oder Balkonkästen, die eine schlanke Planung auf dem Handy wollen, ohne Konto und auch im Garten ohne Netz.

## Bezahltes Vorbild

- **Planter** (planter.garden): kostenlose Grundversion, Premium im Abo, etwa 5 bis 7 Euro im Monat oder rund 30 bis 40 Euro im Jahr. Kann Beetplanung im Raster, Pflanzkalender nach Frostdaten, Mischkultur, Erinnerungen, Sync über Konto.
- **Gardenize**: Premium im Abo, ähnliche Preisspanne. Kann Gartentagebuch, Pflanzen und Bereiche, Fotos, Erinnerungen, Konto mit Cloud.

saat. übernimmt nur den Kalender: Zeitfenster aus Frostdatum, eigene Pflanzenliste, eigene Beete.

## Funktionen v1

- Zwei Frostdaten eingeben: letzter Frost im Frühjahr, erster Frost im Herbst (Tag und Monat, gelten für jedes Jahr).
- Pflanzenliste mit 14 Richtwert-Pflanzen (siehe unten), voll bearbeitbar, eigene Pflanzen anlegen, löschen.
- Pro Pflanze Zeitfenster für Vorziehen, Direktsaat, Auspflanzen in Wochen relativ zum letzten Frost, dazu Kulturdauer als Spanne in Tagen.
- Beete anlegen (Name, Notiz) und Kulturen eintragen: Pflanze, Art (vorgezogen und ausgepflanzt oder direkt gesät), Datum.
- Pro Kultur: berechnetes Erntefenster als Spanne und Ampel gegenüber dem Herbstfrost (passt, knapp, zu spät).
- Screen „jetzt": was in den nächsten 14 Tagen ansteht (Fenster öffnen oder laufen) plus Kulturen mit offenem Erntefenster.
- Jahreskalender: pro Pflanze Balken für Vorziehen, Säen, Pflanzen über zwölf Monate.
- Export und Import als JSON-Datei. Demodaten als `Beispiel` markiert, mit einem Klick entfernbar.
- Installierbare PWA, voll offline, hell und dunkel.

## Nicht-Ziele

- Kein Beetraster, keine Zeichenfläche, keine Mischkultur- oder Fruchtfolgeregeln.
- Keine Push-Erinnerungen, kein Wetter, keine Standortsuche, keine Frostdaten aus dem Netz.
- Kein Tagebuch, keine Fotos, keine Erträge in Kilo.
- Keine Herbstaussaat als zweites Fenster pro Pflanze in v1 (ein Fenster je Art).
- Kein Konto, kein Sync, keine KI.

## Datenmodell

Speicher: `localStorage`, ein Schlüssel `saat.daten`, Inhalt JSON. Datenmenge ist klein, IndexedDB ist nicht nötig.

```
{
  version: 1,
  frost: { fruehjahr: "05-10", herbst: "10-15" },      // MM-TT
  pflanzen: [{
    id, name,                                          // "Tomate"
    vorziehen:  { von: -8, bis: -6 } | null,           // Wochen relativ zu letztem Frost
    direktsaat: { von, bis } | null,
    auspflanzen:{ von, bis } | null,
    kultur: { min: 60, max: 85 },                      // Tage ab Direktsaat bzw. Auspflanzung bis Ernte
    frostempfindlich: true,
    beispiel: true|false
  }],
  beete: [{ id, name, notiz, beispiel }],
  kulturen: [{ id, beetId, pflanzeId, art: "direkt"|"gepflanzt", datum: "2026-05-20", beispiel }]
}
```

- Daten sind reine Kalenderdaten `JJJJ-MM-TT`, gerechnet wird über `Date.UTC`, damit Zeitumstellung keine Tage verschiebt.
- `version` wird beim Laden geprüft, Migrationen als Funktionen `migriere(vN) -> vN+1`. Unbekannte höhere Version: nicht überschreiben, Hinweis zeigen.
- Export: Datei `saat-JJJJ-MM-TT.json` mit genau diesem Objekt. Import: Schema prüfen, Vorschau (Anzahl Pflanzen, Beete, Kulturen), dann ersetzen. Ungültige Datei ändert nichts.
- Löschen einer Pflanze mit Kulturen nur nach Rückfrage, Kulturen werden mitgelöscht.

**Richtwerte (Startliste, `beispiel: false`, weil Nachschlagewerte; in der UI als „richtwert" gekennzeichnet):**

| Pflanze | vorziehen | direktsaat | auspflanzen | kultur (Tage) | frostempf. |
|---|---|---|---|---|---|
| Tomate | -8 bis -6 | | 0 bis 3 | 60 bis 85 | ja |
| Paprika | -10 bis -8 | | 1 bis 3 | 70 bis 90 | ja |
| Gurke | -4 bis -3 | 1 bis 4 | 1 bis 3 | 50 bis 70 | ja |
| Zucchini | -4 bis -3 | 1 bis 3 | 1 bis 3 | 45 bis 60 | ja |
| Kürbis | -4 bis -3 | | 1 bis 3 | 90 bis 120 | ja |
| Buschbohne | | 1 bis 10 | | 60 bis 75 | ja |
| Erbse | | -6 bis -2 | | 60 bis 80 | nein |
| Möhre | | -4 bis 8 | | 70 bis 110 | nein |
| Radieschen | | -4 bis 16 | | 25 bis 35 | nein |
| Pflücksalat | -8 bis -4 | -4 bis 12 | -4 bis 8 | 45 bis 60 | nein |
| Spinat | | -6 bis -2 | | 40 bis 55 | nein |
| Kohlrabi | -8 bis -5 | | -3 bis 6 | 50 bis 70 | nein |
| Steckzwiebel | | | -4 bis 0 | 90 bis 120 | nein |
| Mangold | | -2 bis 6 | | 60 bis 80 | nein |

Demodaten (`beispiel: true`): zwei Beete „Beispiel: Hochbeet" und „Beispiel: Gemüsebeet" mit drei Kulturen (Tomate gepflanzt, Radieschen direkt, Buschbohne direkt). Button „beispiele entfernen" löscht alles mit `beispiel: true`.

## Rechenlogik

Reine Funktionen in `rechnen.js`, ohne DOM:

- `frostImJahr(mmtt, jahr) -> datum`
- `plusTage(datum, n) -> datum`
- `fenster(frostFruehjahr, {von, bis}) -> { von: frost + 7·von, bis: frost + 7·bis }`
- `ernte(kultur, pflanze) -> { von: datum + kultur.min, bis: datum + kultur.max }`
- `ampel(ernte, herbstfrost, frostempfindlich)`: nicht frostempfindlich ergibt immer `passt`. Sonst `zu spät`, wenn `ernte.von > herbstfrost`; `knapp`, wenn `ernte.bis > herbstfrost`; sonst `passt`.
- `ansteht(heute, daten, tage = 14)`: alle Fenster mit `von <= heute + 14` und `bis >= heute`, sortiert nach `von`; dazu Kulturen mit `ernte.von <= heute + 14` und `ernte.bis >= heute`.
- Liegt ein Fenster ganz in der Vergangenheit, zeigt der Kalender es grau, nie als Fehler.

Handrechnungen (Frühjahrsfrost 2026-05-10, Herbstfrost 2026-10-15):

1. **Tomate vorziehen** (-8 bis -6 Wochen): 2026-05-10 minus 56 Tage = **2026-03-15**, minus 42 Tage = **2026-03-29**. Auspflanzen (0 bis 3): **2026-05-10 bis 2026-05-31**.
2. **Tomate gepflanzt am 2026-05-20**, Kultur 60 bis 85: Ernte **2026-07-19 bis 2026-08-13**. Beides vor 2026-10-15, Ampel **passt**.
3. **Buschbohne direkt am 2026-08-20**, Kultur 60 bis 75: Ernte **2026-10-19 bis 2026-11-03**. Beginn liegt nach dem Herbstfrost, Ampel **zu spät**. Mit Saat am 2026-08-05: Ernte **2026-10-04 bis 2026-10-19**, Ampel **knapp**.
4. **Radieschen direkt am 2026-04-01**, Kultur 25 bis 35: Ernte **2026-04-26 bis 2026-05-06**, nicht frostempfindlich, **passt**.

Daten werden immer als Spanne angezeigt („ernte 19.07. bis 13.08."), nie als einzelner Tag. Hinweis im Footer: „Richtwerte. Boden, Lage und Wetter verschieben alles um Tage bis Wochen."

## Screens

Handy zuerst (390 px, eine Spalte, Navigation unten mit vier Einträgen), ab 1024 px Navigation links, Inhalte zweispaltig.

1. **jetzt** (Start): Datum heute, Liste „steht an" mit Karten (Pflanze, Aktion vorziehen/säen/pflanzen, Fenster als Spanne, Status „läuft" oder „ab in x tagen"), darunter „ernte" mit laufenden Erntefenstern samt Beet. Leerer Zustand: kurzer Satz und Link zu den Frostdaten.
2. **kalender**: Jahr wählbar (Pfeile). Pro Pflanze eine Zeile, zwölf Monatsspalten, Balken in drei Farben für vorziehen, säen, pflanzen, Markierung für heute und beide Frostdaten. Am Handy horizontal scrollbar mit fixierter Namensspalte.
3. **beete**: Liste der Beete, aufklappbar mit Kulturen (Pflanze, Art, Datum, Erntefenster, Ampel). Kultur hinzufügen: Pflanze wählen, Art, Datum (vorbelegt mit heute), Vorschau des Erntefensters vor dem Speichern.
4. **pflanzen**: Liste mit Suche, Bearbeiten in einem Formular (Name, drei optionale Fenster als zwei Zahlenfelder, Kulturdauer min und max, frostempfindlich). Validierung: `von <= bis`, `min <= max`, Wochen zwischen -20 und 30.
5. **einstellungen** (über Zahnrad auf „jetzt"): Frostdaten, Export, Import, Beispiele entfernen, alles löschen, Hinweis zur Rechenweise.

Designsystem über `python3 werkzeuge/hausstil.py`, Labels, Daten und Status in `--mono`, klein. Name `saat.` mit Punkt in `--ac`.

## Testplan

- **Funktionstests** (Node, ohne Browser) für `rechnen.js`: alle vier Handrechnungen oben exakt, dazu Grenzen der Ampel (Ernte bis genau am Herbstfrost ergibt `passt`), Schaltjahr (Frost 03-01 im Jahr 2028 minus 1 Tag = 2028-02-29), Fenster `null` liefert keine Einträge, `ansteht` mit Fenster, das heute endet, ist enthalten.
- **Datenmodell**: Export, dann Import ergibt identisches Objekt; kaputte Datei und höhere Version ändern nichts; Beispiele entfernen lässt eigene Daten unberührt.
- **Playwright bei 390 und 1280 px**: Frostdatum setzen, Kultur anlegen, Erntefenster 2026-07-19 bis 2026-08-13 erscheint; Kalender rendert 14 Zeilen; kein horizontales Scrollen außer im Kalenderraster; hell und dunkel per `prefers-color-scheme`; Screenshots beider Breiten.
- **Offline-Test**: Seite laden, Service Worker aktiv, Netz trennen, neu laden, alle Screens funktionieren, Daten bleiben.
- **Keine externen Requests**: Playwright protokolliert alle Requests, jeder außerhalb des eigenen Ursprungs lässt den Test scheitern.

## Risiken

- **Richtwerte passen nicht überall.** Gegenmittel: alles bearbeitbar, als Spanne angezeigt, deutlich als Richtwert gekennzeichnet, Frostdatum ist Pflicht für sinnvolle Termine.
- **Frostdatum unbekannt.** Vorbelegung 05-10 und 10-15 als markierter Platzhalter, Hinweis „frag nachbarn oder schau in alte notizen", keine Online-Abfrage.
- **Kulturdauer ist vereinfacht** (ab Saat oder Pflanzung, keine Sorten, keine Temperatur). Wird im Rechenhinweis offen gesagt.
- **localStorage kann vom Browser geleert werden.** Hinweis auf Export in den Einstellungen, Datum des letzten Exports anzeigen.
- **Scope-Drift** Richtung Beetplaner mit Raster und Mischkultur: bewusst ausgeschlossen.
- **Kalender am Handy eng.** Fixierte Namensspalte, Monatskürzel in `--mono`, Test bei 390 px.
