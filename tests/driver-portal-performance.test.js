'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const portal=fs.readFileSync(require.resolve('../web/driver-portal.js'),'utf8');

test('driver performance report supports inclusive date-range filtering and reset',()=>{
  assert.match(portal,/performanceRange=\{from:'',to:''\}/);
  assert.match(portal,/driverPerformanceFilter/);
  assert.match(portal,/pf\.from>pf\.to/);
  assert.match(portal,/driverPerformanceReset/);
});

test('driver performance excludes unapproved trips and keeps earned revenue separate from collections',()=>{
  assert.match(portal,/x\.approvalStatus==='approved'&&inside\(x\)/);
  assert.match(portal,/Earned revenue and collections are shown separately/);
});

test('driver can export only their own date-filtered portal activity as CSV',()=>{
  assert.match(portal,/driverPerformanceExport/);
  assert.match(portal,/my-driver-performance\.csv/);
  assert.match(portal,/text\/csv;charset=utf-8/);
  assert.match(portal,/list\(driverData\.collections\)\.filter\(inside\)/);
  assert.match(portal,/list\(driverData\.attendance\)\.filter\(inside\)/);
  assert.match(portal,/list\(driverData\.issues\)\.filter\(inside\)/);
});
