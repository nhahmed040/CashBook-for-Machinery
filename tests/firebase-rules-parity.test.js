'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sync = require('../web/sync.js');

test('in-app Firebase rules reference matches the deployable Realtime Database rules', () => {
  const deployedRules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase-rules.json'), 'utf8'));
  assert.deepEqual(sync.RULES, deployedRules);
});
