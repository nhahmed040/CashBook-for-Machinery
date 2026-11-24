'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const functions=fs.readFileSync(require.resolve('../functions/index.js'),'utf8');
const owner=fs.readFileSync(require.resolve('../web/machinery.js'),'utf8');
const portal=fs.readFileSync(require.resolve('../web/driver-portal.js'),'utf8');

test('driver-to-driver messaging is an owner-controlled permission disabled by default',()=>{
  assert.match(functions,/PERMISSION_KEYS\s*=\s*\[[^\]]*messageOtherDrivers/);
  assert.match(functions,/out\[key\]=!!\(value&&value\[key\]===true\)/);
  assert.match(owner,/name="messageOtherDrivers"/);
  assert.match(owner,/permissionKeys=\[[^\]]*messageOtherDrivers/);
});

test('trusted messaging functions require active opted-in sender and recipient accounts',()=>{
  assert.match(functions,/account\.active !== true/);
  assert.match(functions,/account\.permissions\.messageOtherDrivers !== true/);
  assert.match(functions,/a\.active===true&&a\.permissions&&a\.permissions\.messageOtherDrivers===true/);
  assert.match(functions,/exports\.sendDriverMessage=onCall/);
  assert.match(functions,/exports\.listDriverContacts=onCall/);
});

test('trusted relay writes private incoming and outgoing copies for the two participants',()=>{
  assert.match(functions,/driverData\/\'\+sender\.driverId\+\'\/messages/);
  assert.match(functions,/driverData\/\'\+recipient\.driverId\+\'\/messages/);
  assert.match(functions,/direction:'outgoing'/);
  assert.match(functions,/direction:'incoming'/);
});

test('driver portal exposes a permission-gated contact picker and sends through trusted Functions',()=>{
  assert.match(portal,/can\('messageOtherDrivers'\)/);
  assert.match(portal,/driverToDriverForm/);
  assert.match(portal,/callDriverFunction\('listDriverContacts'/);
  assert.match(portal,/callDriverFunction\('sendDriverMessage'/);
});

test('owner sync records driver-to-driver messages in the audit trail',()=>{
  assert.match(owner,/logAudit\('Received','Driver-to-driver message',importedMessage,null\)/);
  assert.match(owner,/senderName:r\.senderName\|\|''/);
});
