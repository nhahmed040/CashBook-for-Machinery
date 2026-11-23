'use strict';
// Run only in a trusted admin environment with GOOGLE_APPLICATION_CREDENTIALS set.
// Never copy a service-account key into the Android app or web assets.
const {initializeApp,applicationDefault}=require('../functions/node_modules/firebase-admin/app');
const {getAuth}=require('../functions/node_modules/firebase-admin/auth');
const email=String(process.env.OWNER_EMAIL||'').trim().toLowerCase();
if(!email){process.stderr.write('Set OWNER_EMAIL to the existing owner Firebase Auth email.\n');process.exit(2);}
initializeApp({credential:applicationDefault()});
getAuth().getUserByEmail(email)
.then(user=>getAuth().setCustomUserClaims(user.uid,{...(user.customClaims||{}),owner:true,role:'owner'}))
.then(()=>process.stdout.write('Owner role granted. Sign out and sign in again to refresh the ID token.\n'))
.catch(error=>{process.stderr.write(String(error.message||error)+'\n');process.exitCode=1;});
