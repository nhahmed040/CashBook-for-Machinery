'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../web/logic.js');

test('default CashBook state has a usable Main book and preserves ETB defaults', () => {
  const s = L.defaultState();
  assert.equal(s.current, 'main');
  assert.equal(s.books.length, 1);
  assert.equal(s.books[0].id, 'main');
  assert.equal(s.settings.currency, 'ETB');
});

test('sanitization preserves existing book IDs, names, entries and machine links', () => {
  const raw = {
    current: 'machine-1',
    books: [{
      id: 'machine-1', name: 'Loader · AB-1234', machineId: 'm-1',
      entries: [
        { id: 101, type: 'in', amount: 1250, date: '2026-01-10', category: 'Collection' },
        { id: 102, type: 'out', amount: 250, date: '2026-01-11', category: 'Fuel' }
      ]
    }]
  };
  const s = L.sanitizeState(raw);
  assert.equal(s.current, 'machine-1');
  assert.equal(s.books[0].id, 'machine-1');
  assert.equal(s.books[0].name, 'Loader · AB-1234');
  assert.equal(s.books[0].machineId, 'm-1');
  assert.deepEqual(s.books[0].entries.map(e => e.id), [101, 102]);
  assert.deepEqual(L.totals(s.books[0].entries), { cashIn: 1250, cashOut: 250, balance: 1000 });
});

test('legacy entries migrate into Main without changing transaction identity', () => {
  const s = L.migrateOld([
    { id: 201, type: 'in', amount: 900, date: '2026-02-01', category: 'Sale' }
  ]);
  assert.equal(s.books[0].id, 'main');
  assert.equal(s.books[0].entries[0].id, 201);
  assert.equal(s.books[0].entries[0].amount, 900);
});

test('invalid entries are excluded and valid totals remain deterministic', () => {
  const entries = [
    L.sanitizeEntry({ id: 301, type: 'in', amount: 100.25, date: '2026-03-01' }),
    L.sanitizeEntry({ id: 302, type: 'out', amount: 40.10, date: '2026-03-02' }),
    L.sanitizeEntry({ id: 303, type: 'in', amount: -10, date: '2026-03-03' })
  ].filter(Boolean);
  assert.equal(entries.length, 2);
  assert.deepEqual(L.totals(entries), { cashIn: 100.25, cashOut: 40.1, balance: 60.15 });
});

test('CSV export/import handles commas, quotes and spreadsheet formula safety', () => {
  const entries = [
    L.sanitizeEntry({ id: 401, type: 'in', amount: 50, date: '2026-04-01', category: 'Sale, retail', note: 'Customer said "paid"', party: '=1+1' })
  ];
  const csv = L.buildCsv(entries);
  assert.match(csv, /Sale, retail/);
  assert.match(csv, /Customer said ""paid""/);
  assert.match(csv, /'=1\+1/);
  const rows = L.parseCsv(csv);
  assert.equal(rows[1][3], 'Sale, retail');
  assert.equal(rows[1][4], 'Customer said "paid"');
  assert.equal(rows[1][6], "'=1+1");
});

test('calendar and language settings sanitize to supported values', () => {
  const s = L.sanitizeState({ settings: { lang: 'am', currency: 'ETB', theme: 'dark', calendar: 'ethiopian' } });
  assert.equal(s.settings.lang, 'am');
  assert.equal(s.settings.theme, 'dark');
  assert.equal(s.settings.calendar, 'ethiopian');
});
