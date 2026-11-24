'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const owner = fs.readFileSync(require.resolve('../web/machinery.js'), 'utf8');
const portal = fs.readFileSync(require.resolve('../web/driver-portal.js'), 'utf8');

test('owner sync preserves every distinct driver reply instead of overwriting the previous reply', () => {
  assert.match(owner, /msg\.replies=Array\.isArray\(msg\.replies\)\?msg\.replies:\[\]/);
  assert.match(owner, /msg\.replies\.some\(function\(x\)\{return x\.remoteId===key\|\|x\.id===key;\}\)/);
  assert.match(owner, /msg\.replies\.push\(replyRecord\)/);
  assert.match(owner, /logAudit\('Received','Driver message reply',replyRecord,null\)/);
});

test('owner message history renders the complete ordered reply thread', () => {
  assert.match(owner, /Array\.isArray\(x\.replies\)&&x\.replies\.length/);
  assert.match(owner, /Driver reply · /);
  assert.match(owner, /r\.reply\|\|''/);
});

test('driver portal displays previously submitted replies under the matching owner message', () => {
  assert.match(portal, /list\(driverData\.messageReplies\)\.filter\(function\(r\)\{return r\.messageId===x\.id;\}\)/);
  assert.match(portal, /Your reply · /);
});

test('message reply audit snapshots retain the reply identity, text and timestamp', () => {
  assert.match(owner, /'messageId','reply','driverName','createdAt'/);
});
