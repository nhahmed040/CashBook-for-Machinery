'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const owner = fs.readFileSync(require.resolve('../web/machinery.js'), 'utf8');
const portal = fs.readFileSync(require.resolve('../web/driver-portal.js'), 'utf8');

test('owner attendance screen separates unconfirmed driver submissions into a review queue', () => {
  assert.match(owner, /pendingAttendance=attendanceRows\.filter\(function\(a\)\{return a\.status==='pending-review'&&!a\.ownerConfirmed;\}\)/);
  assert.match(owner, /Driver submissions awaiting review/);
  assert.match(owner, /data-attendance-confirm=/);
  assert.match(owner, /No driver submissions are waiting for review/);
});

test('owner confirmation is audited, saved and synchronized back to driver attendance records', () => {
  assert.match(owner, /logAudit\('Confirmed','Driver attendance',attendance,attendanceBefore\)/);
  assert.match(owner, /attendance\.ownerConfirmed=true/);
  assert.match(owner, /'attendance',remoteId,\{status:'present',ownerConfirmed:true/);
  assert.match(owner, /ownerConfirmationNote/);
});

test('owner attendance corrections continue to require a reason and be audited', () => {
  assert.match(owner, /if\(oldAttendance&&!v\.correctionReason\)/);
  assert.match(owner, /logAudit\(oldAttendance\?'Corrected':'Created','Driver attendance'/);
});

test('driver portal displays whether an attendance submission has been confirmed by the owner', () => {
  assert.match(portal, /x\.ownerConfirmed\?'Confirmed by owner'/);
  assert.match(portal, /Pending owner review/);
});
