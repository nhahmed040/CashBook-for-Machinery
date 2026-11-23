/* Pure driver cash-accountability rules shared by the UI and regression tests. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CBDriverAccounting=factory();
})(this,function(){
  'use strict';
  function heldBalance(payments,ledger,driverId,machineId,upto){
    var n=0;
    (payments||[]).forEach(function(p){
      if(p.collectorDriverId===driverId&&(!machineId||p.machineId===machineId)&&(!upto||p.date<=upto))n+=Number(p.amount)||0;
    });
    (ledger||[]).forEach(function(x){
      if(x.driverId!==driverId||(machineId&&x.machineId!==machineId)||(upto&&x.date>upto)||x.status==='pending'||x.status==='disputed'||x.status==='rejected')return;
      if(x.type==='advance')n+=Number(x.amount)||0;
      else if(x.type==='expense-held'||x.type==='handover'||x.type==='advance-return')n-=Number(x.amount)||0;
    });
    return Math.round(n*100)/100;
  }
  function payable(ledger,driverId,upto){
    var n=0;
    (ledger||[]).forEach(function(x){
      if(x.driverId!==driverId||(upto&&x.date>upto)||x.status==='pending'||x.status==='disputed'||x.status==='rejected')return;
      if(x.type==='personal-expense')n+=Number(x.amount)||0;
      else if(x.type==='reimbursement')n-=Number(x.amount)||0;
    });
    return Math.max(0,Math.round(n*100)/100);
  }
  function reassignmentCheck(args){
    var held=heldBalance(args.payments,args.ledger,args.driverId,args.machineId);
    var owed=payable(args.ledger,args.driverId);
    var pendingExpenses=(args.ledger||[]).filter(function(x){return x.driverId===args.driverId&&x.machineId===args.machineId&&x.type==='expense-request'&&(x.status==='pending'||x.status==='disputed');}).length;
    var pendingClosings=(args.closings||[]).filter(function(x){return x.driverId===args.driverId&&x.machineId===args.machineId&&x.status==='pending';}).length;
    return {held:held,owed:owed,pendingExpenses:pendingExpenses,pendingClosings:pendingClosings,clear:Math.abs(held)<=0.005&&owed<=0.005&&!pendingExpenses&&!pendingClosings};
  }
  return {heldBalance:heldBalance,payable:payable,reassignmentCheck:reassignmentCheck};
});
