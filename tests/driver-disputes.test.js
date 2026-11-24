'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const rules = require('../firebase-rules.json').rules.driverData.$driverId;
const portal = fs.readFileSync(require.resolve('../web/driver-portal.js'), 'utf8');
const owner = fs.readFileSync(require.resolve('../web/machinery.js'), 'utf8');

test('driver disputes are limited to the authenticated driver and enabled permission', () => {
  const rule = rules.disputes.$disputeId['.write'];
  assert.match(rule, /auth\.token\.driverId === \$driverId/);
  assert.match(rule, /permissions\.reportDisputes === true/);
  assert.match(rule, /newData\.child\('driverId'\)\.val\(\) === \$driverId/);
  assert.match(rule, /newData\.child\('notificationId'\)\.exists\(\)/);
  assert.match(rule, /!data\.exists\(\)/);
});

test('driver portal submits a reasoned dispute and shows dispute history', () => {
  assert.match(portal, /driver-dispute-form/);
  assert.match(portal, /submitRecord\('disputes'/);
  assert.match(portal, /My dispute history/);
});

test('owner sync imports disputes and requires an audited resolution note', () => {
  assert.match(owner, /disputeMap=remote\.disputes\|\|\{\}/);
  assert.match(owner, /Driver financial dispute/);
  assert.match(owner, /Resolve dispute/);
  assert.match(owner, /ownerResponse/);
});
