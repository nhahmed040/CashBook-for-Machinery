'use strict';
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
initializeApp();

const PERMISSION_KEYS = ['viewDashboard','recordTrips','viewBalance','viewHistory','confirmNotifications','reportDisputes','recordAttendance','reportIssues','replyMessages','recordCollections','manageDocuments'];
function requireOwner(request) {
  if (!request.auth || request.auth.token.owner !== true) throw new HttpsError('permission-denied','Only the business owner can manage driver accounts.');
}
function cleanPermissions(value) {
  const out={}; PERMISSION_KEYS.forEach((key)=>{out[key]=!!(value&&value[key]===true);}); return out;
}
function database() {
  const config=process.env.FIREBASE_CONFIG?JSON.parse(process.env.FIREBASE_CONFIG):{};
  const url=process.env.FIREBASE_DATABASE_URL||config.databaseURL;
  if(!url) throw new HttpsError('failed-precondition','Configure FIREBASE_DATABASE_URL for the deployed function.');
  return getDatabase(undefined, url).ref();
}
function validateInput(data) {
  const driverId=String(data.driverId||'').trim(),machineId=String(data.machineId||'').trim(),email=String(data.email||'').trim().toLowerCase();
  const password=String(data.password||''),displayName=String(data.displayName||'').trim();
  if(!driverId||!email||!displayName||password.length<8) throw new HttpsError('invalid-argument','Driver ID, name, email and a password of at least 8 characters are required.');
  return {driverId,machineId,email,password,displayName,permissions:cleanPermissions(data.permissions),tripMode:['disabled','owner-approval','auto-approval'].includes(data.tripMode)?data.tripMode:'disabled'};
}
exports.createDriverAccount=onCall(async(request)=>{
  requireOwner(request);
  const input=validateInput(request.data||{}),auth=getAuth(),root=database();
  const duplicate=await root.child('driverAccounts').orderByChild('driverId').equalTo(input.driverId).once('value');
  if(duplicate.exists()) throw new HttpsError('already-exists','A login account is already linked to this driver.');
  let user;
  try {
    user=await auth.createUser({email:input.email,password:input.password,displayName:input.displayName,disabled:false});
    const claims={role:'driver',driverId:input.driverId,machineId:input.machineId,active:true,permissions:input.permissions,tripMode:input.tripMode};
    await auth.setCustomUserClaims(user.uid,claims);
    await root.child('driverAccounts/'+user.uid).set({uid:user.uid,driverId:input.driverId,machineId:input.machineId,email:input.email,displayName:input.displayName,active:true,permissions:input.permissions,tripMode:input.tripMode,createdAt:Date.now(),updatedAt:Date.now()});
    return {uid:user.uid,driverId:input.driverId,email:input.email,active:true};
  } catch(error) {
    if(user){try{await auth.deleteUser(user.uid);}catch(_){}}
    if(error instanceof HttpsError) throw error;
    throw new HttpsError('internal','Driver account could not be created.',{cause:String(error.code||error.message||error)});
  }
});
exports.updateDriverAccount=onCall(async(request)=>{
  requireOwner(request);
  const data=request.data||{},uid=String(data.uid||'').trim();
  if(!uid) throw new HttpsError('invalid-argument','Driver account UID is required.');
  const root=database(),ref=root.child('driverAccounts/'+uid),snapshot=await ref.once('value');
  if(!snapshot.exists()) throw new HttpsError('not-found','Driver account was not found.');
  const current=snapshot.val(),active=data.active==null?current.active!==false:data.active===true;
  const permissions=data.permissions==null?cleanPermissions(current.permissions):cleanPermissions(data.permissions);
  const tripMode=['disabled','owner-approval','auto-approval'].includes(data.tripMode)?data.tripMode:(current.tripMode||'disabled');
  const machineId=data.machineId==null?(current.machineId||''):String(data.machineId);
  await getAuth().updateUser(uid,{disabled:!active});
  if(!active) await getAuth().revokeRefreshTokens(uid);
  await getAuth().setCustomUserClaims(uid,{role:'driver',driverId:current.driverId,machineId,active,permissions,tripMode});
  await ref.update({active,permissions,tripMode,machineId,updatedAt:Date.now()});
  return {uid,driverId:current.driverId,machineId,active,permissions,tripMode};
});
