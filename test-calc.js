// Tests fuer rechnen.js gegen die Handrechnungen aus scope.md
// Aufruf: node test-calc.js
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('./rechnen.js');

const FRUEH = '2026-05-10';
const HERBST = '2026-10-15';
const daten = () => R.standardDaten(2026, false);
const pflanze = (d, id) => d.pflanzen.find(p => p.id === id);

test('handrechnung 1: tomate vorziehen und auspflanzen', () => {
  const tomate = pflanze(daten(), 'rw-tomate');
  assert.deepEqual(R.fenster(FRUEH, tomate.vorziehen), { von: '2026-03-15', bis: '2026-03-29' });
  assert.deepEqual(R.fenster(FRUEH, tomate.auspflanzen), { von: '2026-05-10', bis: '2026-05-31' });
});

test('handrechnung 2: tomate gepflanzt am 2026-05-20', () => {
  const tomate = pflanze(daten(), 'rw-tomate');
  const e = R.ernte({ datum: '2026-05-20' }, tomate);
  assert.deepEqual(e, { von: '2026-07-19', bis: '2026-08-13' });
  assert.equal(R.ampel(e, HERBST, true), 'passt');
});

test('handrechnung 3: buschbohne zu spaet und knapp', () => {
  const bohne = pflanze(daten(), 'rw-buschbohne');
  const spaet = R.ernte({ datum: '2026-08-20' }, bohne);
  assert.deepEqual(spaet, { von: '2026-10-19', bis: '2026-11-03' });
  assert.equal(R.ampel(spaet, HERBST, true), 'zu spät');
  const knapp = R.ernte({ datum: '2026-08-05' }, bohne);
  assert.deepEqual(knapp, { von: '2026-10-04', bis: '2026-10-19' });
  assert.equal(R.ampel(knapp, HERBST, true), 'knapp');
});

test('handrechnung 4: radieschen direkt am 2026-04-01', () => {
  const r = pflanze(daten(), 'rw-radieschen');
  const e = R.ernte({ datum: '2026-04-01' }, r);
  assert.deepEqual(e, { von: '2026-04-26', bis: '2026-05-06' });
  assert.equal(r.frostempfindlich, false);
  assert.equal(R.ampel(e, HERBST, r.frostempfindlich), 'passt');
});

test('kulturInfo nutzt herbstfrost im jahr der kultur', () => {
  const d = daten();
  const info = R.kulturInfo({ pflanzeId: 'rw-buschbohne', datum: '2026-08-20' }, d);
  assert.equal(info.herbst, HERBST);
  assert.equal(info.ampel, 'zu spät');
});

test('ampel grenzen', () => {
  assert.equal(R.ampel({ von: '2026-09-01', bis: HERBST }, HERBST, true), 'passt');
  assert.equal(R.ampel({ von: HERBST, bis: '2026-10-16' }, HERBST, true), 'knapp');
  assert.equal(R.ampel({ von: '2026-10-16', bis: '2026-10-20' }, HERBST, true), 'zu spät');
  assert.equal(R.ampel({ von: '2026-12-01', bis: '2026-12-20' }, HERBST, false), 'passt');
});

test('schaltjahr', () => {
  assert.equal(R.frostImJahr('03-01', 2028), '2028-03-01');
  assert.equal(R.plusTage(R.frostImJahr('03-01', 2028), -1), '2028-02-29');
  assert.equal(R.plusTage('2026-03-01', -1), '2026-02-28');
  assert.equal(R.frostImJahr('02-29', 2027), '2027-02-28');
  assert.equal(R.frostImJahr('02-29', 2028), '2028-02-29');
});

test('zeitumstellung verschiebt keine tage', () => {
  assert.equal(R.plusTage('2026-03-28', 1), '2026-03-29');
  assert.equal(R.plusTage('2026-03-29', 1), '2026-03-30');
  assert.equal(R.plusTage('2026-10-24', 2), '2026-10-26');
  assert.equal(R.tageZwischen('2026-03-01', '2026-04-01'), 31);
});

