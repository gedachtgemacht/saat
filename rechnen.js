/* saat. Rechenlogik: reine Funktionen ohne DOM, laeuft in Node und im Browser.
   Daten sind reine Kalenderdaten JJJJ-MM-TT, gerechnet wird ueber Date.UTC,
   damit die Zeitumstellung keine Tage verschiebt. */
(function (root, fabrik) {
  const api = fabrik();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Rechnen = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = 1;
  const TAG = 86400000;
  const STANDARD_FROST = { fruehjahr: '05-10', herbst: '10-15' };
  const AKTIONEN = [
    ['vorziehen', 'vorziehen'],
    ['direktsaat', 'säen'],
    ['auspflanzen', 'pflanzen']
  ];
  const ARTEN = ['direkt', 'gepflanzt'];
  const WOCHEN_MIN = -20;
  const WOCHEN_MAX = 30;

  /* ---------- Datum ---------- */

  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  function istSchaltjahr(j) { return (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0; }

  function tageImMonat(j, m) { return [31, istSchaltjahr(j) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }

  function istDatum(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return false;
    const j = +m[1], mo = +m[2], t = +m[3];
    return mo >= 1 && mo <= 12 && t >= 1 && t <= tageImMonat(j, mo);
  }

  function zuMs(datum) {
    if (!istDatum(datum)) throw new Error('ungültiges datum: ' + datum);
    return Date.UTC(+datum.slice(0, 4), +datum.slice(5, 7) - 1, +datum.slice(8, 10));
  }

  function ausMs(ms) {
    const d = new Date(ms);
    return d.getUTCFullYear() + '-' + zwei(d.getUTCMonth() + 1) + '-' + zwei(d.getUTCDate());
  }

  // MM-TT gilt fuer jedes Jahr, 02-29 ist erlaubt
  function istMmtt(s) {
    const m = /^(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return false;
    const mo = +m[1], t = +m[2];
    return mo >= 1 && mo <= 12 && t >= 1 && t <= tageImMonat(2028, mo);
  }

  // 02-29 in einem Jahr ohne Schalttag wird zum 02-28
  function frostImJahr(mmtt, jahr) {
    if (!istMmtt(mmtt)) throw new Error('ungültiges frostdatum: ' + mmtt);
    const mo = +mmtt.slice(0, 2);
    const t = Math.min(+mmtt.slice(3, 5), tageImMonat(jahr, mo));
    return jahr + '-' + zwei(mo) + '-' + zwei(t);
  }

  function plusTage(datum, n) { return ausMs(zuMs(datum) + n * TAG); }

  function tageZwischen(a, b) { return Math.round((zuMs(b) - zuMs(a)) / TAG); }

  /* ---------- Kernrechnung ---------- */

  // Fenster in Wochen relativ zum letzten Fruehjahrsfrost
  function fenster(frostFruehjahr, w) {
    if (!w) return null;
    return { von: plusTage(frostFruehjahr, 7 * w.von), bis: plusTage(frostFruehjahr, 7 * w.bis) };
  }

  // Kulturdauer zaehlt ab Direktsaat bzw. Auspflanzung
  function ernte(kultur, pflanze) {
    return { von: plusTage(kultur.datum, pflanze.kultur.min), bis: plusTage(kultur.datum, pflanze.kultur.max) };
  }

  // ISO-Daten lassen sich als Zeichenkette vergleichen
  function ampel(e, herbstfrost, frostempfindlich) {
    if (!frostempfindlich) return 'passt';
    if (e.von > herbstfrost) return 'zu spät';
    if (e.bis > herbstfrost) return 'knapp';
    return 'passt';
  }

  // Herbstfrost im Jahr der Kultur
  function kulturInfo(kultur, daten) {
    const p = daten.pflanzen.find(x => x.id === kultur.pflanzeId);
    if (!p) return null;
    const e = ernte(kultur, p);
    const herbst = frostImJahr(daten.frost.herbst, +kultur.datum.slice(0, 4));
    return { pflanze: p, ernte: e, herbst, ampel: ampel(e, herbst, p.frostempfindlich) };
  }

  function ansteht(heute, daten, tage) {
    if (tage === undefined) tage = 14;
    const grenze = plusTage(heute, tage);
    const jahr = +heute.slice(0, 4);
    const aktionen = [];
    for (const p of daten.pflanzen) {
      for (const [feld, aktion] of AKTIONEN) {
        if (!p[feld]) continue;
        for (const j of [jahr - 1, jahr, jahr + 1]) {
          const f = fenster(frostImJahr(daten.frost.fruehjahr, j), p[feld]);
          if (f.von <= grenze && f.bis >= heute) {
            aktionen.push({
              pflanzeId: p.id, name: p.name, feld, aktion, von: f.von, bis: f.bis,
              laeuft: f.von <= heute, inTagen: Math.max(0, tageZwischen(heute, f.von)), beispiel: !!p.beispiel
            });
          }
        }
      }
    }
    aktionen.sort((a, b) => (a.von < b.von ? -1 : a.von > b.von ? 1 : a.name.localeCompare(b.name, 'de')));

    const ernten = [];
    for (const k of daten.kulturen) {
      const info = kulturInfo(k, daten);
      if (!info) continue;
      const e = info.ernte;
      if (e.von <= grenze && e.bis >= heute) {
        const beet = daten.beete.find(b => b.id === k.beetId);
        ernten.push({
          kulturId: k.id, pflanzeId: k.pflanzeId, name: info.pflanze.name, beetId: k.beetId,
          beet: beet ? beet.name : '', art: k.art, von: e.von, bis: e.bis,
          laeuft: e.von <= heute, inTagen: Math.max(0, tageZwischen(heute, e.von)),
          ampel: info.ampel, beispiel: !!k.beispiel
        });
      }
    }
    ernten.sort((a, b) => (a.von < b.von ? -1 : a.von > b.von ? 1 : 0));
    return { aktionen, ernten };
  }

  // Jahreskalender: Balken als Anteile 0..1 des Jahres, vergangene Fenster grau
  function kalender(daten, jahr, heute) {
    const start = jahr + '-01-01';
    const laenge = istSchaltjahr(jahr) ? 366 : 365;
    const anteil = d => Math.min(1, Math.max(0, tageZwischen(start, d) / laenge));
    const imJahr = d => +d.slice(0, 4) === jahr;
    const zeilen = daten.pflanzen.map(p => {
      const balken = [];
      for (const [feld, aktion] of AKTIONEN) {
        if (!p[feld]) continue;
        for (const j of [jahr - 1, jahr, jahr + 1]) {
          const f = fenster(frostImJahr(daten.frost.fruehjahr, j), p[feld]);
          if (f.bis < start || f.von > jahr + '-12-31') continue;
          // Ende inklusiv: Balken reicht bis zum Ende des Tages
          balken.push({ feld, aktion, von: f.von, bis: f.bis, start: anteil(f.von), ende: anteil(plusTage(f.bis, 1)), vergangen: !!heute && f.bis < heute });
        }
      }
      return { id: p.id, name: p.name, beispiel: !!p.beispiel, balken };
    });
    const ff = frostImJahr(daten.frost.fruehjahr, jahr);
    const hf = frostImJahr(daten.frost.herbst, jahr);
    return {
      jahr, zeilen,
      heute: heute && imJahr(heute) ? anteil(heute) : null,
      frostFruehjahr: anteil(ff), frostHerbst: anteil(hf)
    };
  }

  /* ---------- Datenmodell ---------- */

  const w = (von, bis) => ({ von, bis });
  const RICHTWERTE = [
    ['rw-tomate', 'Tomate', w(-8, -6), null, w(0, 3), 60, 85, true],
    ['rw-paprika', 'Paprika', w(-10, -8), null, w(1, 3), 70, 90, true],
    ['rw-gurke', 'Gurke', w(-4, -3), w(1, 4), w(1, 3), 50, 70, true],
    ['rw-zucchini', 'Zucchini', w(-4, -3), w(1, 3), w(1, 3), 45, 60, true],
    ['rw-kuerbis', 'Kürbis', w(-4, -3), null, w(1, 3), 90, 120, true],
    ['rw-buschbohne', 'Buschbohne', null, w(1, 10), null, 60, 75, true],
    ['rw-erbse', 'Erbse', null, w(-6, -2), null, 60, 80, false],
    ['rw-moehre', 'Möhre', null, w(-4, 8), null, 70, 110, false],
    ['rw-radieschen', 'Radieschen', null, w(-4, 16), null, 25, 35, false],
    ['rw-pfluecksalat', 'Pflücksalat', w(-8, -4), w(-4, 12), w(-4, 8), 45, 60, false],
    ['rw-spinat', 'Spinat', null, w(-6, -2), null, 40, 55, false],
    ['rw-kohlrabi', 'Kohlrabi', w(-8, -5), null, w(-3, 6), 50, 70, false],
    ['rw-steckzwiebel', 'Steckzwiebel', null, null, w(-4, 0), 90, 120, false],
    ['rw-mangold', 'Mangold', null, w(-2, 6), null, 60, 80, false]
  ];

  const kopie = o => JSON.parse(JSON.stringify(o));

  function richtwerte() {
    return RICHTWERTE.map(([id, name, vorziehen, direktsaat, auspflanzen, min, max, fe]) => kopie({
      id, name, vorziehen, direktsaat, auspflanzen, kultur: { min, max }, frostempfindlich: fe, beispiel: false
    }));
  }

  function istRichtwert(p) { return /^rw-/.test(p.id); }

  // Erfundene Demodaten, alle mit beispiel: true
  function beispiele(jahr) {
    return {
      beete: [
        { id: 'bsp-hochbeet', name: 'Beispiel: Hochbeet', notiz: 'erfunden, zum ausprobieren', beispiel: true },
        { id: 'bsp-gemuesebeet', name: 'Beispiel: Gemüsebeet', notiz: 'erfunden, zum ausprobieren', beispiel: true }
      ],
      kulturen: [
        { id: 'bsp-k1', beetId: 'bsp-hochbeet', pflanzeId: 'rw-tomate', art: 'gepflanzt', datum: jahr + '-05-20', beispiel: true },
        { id: 'bsp-k2', beetId: 'bsp-gemuesebeet', pflanzeId: 'rw-radieschen', art: 'direkt', datum: jahr + '-04-01', beispiel: true },
        { id: 'bsp-k3', beetId: 'bsp-gemuesebeet', pflanzeId: 'rw-buschbohne', art: 'direkt', datum: jahr + '-06-01', beispiel: true }
      ]
    };
  }

  function standardDaten(jahr, mitBeispielen) {
    const b = mitBeispielen ? beispiele(jahr) : { beete: [], kulturen: [] };
    return { version: VERSION, frost: kopie(STANDARD_FROST), pflanzen: richtwerte(), beete: b.beete, kulturen: b.kulturen };
  }

  function istFensterOk(f) {
    return f === null || (f && typeof f === 'object' && Number.isInteger(f.von) && Number.isInteger(f.bis) &&
      f.von <= f.bis && f.von >= WOCHEN_MIN && f.bis <= WOCHEN_MAX);
  }

  // Formularpruefung fuer eine Pflanze, liefert Liste von Fehlertexten
  function validierePflanze(p) {
    const f = [];
    if (!p || typeof p.name !== 'string' || !p.name.trim()) f.push('name fehlt');
    for (const [feld, aktion] of AKTIONEN) {
      const x = p ? p[feld] : undefined;
      if (x === null) continue;
      if (!x || !Number.isInteger(x.von) || !Number.isInteger(x.bis)) { f.push(aktion + ': ganze wochen eintragen'); continue; }
      if (x.von < WOCHEN_MIN || x.bis > WOCHEN_MAX || x.von > WOCHEN_MAX || x.bis < WOCHEN_MIN) f.push(aktion + ': wochen zwischen ' + WOCHEN_MIN + ' und ' + WOCHEN_MAX);
      if (x.von > x.bis) f.push(aktion + ': von muss kleiner oder gleich bis sein');
    }
    const k = p ? p.kultur : null;
    if (!k || !Number.isInteger(k.min) || !Number.isInteger(k.max)) f.push('kulturdauer: ganze tage eintragen');
    else {
      if (k.min < 1 || k.max > 365) f.push('kulturdauer: zwischen 1 und 365 tagen');
      if (k.min > k.max) f.push('kulturdauer: min muss kleiner oder gleich max sein');
    }
    return f;
  }

  // Schema pruefen, liefert Liste von Fehlertexten (leer heisst gueltig)
  function pruefe(d) {
    const f = [];
    if (!d || typeof d !== 'object' || Array.isArray(d)) return ['kein objekt'];
    if (d.version !== VERSION) f.push('version');
    if (!d.frost || !istMmtt(d.frost.fruehjahr) || !istMmtt(d.frost.herbst)) f.push('frost');
    if (!Array.isArray(d.pflanzen) || !Array.isArray(d.beete) || !Array.isArray(d.kulturen)) return f.concat('listen fehlen');
    const ids = new Set();
    for (const p of d.pflanzen) {
      if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id)) { f.push('pflanze id'); continue; }
      ids.add(p.id);
      if (typeof p.name !== 'string' || !p.name.trim()) f.push('pflanze name');
      if (!istFensterOk(p.vorziehen) || !istFensterOk(p.direktsaat) || !istFensterOk(p.auspflanzen)) f.push('pflanze fenster ' + p.id);
      if (!p.kultur || !Number.isInteger(p.kultur.min) || !Number.isInteger(p.kultur.max) || p.kultur.min > p.kultur.max || p.kultur.min < 0) f.push('pflanze kultur ' + p.id);
      if (typeof p.frostempfindlich !== 'boolean' || typeof p.beispiel !== 'boolean') f.push('pflanze schalter ' + p.id);
    }
    const beetIds = new Set();
    for (const b of d.beete) {
      if (!b || typeof b.id !== 'string' || !b.id || beetIds.has(b.id)) { f.push('beet id'); continue; }
      beetIds.add(b.id);
      if (typeof b.name !== 'string' || typeof b.notiz !== 'string' || typeof b.beispiel !== 'boolean') f.push('beet ' + b.id);
    }
    const kIds = new Set();
    for (const k of d.kulturen) {
      if (!k || typeof k.id !== 'string' || !k.id || kIds.has(k.id)) { f.push('kultur id'); continue; }
      kIds.add(k.id);
      if (!beetIds.has(k.beetId) || !ids.has(k.pflanzeId)) f.push('kultur verweis ' + k.id);
      if (ARTEN.indexOf(k.art) < 0 || !istDatum(k.datum) || typeof k.beispiel !== 'boolean') f.push('kultur ' + k.id);
    }
    return f;
  }

  // Migrationen: MIGRATIONEN[n] macht aus Version n die Version n + 1
  const MIGRATIONEN = {};

  function migriere(d) {
    let x = kopie(d);
    while (x.version < VERSION) {
      const fn = MIGRATIONEN[x.version];
      if (!fn) throw new Error('keine migration fuer version ' + x.version);
      x = fn(x);
    }
    return x;
  }

  // Text laden: { ok, daten } oder { ok: false, grund: 'kaputt' | 'version' | 'schema', fehler }
  function laden(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { return { ok: false, grund: 'kaputt', fehler: ['kein json'] }; }
    if (!d || typeof d !== 'object' || !Number.isInteger(d.version)) return { ok: false, grund: 'schema', fehler: ['version fehlt'] };
    if (d.version > VERSION) return { ok: false, grund: 'version', fehler: ['version ' + d.version] };
    try { d = migriere(d); } catch (e) { return { ok: false, grund: 'schema', fehler: [e.message] }; }
    const f = pruefe(d);
    if (f.length) return { ok: false, grund: 'schema', fehler: f };
    return { ok: true, daten: d };
  }

  function exportText(d) { return JSON.stringify(d, null, 2); }

  function exportName(heute) { return 'saat-' + heute + '.json'; }

  function zaehle(d) { return { pflanzen: d.pflanzen.length, beete: d.beete.length, kulturen: d.kulturen.length }; }

  function anzahlBeispiele(d) {
    return d.pflanzen.filter(x => x.beispiel).length + d.beete.filter(x => x.beispiel).length + d.kulturen.filter(x => x.beispiel).length;
  }

  // Alles mit beispiel: true entfernen, dazu Kulturen ohne Beet oder Pflanze
  function entferneBeispiele(d) {
    const x = kopie(d);
    x.pflanzen = x.pflanzen.filter(p => !p.beispiel);
    x.beete = x.beete.filter(b => !b.beispiel);
    const pIds = new Set(x.pflanzen.map(p => p.id));
    const bIds = new Set(x.beete.map(b => b.id));
    x.kulturen = x.kulturen.filter(k => !k.beispiel && pIds.has(k.pflanzeId) && bIds.has(k.beetId));
    return x;
  }

  function kulturenVonPflanze(d, id) { return d.kulturen.filter(k => k.pflanzeId === id); }

  function loeschePflanze(d, id) {
    const x = kopie(d);
    x.pflanzen = x.pflanzen.filter(p => p.id !== id);
    x.kulturen = x.kulturen.filter(k => k.pflanzeId !== id);
    return x;
  }

  function loescheBeet(d, id) {
    const x = kopie(d);
    x.beete = x.beete.filter(b => b.id !== id);
    x.kulturen = x.kulturen.filter(k => k.beetId !== id);
    return x;
  }

  return {
    VERSION, STANDARD_FROST, AKTIONEN, ARTEN, WOCHEN_MIN, WOCHEN_MAX,
    istSchaltjahr, tageImMonat, istDatum, istMmtt, frostImJahr, plusTage, tageZwischen,
    fenster, ernte, ampel, kulturInfo, ansteht, kalender,
    richtwerte, istRichtwert, beispiele, standardDaten, validierePflanze, pruefe, migriere, laden,
    exportText, exportName, zaehle, anzahlBeispiele, entferneBeispiele, kulturenVonPflanze, loeschePflanze, loescheBeet
  };
});
