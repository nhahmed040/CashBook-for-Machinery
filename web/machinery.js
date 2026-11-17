(function () {
  'use strict';
  var KEY = 'cashbook.machinery.v1';
  var $ = function (id) { return document.getElementById(id); };
  var today = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  var modes = {hour:'hours',day:'days',month:'months',trip:'trips',km:'km',tonne:'tonnes'};
  var data = load();
  var editingMachineId = null;
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); return {machines:Array.isArray(v.machines)?v.machines:[],operations:Array.isArray(v.operations)?v.operations:[],expenses:Array.isArray(v.expenses)?v.expenses:[]}; } catch(e) { return {machines:[],operations:[],expenses:[]}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) { alert('Could not save fleet data. Check available phone storage.'); } }
  function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function money(n) { return 'ETB ' + (Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function machine(id) { return data.machines.find(function(m){return m.id===id;}); }
  function total(arr) { return arr.reduce(function(a,x){return a+(Number(x.amount)||0);},0); }
  function refreshSelects() {
    ['operationMachine','expenseMachine'].forEach(function(id){var s=$(id),old=s.value;s.innerHTML='';data.machines.forEach(function(m){var o=document.createElement('option');o.value=m.id;o.textContent=m.name+' · '+m.type;s.appendChild(o);});if(machine(old))s.value=old;});
  }
  function render() {
    var income=total(data.operations), expenses=total(data.expenses), net=income-expenses;
    $('fleetCount').textContent=String(data.machines.length); $('fleetIncome').textContent=money(income); $('fleetExpenses').textContent=money(expenses);
    $('fleetProfit').textContent='Net operating result: '+money(net)+' · '+(net>=0?'Positive':'Negative');
    refreshSelects();
    $('machineList').innerHTML=data.machines.length?data.machines.map(function(m){
      var mi=total(data.operations.filter(function(x){return x.machineId===m.id;})), me=total(data.expenses.filter(function(x){return x.machineId===m.id;}));
      return '<article class="fleet-machine"><div class="row"><strong>'+esc(m.name)+'</strong><span class="badge">'+esc(m.status)+'</span></div><p>'+esc(m.type)+' · '+esc(m.plate||'No plate')+' · '+esc(m.make||'')+'</p><p>'+esc(m.ownership)+' · '+esc(m.capacity||'Capacity not set')+'</p><p>Rate: '+money(m.rate)+' / '+esc(modes[m.rateMode]||m.rateMode)+'</p><p>Income '+money(mi)+' · Cost '+money(me)+' · Net '+money(mi-me)+'</p><div class="row"><button type="button" class="fleet-edit" data-id="'+esc(m.id)+'">Edit details</button><button type="button" class="danger fleet-delete" data-id="'+esc(m.id)+'">Delete machine</button></div></article>';
    }).join(''):'<p class="empty">No machines registered yet.</p>';
    var tx=data.operations.map(function(x){return Object.assign({kind:'Income'},x);}).concat(data.expenses.map(function(x){return Object.assign({kind:'Expense'},x);})).sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,40);
    $('fleetTransactions').innerHTML=tx.length?'<div class="fleet-table">'+tx.map(function(x){var m=machine(x.machineId);return '<div class="fleet-tx"><div><strong>'+esc(x.kind)+' · '+esc(m?m.name:'Deleted machine')+'</strong><small>'+esc(x.date)+' · '+esc(x.site||x.type||'')+' · '+esc(x.note||'')+'</small></div><b>'+money(x.amount)+'</b></div>';}).join('')+'</div>':'<p class="empty">No operations or expenses recorded yet.</p>';
  }
  function resetMachineForm(){editingMachineId=null;$('machineForm').reset();$('machineRate').value='';$('machineFormTitle').textContent='Register a machine';$('machineSaveButton').textContent='Save machine';$('machineCancelEdit').hidden=true;}
  $('machineCancelEdit').addEventListener('click',resetMachineForm);
  $('machineForm').addEventListener('submit',function(e){e.preventDefault();var existing=editingMachineId?machine(editingMachineId):null;var m={id:existing?existing.id:id(),name:$('machineName').value.trim(),type:$('machineType').value,plate:$('machinePlate').value.trim(),make:$('machineMake').value.trim(),capacity:$('machineCapacity').value.trim(),ownership:$('machineOwnership').value,status:$('machineStatus').value,rateMode:$('machineRateMode').value,rate:Number($('machineRate').value)||0,created:existing?existing.created:today()};if(!m.name||m.rate<0){return;}if(existing){Object.keys(m).forEach(function(k){existing[k]=m[k];});}else{data.machines.push(m);}save();resetMachineForm();render();});
  $('operationDate').value=today(); $('expenseDate').value=today();
  $('operationForm').addEventListener('submit',function(e){e.preventDefault();var m=machine($('operationMachine').value);if(!m){alert('Register a machine first.');return;}var qty=Number($('operationQuantity').value);if(!(qty>0)){return;}var x={id:id(),machineId:m.id,date:$('operationDate').value,site:$('operationSite').value.trim(),operator:$('operationOperator').value.trim(),quantity:qty,unit:modes[m.rateMode],rate:m.rate,amount:qty*m.rate,note:$('operationNote').value.trim()};data.operations.push(x);save();this.reset();$('operationDate').value=today();render();});
  $('expenseForm').addEventListener('submit',function(e){e.preventDefault();var m=machine($('expenseMachine').value);if(!m){alert('Register a machine first.');return;}var amount=Number($('expenseAmount').value);if(!(amount>0)){return;}data.expenses.push({id:id(),machineId:m.id,date:$('expenseDate').value,type:$('expenseType').value,amount:amount,quantity:Number($('expenseQuantity').value)||0,note:$('expenseNote').value.trim()});save();this.reset();$('expenseDate').value=today();render();});
  $('machineList').addEventListener('click',function(e){var edit=e.target.closest('.fleet-edit');if(edit){var m=machine(edit.dataset.id);if(!m)return;editingMachineId=m.id;$('machineName').value=m.name;$('machineType').value=m.type;$('machinePlate').value=m.plate||'';$('machineMake').value=m.make||'';$('machineCapacity').value=m.capacity||'';$('machineOwnership').value=m.ownership;$('machineStatus').value=m.status;$('machineRateMode').value=m.rateMode;$('machineRate').value=m.rate;$('machineFormTitle').textContent='Edit machine details';$('machineSaveButton').textContent='Update machine';$('machineCancelEdit').hidden=false;$('machineForm').scrollIntoView({behavior:'smooth',block:'start'});return;}var b=e.target.closest('.fleet-delete');if(!b)return;var m=machine(b.dataset.id);if(!m)return;if(data.operations.some(function(x){return x.machineId===m.id;})||data.expenses.some(function(x){return x.machineId===m.id;})){alert('This machine has transactions. Keep it in the register and set its status to Inactive instead of deleting it.');return;}if(confirm('Delete '+m.name+'?')){data.machines=data.machines.filter(function(x){return x.id!==m.id;});save();render();}});
  document.querySelectorAll('.tabs button[data-view="machinery"]').forEach(function(b){b.addEventListener('click',render);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});
  render();
})();