test('fenster null liefert keine eintraege', () => {
  assert.equal(R.fenster(FRUEH, null), null);
  const d = { version: 1, frost: { fruehjahr: '05-10', herbst: '10-15' }, beete: [], kulturen: [],
    pflanzen: [{ id: 'x', name: 'Leer', vorziehen: null, direktsaat: null, auspflanzen: null, kultur: { min: 1, max: 2 }, frostempfindlich: false, beispiel: false }] };
  assert.deepEqual(R.ansteht('2026-05-10', d).aktionen, []);
  assert.deepEqual(R.kalender(d, 2026, '2026-05-10').zeilen[0].balken, []);
});

test('ansteht: fenster, das heute endet, ist enthalten', () => {
  const d = daten();
  // Tomate auspflanzen endet am 2026-05-31
  const a = R.ansteht('2026-05-31', d).aktionen;
  const t = a.find(x => x.pflanzeId === 'rw-tomate' && x.feld === 'auspflanzen');
  assert.ok(t);
  assert.equal(t.laeuft, true);
  assert.equal(R.ansteht('2026-06-01', d).aktionen.some(x => x.pflanzeId === 'rw-tomate' && x.feld === 'auspflanzen'), false);
});

test('ansteht: fenster in 14 tagen und sortierung', () => {
  const d = daten();
  // Tomate vorziehen beginnt 2026-03-15, also 14 Tage nach dem 2026-03-01
  const a = R.ansteht('2026-03-01', d).aktionen;
  const t = a.find(x => x.pflanzeId === 'rw-tomate' && x.feld === 'vorziehen');
  assert.ok(t);
  assert.equal(t.laeuft, false);
  assert.equal(t.inTagen, 14);
  assert.equal(R.ansteht('2026-02-28', d).aktionen.some(x => x.pflanzeId === 'rw-tomate'), false);
  for (let i = 1; i < a.length; i++) assert.ok(a[i - 1].von <= a[i].von);
});

test('ansteht: ernte mit offenem fenster samt beet', () => {
  const d = R.standardDaten(2026, true);
  const e = R.ansteht('2026-07-25', d).ernten;
  const tomate = e.find(x => x.pflanzeId === 'rw-tomate');
  assert.ok(tomate);
  assert.equal(tomate.von, '2026-07-19');
  assert.equal(tomate.bis, '2026-08-13');
  assert.equal(tomate.beet, 'Beispiel: Hochbeet');
  assert.equal(tomate.laeuft, true);
  assert.equal(R.ansteht('2026-08-14', d).ernten.some(x => x.pflanzeId === 'rw-tomate'), false);
});

test('kalender: 14 zeilen, anteile und vergangen', () => {
  const d = daten();
  const k = R.kalender(d, 2026, '2026-04-01');
  assert.equal(k.zeilen.length, 14);
  const tomate = k.zeilen.find(z => z.id === 'rw-tomate');
  const v = tomate.balken.find(b => b.feld === 'vorziehen');
  assert.equal(v.von, '2026-03-15');
  assert.equal(v.vergangen, true);
  assert.ok(Math.abs(v.start - 73 / 365) < 1e-9);
  assert.equal(tomate.balken.find(b => b.feld === 'auspflanzen').vergangen, false);
  assert.ok(Math.abs(k.frostFruehjahr - 129 / 365) < 1e-9);
  assert.equal(R.kalender(d, 2027, '2026-04-01').heute, null);
});

test('datenmodell: export und import ergibt identisches objekt', () => {
  const d = R.standardDaten(2026, true);
  const r = R.laden(R.exportText(d));
  assert.equal(r.ok, true);
  assert.deepEqual(r.daten, d);
  assert.equal(R.exportName('2026-10-28'), 'saat-2026-10-28.json');
  assert.deepEqual(R.zaehle(d), { pflanzen: 14, beete: 2, kulturen: 3 });
});

