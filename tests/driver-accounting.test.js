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

test('driver statement publishes only that driver’s collections and ledger history',()=>{
  const payments=[
    {id:'p1',collectorDriverId:'d1',machineId:'m1',customerName:'Customer A',amount:300,date:'2026-11-02',method:'Cash'},
    {id:'p2',collectorDriverId:'d2',machineId:'m2',amount:900,date:'2026-11-03'}
  ];
  const ledger=[
    {id:'l1',driverId:'d1',machineId:'m1',type:'advance',amount:500,date:'2026-11-01',status:'approved',note:'Fuel advance'},
    {id:'l2',driverId:'d1',machineId:'m1',type:'expense-request',amount:75,date:'2026-11-04',status:'pending',category:'Repair'}
  ];
  const rows=A.statement(payments,ledger,'d1');
  assert.deepEqual(rows.map(x=>x.id),['ledger:l2','payment:p1','ledger:l1']);
  assert.equal(rows[0].status,'pending');
  assert.equal(rows[1].type,'Customer collection');
  assert.equal(rows[2].type,'Cash advance');
  assert.equal(rows.length,3);
});

test('driver report metrics separate approved work, custody movements and owner reimbursements',()=>{
  const args={
    driverId:'d1',from:'2026-11-01',to:'2026-11-30',machineId:'m1',
    trips:[
      {driverId:'d1',machineId:'m1',date:'2026-11-02',amount:1000,approvalStatus:'approved'},
      {driverId:'d1',machineId:'m1',date:'2026-11-03',amount:500,approvalStatus:'pending'},
      {driverId:'d1',machineId:'m2',date:'2026-11-03',amount:700,approvalStatus:'approved'}
    ],
    payments:[
      {collectorDriverId:'d1',machineId:'m1',date:'2026-11-04',amount:300},
      {collectorDriverId:'d2',machineId:'m1',date:'2026-11-04',amount:900}
    ],
    expenses:[{driverId:'d1',machineId:'m1',date:'2026-11-05',amount:80}],
    ledger:[
      {id:'a',driverId:'d1',machineId:'m1',date:'2026-11-01',type:'advance',amount:200,status:'approved'},
      {id:'h',driverId:'d1',machineId:'m1',date:'2026-11-06',type:'handover',amount:100,status:'approved'},
      {id:'e',driverId:'d1',machineId:'m1',date:'2026-11-07',type:'expense-held',amount:20,status:'approved'},
      {id:'p',driverId:'d1',machineId:'m1',date:'2026-11-08',type:'personal-expense',amount:60,status:'approved'},
      {id:'r',driverId:'d1',machineId:'m1',date:'2026-11-09',type:'reimbursement',amount:10,status:'approved'}
    ],
    attendance:[{driverId:'d1',machineId:'m1',date:'2026-11-02'}],
    issues:[{driverId:'d1',machineId:'m1',date:'2026-11-03'}]
  };
  const m=A.reportMetrics(args);
  assert.equal(m.trips,1);
  assert.equal(m.earned,1000);
  assert.equal(m.collections,300);
  assert.equal(m.advances,200);
  assert.equal(m.handovers,100);
  assert.equal(m.heldExpenses,20);
  assert.equal(m.heldBalance,380);
  assert.equal(m.reimbursementDue,50);
  assert.equal(m.attendance,1);
  assert.equal(m.issues,1);
});

test('driver statement contains only the selected driver’s collection and ledger rows',()=>{
 const payments=[{id:'p1',collectorDriverId:'d1',machineId:'m1',customerName:'Customer A',amount:300,date:'2026-11-02'},{id:'p2',collectorDriverId:'d2',machineId:'m2',amount:900,date:'2026-11-03'}];
 const ledger=[{id:'l1',driverId:'d1',machineId:'m1',type:'advance',amount:500,date:'2026-11-01',status:'approved'},{id:'l2',driverId:'d1',machineId:'m1',type:'expense-request',amount:75,date:'2026-11-04',status:'pending'}];
 const rows=A.statement(payments,ledger,'d1');
 assert.deepEqual(rows.map(x=>x.id),['ledger:l2','payment:p1','ledger:l1']);
 assert.equal(rows[0].status,'pending');assert.equal(rows[1].type,'Customer collection');assert.equal(rows.length,3);
});
