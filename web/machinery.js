(function(){
'use strict';
var KEY='cashbook.machinery.v1', $=function(id){return document.getElementById(id);};
var today=function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
var uid=function(){return 'm'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);};
var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var money=function(n){return 'ETB '+(Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});};
var state=load(), activeTab='dashboard';
function load(){try{var x=JSON.parse(localStorage.getItem(KEY)||'{}');return {machines:Array.isArray(x.machines)?x.machines:[],operations:Array.isArray(x.operations)?x.operations:[],expenses:Array.isArray(x.expenses)?x.expenses:[],trips:Array.isArray(x.trips)?x.trips:[],customers:Array.isArray(x.customers)?x.customers:[],drivers:Array.isArray(x.drivers)?x.drivers:[],payments:Array.isArray(x.payments)?x.payments:[]};}catch(e){return {machines:[],operations:[],expenses:[],trips:[],customers:[],drivers:[],payments:[]};}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){alert('Unable to save. Phone storage may be full.');}}
function total(a){return a.reduce(function(s,x){return s+(Number(x.amount)||0);},0);}
function machine(id){return state.machines.find(function(x){return x.id===id;});}
function customer(id){return state.customers.find(function(x){return x.id===id;});}
function driver(id){return state.drivers.find(function(x){return x.id===id;});}
function ensureCustomer(name,phone){name=(name||'').trim();if(!name)return null;var c=state.customers.find(function(x){return x.name.toLowerCase()===name.toLowerCase();});if(!c){c={id:uid(),name:name,phone:(phone||'').trim(),created:today()};state.customers.push(c);}else if(phone&&!c.phone)c.phone=phone;return c;}
function earned(cId,mId){return total(state.trips.filter(function(t){return t.customerId===cId&&(!mId||t.machineId===mId);}));}
function collected(cId,mId){return total(state.payments.filter(function(p){return p.customerId===cId&&(!mId||p.machineId===mId);}));}
function outstanding(cId,mId){return earned(cId,mId)-collected(cId,mId);}
function machineBook(m){return window.CBMachineBooks&&window.CBMachineBooks.ensure?window.CBMachineBooks.ensure(m):null;}
function postCash(m,type,id,data){return !!(window.CBMachineBooks&&window.CBMachineBooks.postCash&&window.CBMachineBooks.postCash(m,type,id,data));}
function rateLabel(m){return ({trip:'per trip',tonne:'per tonne',m3:'per m³',hour:'per hour',day:'per day',job:'per job'})[m.rateMode]||'per trip';}
function nav(){return '<div class="mach-head"><div><h2>Fleet & Hauling</h2><p>Trip records, customer accounts and machine performance</p></div><span class="mach-live">LOCAL DATA</span></div><div class="mach-nav">'+[['dashboard','Overview'],['trips','Trips & loads'],['machines','Machinery'],['customers','Customers'],['drivers','Drivers'],['payments','Payments'],['expenses','Expenses']].map(function(x){return '<button type="button" data-mtab="'+x[0]+'" class="'+(activeTab===x[0]?'on':'')+'">'+x[1]+'</button>';}).join('')+'</div>';}
function render(){
var root=$('machineryApp');if(!root)return;
var earnedTotal=total(state.trips),paidTotal=total(state.payments),costTotal=total(state.expenses),due=earnedTotal-paidTotal;
var body='';
if(activeTab==='dashboard'){
var todayTrips=state.trips.filter(function(t){return t.date===today();});
body='<div class="mach-kpis"><article><small>Trips today</small><b>'+todayTrips.reduce(function(s,t){return s+(Number(t.tripCount)||1);},0)+'</b></article><article><small>Earned today</small><b>'+money(total(todayTrips))+'</b></article><article><small>Cash collected</small><b>'+money(paidTotal)+'</b></article><article><small>Customer balances due</small><b>'+money(due)+'</b></article></div>'+
'<div class="mach-panel"><h3>Business performance</h3><div class="mach-metrics"><span>Earned revenue<strong>'+money(earnedTotal)+'</strong></span><span>Cash received<strong>'+money(paidTotal)+'</strong></span><span>Recorded expenses<strong>'+money(costTotal)+'</strong></span><span>Operating result*<strong>'+money(earnedTotal-costTotal)+'</strong></span></div><p class="mach-note">*Operating result uses recorded expenses only. Customer payments are not counted as new revenue.</p></div>'+
'<div class="mach-panel"><h3>Fleet status</h3><div class="mach-metrics"><span>Registered machines<strong>'+state.machines.length+'</strong></span><span>Working<strong>'+state.machines.filter(function(m){return m.status==='Working';}).length+'</strong></span><span>Drivers<strong>'+state.drivers.length+'</strong></span><span>Customers<strong>'+state.customers.length+'</strong></span></div></div>'+
'<div class="mach-panel"><h3>Recent trips</h3>'+tripRows(state.trips.slice().sort(sortDate).slice(0,5))+'</div>';
}else if(activeTab==='trips'){
body='<div class="mach-panel"><h3>Record a completed trip / load</h3><p class="mach-note">Use one record for a single trip or enter several identical trips together. Revenue is earned when the work is completed, whether or not the customer has paid.</p><form id="tripForm" class="mach-form">'+
'<label>Truck / machine<select name="machineId" required>'+machineOptions()+'</select></label><div class="mach-two"><label>Date<input name="date" type="date" value="'+today()+'" required></label><label>Ticket / reference<input name="ticket" maxlength="40" placeholder="Optional ticket no."></label></div>'+
'<label>Customer / contractor<input name="customer" list="customerNames" required placeholder="Customer name"><datalist id="customerNames">'+state.customers.map(function(c){return '<option value="'+esc(c.name)+'">';}).join('')+'</datalist></label>'+
'<div class="mach-two"><label>Driver<select name="driverId"><option value="">Not assigned</option>'+state.drivers.map(function(d){return '<option value="'+esc(d.id)+'">'+esc(d.name)+'</option>';}).join('')+'</select></label><label>Number of trips<input name="tripCount" type="number" min="1" step="1" value="1" required></label></div>'+
'<div class="mach-two"><label>Material<select name="material"><option>Sand</option><option>Stone</option><option>Aggregate</option><option>Gravel</option><option>Soil</option><option>Crushed stone</option><option>Other</option></select></label><label>Load quantity (optional)<input name="quantity" type="number" min="0" step="0.01" placeholder="e.g. 18"></label></div>'+
'<div class="mach-two"><label>Quantity unit<select name="unit"><option value="m³">m³</option><option value="tonne">tonne</option><option value="load">load</option></select></label><label>Rate basis<select name="basis"><option value="trip">Per trip</option><option value="tonne">Per tonne</option><option value="m3">Per m³</option></select></label></div>'+
'<div class="mach-two"><label>Rate (ETB)<input name="rate" type="number" min="0.01" step="0.01" required placeholder="Agreed rate"></label><label>Loading point<input name="origin" maxlength="80" placeholder="Loading location"></label></div>'+
'<label>Delivery destination<input name="destination" maxlength="80" placeholder="Delivery site / location"></label><label>Notes<input name="note" maxlength="160" placeholder="Optional details"></label><button class="primary" type="submit">Save completed trip</button></form></div>'+
'<div class="mach-panel"><h3>Trip history</h3>'+tripRows(state.trips.slice().sort(sortDate))+'</div>';
}else if(activeTab==='machines'){
body='<div class="mach-panel"><h3>Register machinery</h3><form id="machineForm" class="mach-form"><label>Machine name<input name="name" required placeholder="Dump Truck 01"></label><div class="mach-two"><label>Type<select name="type"><option>Dump truck / tipper</option><option>Wheel loader</option><option>Excavator</option><option>Bulldozer</option><option>Motor grader</option><option>Roller / compactor</option><option>Water truck</option><option>Crane</option><option>Other</option></select></label><label>Plate / fleet ID<input name="plate" placeholder="Plate number"></label></div><div class="mach-two"><label>Make / model<input name="make"></label><label>Capacity<input name="capacity" placeholder="e.g. 20 m³"></label></div><div class="mach-two"><label>Default rate basis<select name="rateMode"><option value="trip">Per trip</option><option value="tonne">Per tonne</option><option value="m3">Per m³</option><option value="hour">Per hour</option><option value="day">Per day</option><option value="job">Per job</option></select></label><label>Default rate (ETB)<input name="rate" type="number" min="0" step=".01" value="0"></label></div><div class="mach-two"><label>Ownership<select name="ownership"><option>Owned</option><option>Leased</option><option>Hired</option></select></label><label>Status<select name="status"><option>Available</option><option>Working</option><option>Under Maintenance</option><option>Breakdown</option><option>Inactive</option></select></label></div><button class="primary">Save machine</button></form></div><div class="mach-panel"><h3>Fleet register</h3>'+state.machines.map(function(m){return '<div class="mach-record"><b>'+esc(m.name)+'</b><span>'+esc(m.type)+' · '+esc(m.plate||'No plate')+'</span><span>'+esc(m.status)+' · '+rateLabel(m)+'</span></div>';}).join('')+'</div>';
}else if(activeTab==='customers'){
body='<div class="mach-panel"><h3>Customer accounts</h3><p class="mach-note">Balances are calculated from completed trip revenue less recorded customer payments.</p>'+state.customers.map(function(c){return '<div class="mach-record"><b>'+esc(c.name)+'</b><span>'+esc(c.phone||'No phone recorded')+'</span><span>Earned: '+money(earned(c.id))+' · Paid: '+money(collected(c.id))+'</span><strong>Outstanding: '+money(outstanding(c.id))+'</strong></div>';}).join('')+'</div>';
}else if(activeTab==='drivers'){
body='<div class="mach-panel"><h3>Register driver / operator</h3><form id="driverForm" class="mach-form"><label>Full name<input name="name" required></label><div class="mach-two"><label>Phone<input name="phone" type="tel"></label><label>Licence / ID<input name="licence"></label></div><button class="primary">Save driver</button></form></div><div class="mach-panel"><h3>Driver register</h3>'+state.drivers.map(function(d){return '<div class="mach-record"><b>'+esc(d.name)+'</b><span>'+esc(d.phone||'')+' · '+esc(d.licence||'')+'</span></div>';}).join('')+'</div>';
}else if(activeTab==='payments'){
body='<div class="mach-panel"><h3>Record customer payment</h3><p class="mach-note">Payments are recorded as cash received in the selected machine’s own cash book. They do not create additional earned revenue.</p><form id="paymentForm" class="mach-form"><label>Machine<select name="machineId" required>'+machineOptions()+'</select></label><label>Customer<select name="customerId" required><option value="">Choose customer</option>'+state.customers.map(function(c){return '<option value="'+esc(c.id)+'">'+esc(c.name)+' · Total due '+money(outstanding(c.id))+'</option>';}).join('')+'</select></label><div class="mach-two"><label>Payment date<input name="date" type="date" value="'+today()+'" required></label><label>Amount received (ETB)<input name="amount" type="number" min=".01" step=".01" required></label></div><div class="mach-two"><label>Payment method<select name="method"><option>Cash</option><option>Bank transfer</option><option>Mobile money</option><option>Cheque</option><option>Other</option></select></label><label>Receipt / reference<input name="reference"></label></div><label>Notes<input name="note"></label><button class="primary">Save payment</button></form></div><div class="mach-panel"><h3>Payment history</h3>'+state.payments.slice().sort(sortDate).map(function(p){var c=customer(p.customerId),m=machine(p.machineId);return '<div class="mach-record"><b>'+esc(c?c.name:'Unknown customer')+' · '+money(p.amount)+'</b><span>'+esc(m?m.name:'Unassigned machine')+' · '+esc(p.date)+' · '+esc(p.method||'')+' · '+esc(p.reference||'')+'</span></div>';}).join('')+'</div>';
}else{
body='<div class="mach-panel"><h3>Record machine expense</h3><form id="expenseForm" class="mach-form"><label>Machine<select name="machineId" required>'+machineOptions()+'</select></label><div class="mach-two"><label>Date<input name="date" type="date" value="'+today()+'" required></label><label>Expense type<select name="type"><option>Fuel</option><option>Lubricants</option><option>Maintenance</option><option>Repair / breakdown</option><option>Tyres</option><option>Spare parts</option><option>Driver wages</option><option>Transport</option><option>Other</option></select></label></div><div class="mach-two"><label>Amount (ETB)<input name="amount" type="number" min=".01" step=".01" required></label><label>Quantity / litres<input name="quantity" type="number" min="0" step=".01"></label></div><label>Supplier / details<input name="note"></label><button class="primary">Save expense</button></form></div><div class="mach-panel"><h3>Expense history</h3>'+state.expenses.slice().sort(sortDate).map(function(x){var m=machine(x.machineId);return '<div class="mach-record"><b>'+esc(m?m.name:'Machine')+' · '+money(x.amount)+'</b><span>'+esc(x.date)+' · '+esc(x.type)+' · '+esc(x.note||'')+'</span></div>';}).join('')+'</div>';
}
root.innerHTML=nav()+body;
}
function sortDate(a,b){return String(b.date||'').localeCompare(String(a.date||''));}
function machineOptions(){return '<option value="">Choose machine</option>'+state.machines.filter(function(m){return m.status!=='Inactive';}).map(function(m){return '<option value="'+esc(m.id)+'">'+esc(m.name)+' · '+esc(m.plate||m.type)+'</option>';}).join('');}
function tripRows(rows){if(!rows.length)return '<p class="mach-note">No trip records yet.</p>';return rows.map(function(t){var m=machine(t.machineId),c=customer(t.customerId),d=driver(t.driverId);return '<div class="mach-record"><div class="mach-record-top"><b>'+esc(t.ticket||'Trip')+' · '+money(t.amount)+'</b><small>'+esc(t.date)+'</small></div><span>'+esc(m?m.name:'Machine')+' · '+esc(c?c.name:'Customer')+'</span><span>'+esc(t.material)+' · '+(Number(t.tripCount)||1)+' trip(s)'+(t.quantity?' · '+esc(t.quantity)+' '+esc(t.unit):'')+'</span><span>'+esc(t.origin||'')+' → '+esc(t.destination||'')+'</span><span>Driver: '+esc(d?d.name:'Not assigned')+'</span><span>Earned revenue · not necessarily paid</span></div>';}).join('');}
function formData(f){var o={};new FormData(f).forEach(function(v,k){o[k]=String(v).trim();});return o;}
document.addEventListener('click',function(e){var b=e.target.closest('[data-mtab]');if(b){activeTab=b.getAttribute('data-mtab');render();}});
document.addEventListener('submit',function(e){
var f=e.target;if(!f||!f.id)return;var v=formData(f);
if(f.id==='machineForm'){e.preventDefault();if(!v.name)return;var m={id:uid(),name:v.name,type:v.type,plate:v.plate,make:v.make,capacity:v.capacity,ownership:v.ownership,status:v.status,rateMode:v.rateMode,rate:Number(v.rate)||0,created:today()};var bookId=machineBook(m);if(!bookId){alert('Could not create this machine’s dedicated cash book. Machine was not saved.');return;}m.cashBookId=bookId;state.machines.push(m);save();render();}
if(f.id==='driverForm'){e.preventDefault();if(!v.name)return;state.drivers.push({id:uid(),name:v.name,phone:v.phone,licence:v.licence,created:today()});save();render();}
if(f.id==='tripForm'){e.preventDefault();var m=machine(v.machineId),count=Math.max(1,Math.floor(Number(v.tripCount)||1)),qty=Number(v.quantity)||0,rate=Number(v.rate)||0;if(!m){alert('Register/select a machine first.');return;}if(!(rate>0)){alert('Enter a valid agreed rate.');return;}if(v.basis!=='trip'&&!(qty>0)){alert('Enter load quantity for this rate basis.');return;}var c=ensureCustomer(v.customer,'');var amount=v.basis==='trip'?count*rate:qty*rate;if(v.basis==='trip'&&v.ticket&&state.trips.some(function(t){return t.ticket.toLowerCase()===v.ticket.toLowerCase();})){alert('This ticket/reference already exists.');return;}var bookId=machineBook(m);if(!bookId){alert('This machine has no linked cash book. Trip was not saved.');return;}state.trips.push({id:uid(),machineId:m.id,cashBookId:bookId,driverId:v.driverId,customerId:c.id,customerName:c.name,date:v.date,ticket:v.ticket,material:v.material,tripCount:count,quantity:qty,unit:v.unit,basis:v.basis,rate:rate,amount:amount,origin:v.origin,destination:v.destination,note:v.note,created:new Date().toISOString()});save();render();alert('Trip saved to '+m.name+'’s earned-income ledger. Earned revenue: '+money(amount)+'. Cash balance is unchanged until payment is received.');}
if(f.id==='paymentForm'){e.preventDefault();var amount=Number(v.amount),c=customer(v.customerId),m=machine(v.machineId);if(!c||!m||!(amount>0)){alert('Choose a machine, customer and valid amount.');return;}var paymentId=uid(),bookId=machineBook(m);if(!bookId||!postCash(m,'payment',paymentId,{type:'in',amount:amount,date:v.date,category:'Customer payment',party:c.name,note:(v.method||'Cash')+(v.reference?' · '+v.reference:'')+(v.note?' · '+v.note:'')})){alert('Payment was not saved because the machine cash book could not be updated.');return;}state.payments.push({id:paymentId,machineId:m.id,bookId:bookId,customerId:c.id,date:v.date,amount:amount,method:v.method,reference:v.reference,note:v.note,created:new Date().toISOString()});save();render();alert('Payment recorded in '+m.name+'’s cash book. Remaining balance for this machine: '+money(outstanding(c.id,m.id)));}
if(f.id==='expenseForm'){e.preventDefault();var cost=Number(v.amount),m=machine(v.machineId);if(!m||!(cost>0)){alert('Choose a machine and enter a valid amount.');return;}var expenseId=uid(),bookId=machineBook(m);if(!bookId||!postCash(m,'expense',expenseId,{type:'out',amount:cost,date:v.date,category:v.type,party:'',note:v.note+(Number(v.quantity)>0?' · Quantity: '+v.quantity:'' )})){alert('Expense was not saved because the machine cash book could not be updated.');return;}state.expenses.push({id:expenseId,machineId:m.id,bookId:bookId,date:v.date,type:v.type,amount:cost,quantity:Number(v.quantity)||0,note:v.note,created:new Date().toISOString()});save();render();}
});
// Ensure all registered machines own a permanent CashBook. Existing machine expenses are
// linked once; source IDs make the migration safe to repeat without duplicate entries.
var migrated=false;
state.machines.forEach(function(m){var id=machineBook(m);if(id&&m.cashBookId!==id){m.cashBookId=id;migrated=true;}});
state.expenses.forEach(function(x){var m=machine(x.machineId);if(m){var id=machineBook(m);if(id&&!x.bookId){x.bookId=id;postCash(m,'expense',x.id,{type:'out',amount:x.amount,date:x.date,category:x.type,party:'',note:x.note||''});migrated=true;}}});
if(migrated)save();
document.querySelectorAll('.tabs button[data-view="machinery"]').forEach(function(b){b.addEventListener('click',render);});
document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});
render();
  // Versioned bridge used by the main CashBook backup/restore workflow.
  // Machinery remains fully local; this does not enable network sync.
  window.CBMachineryData = {
    exportData: function () {
      return JSON.parse(JSON.stringify({
        schemaVersion: 1,
        machines: state.machines,
        operations: state.operations,
        expenses: state.expenses,
        trips: state.trips,
        customers: state.customers,
        drivers: state.drivers,
        payments: state.payments
      }));
    },
    validate: function (raw) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      var keys = ['machines','operations','expenses','trips','customers','drivers','payments'];
      return keys.every(function (key) { return raw[key] == null || Array.isArray(raw[key]); });
    },
    importData: function (raw) {
      if (!this.validate(raw)) return false;
      var next = {};
      ['machines','operations','expenses','trips','customers','drivers','payments'].forEach(function (key) {
        next[key] = Array.isArray(raw[key]) ? raw[key] : [];
      });
      try {
        var serialized = JSON.stringify(next);
        // Persist first. Only replace the live state after storage accepts the full payload.
        localStorage.setItem(KEY, serialized);
        state = next;
        render();
        return true;
      } catch (e) {
        return false;
      }
    }
  };

})();