test('datenmodell: kaputte datei und hoehere version werden abgelehnt', () => {
  assert.equal(R.laden('{kaputt').ok, false);
  assert.equal(R.laden('{kaputt').grund, 'kaputt');
  const hoch = Object.assign(R.standardDaten(2026, false), { version: 2 });
  const r = R.laden(JSON.stringify(hoch));
  assert.equal(r.ok, false);
  assert.equal(r.grund, 'version');
  const falsch = R.standardDaten(2026, true);
  falsch.kulturen[0].beetId = 'gibtsnicht';
  assert.equal(R.laden(JSON.stringify(falsch)).ok, false);
  assert.equal(R.laden('[]').ok, false);
  assert.equal(R.laden('null').ok, false);
});

test('datenmodell: beispiele entfernen laesst eigene daten unberuehrt', () => {
  const d = R.standardDaten(2026, true);
  d.beete.push({ id: 'b1', name: 'Mein Beet', notiz: '', beispiel: false });
  d.kulturen.push({ id: 'k1', beetId: 'b1', pflanzeId: 'rw-tomate', art: 'gepflanzt', datum: '2026-05-20', beispiel: false });
  d.pflanzen.push({ id: 'p1', name: 'Beispiel: Rauke', vorziehen: null, direktsaat: { von: 0, bis: 4 }, auspflanzen: null, kultur: { min: 30, max: 40 }, frostempfindlich: false, beispiel: true });
  const vorher = JSON.parse(JSON.stringify(d));
  const x = R.entferneBeispiele(d);
  assert.deepEqual(d, vorher, 'eingabe bleibt unveraendert');
  assert.deepEqual(x.beete, [{ id: 'b1', name: 'Mein Beet', notiz: '', beispiel: false }]);
  assert.equal(x.kulturen.length, 1);
  assert.equal(x.kulturen[0].id, 'k1');
  assert.equal(x.pflanzen.length, 14);
  assert.equal(R.anzahlBeispiele(x), 0);
  assert.deepEqual(R.pruefe(x), []);
});

test('pflanze loeschen nimmt kulturen mit', () => {
  const d = R.standardDaten(2026, true);
  assert.equal(R.kulturenVonPflanze(d, 'rw-tomate').length, 1);
  const x = R.loeschePflanze(d, 'rw-tomate');
  assert.equal(x.pflanzen.length, 13);
  assert.equal(x.kulturen.length, 2);
  assert.deepEqual(R.pruefe(x), []);
  const y = R.loescheBeet(d, 'bsp-gemuesebeet');
  assert.equal(y.kulturen.length, 1);
});

test('validierung der pflanze', () => {
  const ok = { name: 'Test', vorziehen: { von: -20, bis: 30 }, direktsaat: null, auspflanzen: null, kultur: { min: 10, max: 10 } };
  assert.deepEqual(R.validierePflanze(ok), []);
  assert.equal(R.validierePflanze({ ...ok, name: ' ' }).length, 1);
  assert.equal(R.validierePflanze({ ...ok, vorziehen: { von: 2, bis: 1 } }).length, 1);
  assert.equal(R.validierePflanze({ ...ok, vorziehen: { von: -21, bis: 1 } }).length, 1);
  assert.equal(R.validierePflanze({ ...ok, vorziehen: { von: 0, bis: 31 } }).length, 1);
  assert.equal(R.validierePflanze({ ...ok, kultur: { min: 20, max: 10 } }).length, 1);
});

test('richtwerte stimmen mit der tabelle', () => {
  const p = R.richtwerte();
  assert.equal(p.length, 14);
  assert.ok(p.every(x => x.beispiel === false && R.istRichtwert(x)));
  const salat = p.find(x => x.id === 'rw-pfluecksalat');
  assert.deepEqual([salat.vorziehen, salat.direktsaat, salat.auspflanzen, salat.kultur],
    [{ von: -8, bis: -4 }, { von: -4, bis: 12 }, { von: -4, bis: 8 }, { min: 45, max: 60 }]);
  assert.deepEqual(R.pruefe(R.standardDaten(2026, true)), []);
});
