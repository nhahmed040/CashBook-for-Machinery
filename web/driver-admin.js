(function(){
'use strict';
function functionUrl(name){
  var cfg=window.CBGetFirebaseConfig?window.CBGetFirebaseConfig():{},dbUrl=String(cfg.dbUrl||'').trim();
  var m=/^https:\/\/([a-z0-9-]+)(?:\.[a-z0-9-]+)*\.(?:firebaseio\.com|firebasedatabase\.app)$/i.exec(dbUrl);
  if(!m)throw new Error('Configure the Firebase Realtime Database URL and sign in as the owner first.');
  var project=m[1].replace(/-default-rtdb$/i,'');
  var region=(window.CB_CLOUD_DEFAULTS&&window.CB_CLOUD_DEFAULTS.functionsRegion)||'us-central1';
  return 'https://'+region+'-'+project+'.cloudfunctions.net/'+name;
}
async function call(name,data){
  if(!window.CBGetFirebaseIdToken)throw new Error('Firebase owner session is not available.');
  var token=await window.CBGetFirebaseIdToken();
  var response=await fetch(functionUrl(name),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({data:data||{}})});
  var body={};try{body=await response.json();}catch(_){}
  if(!response.ok||body.error)throw new Error(body.error&&body.error.message?body.error.message:'Firebase function request failed ('+response.status+').');
  return body.result||{};
}
window.CBDriverAdmin={
  create:function(data){return call('createDriverAccount',data);},
  update:function(data){return call('updateDriverAccount',data);}
};
})();
