'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../web/driver-accounting.js');

test('all driver-held collections count even when no customer is named',()=>{
  const payments=[
    {id:'p1',machineId:'m1',collectorDriverId:'d1',customerId:'',amount:1200,date:'2026-11-01'},
    {id:'p2',machineId:'m1',collectorDriverId:'d1',customerId:'c1',amount:300,date:'2026-11-02'},
    {id:'p3',machineId:'m1',collectorDriverId:'d2',amount:900,date:'2026-11-02'}
  ];
  assert.equal(A.heldBalance(payments,[],'d1','m1'),1500);
});

test('advances increase custody; driver-paid expenses and handovers reduce it once',()=>{
  const ledger=[
    {driverId:'d1',machineId:'m1',type:'advance',amount:500,status:'approved'},
    {driverId:'d1',machineId:'m1',type:'expense-held',amount:125,status:'approved'},
    {driverId:'d1',machineId:'m1',type:'handover',amount:200,status:'approved'},
    {driverId:'d1',machineId:'m1',type:'advance-return',amount:25,status:'approved'},
    {driverId:'d1',machineId:'m1',type:'expense-held',amount:90,status:'pending'}
  ];
  assert.equal(A.heldBalance([],ledger,'d1','m1'),150);
});

test('pending, disputed and rejected transactions do not alter confirmed custody',()=>{
  const ledger=['pending','disputed','rejected'].map(status=>({driverId:'d1',machineId:'m1',type:'advance',amount:100,status}));
  assert.equal(A.heldBalance([],ledger,'d1','m1'),0);
});

test('personal expenses create reimbursement payable until reimbursed',()=>{
  const ledger=[
    {driverId:'d1',type:'personal-expense',amount:250,status:'approved'},
    {driverId:'d1',type:'reimbursement',amount:100,status:'approved'},
    {driverId:'d1',type:'reimbursement',amount:75,status:'pending'}
  ];
  assert.equal(A.payable(ledger,'d1'),150);
});

test('driver reassignment is blocked by cash, reimbursement, disputed expense or pending closing',()=>{
  const base={payments:[],ledger:[],closings:[],driverId:'d1',machineId:'m1'};
  assert.equal(A.reassignmentCheck(base).clear,true);
  assert.equal(A.reassignmentCheck({...base,payments:[{collectorDriverId:'d1',machineId:'m1',amount:1}]}).clear,false);
  assert.equal(A.reassignmentCheck({...base,ledger:[{driverId:'d1',type:'personal-expense',amount:1,status:'approved'}]}).clear,false);
  assert.equal(A.reassignmentCheck({...base,ledger:[{driverId:'d1',machineId:'m1',type:'expense-request',status:'disputed'}]}).clear,false);
  assert.equal(A.reassignmentCheck({...base,closings:[{driverId:'d1',machineId:'m1',status:'pending'}]}).clear,false);
});
