(function(){
'use strict';

/* =========================================================================
   CORRECTIFS MOBILE : ANTI-ZOOM DOUBLE-TAP & ANTI-CHIFFRES BLEUS
   ========================================================================= */
if(!document.querySelector('meta[name="format-detection"]')){
  const metaTel = document.createElement('meta');
  metaTel.name = 'format-detection';
  metaTel.content = 'telephone=no';
  document.head.appendChild(metaTel);
}

const styleFix = document.createElement('style');
styleFix.innerHTML = `
  button, .pin-key, .role-btn, .zone-card, .back-link {
    touch-action: manipulation !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .pin-key, .pin-key * {
    color: #211E1A !important;
    text-decoration: none !important;
  }
`;
document.head.appendChild(styleFix);

/* =========================================================================
   CONFIGURATION EMAILJS
   ========================================================================= */
const EMAILJS_CONFIG = {
  serviceId: "service_oxp40jn",
  templateId: "template_w9x0ucj",
  publicKey: "WaGLuQh-wIKia0dGl"
};

if(typeof emailjs !== 'undefined'){
  emailjs.init(EMAILJS_CONFIG.publicKey);
}

/* =========================================================================
   CONFIGURATION FIREBASE
   ========================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyA4pQGdFIgDtt1GxfohxexgHauc4wXM4sk",
  authDomain: "controle-nettoyage.firebaseapp.com",
  projectId: "controle-nettoyage",
  storageBucket: "controle-nettoyage.firebasestorage.app",
  messagingSenderId: "1032576632030",
  appId: "1:1032576632030:web:4650e2bce60a2c7b67ae4f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================================================================
   RÉFÉRENTIEL TÂCHES PAR DÉFAUT (SASU SOAN)
   ========================================================================= */
const ZONES = [
  { id:'lobby',           nom:'Lobby' },
  { id:'cuisine',         nom:'Cuisine' },
  { id:'arriere_cuisine', nom:'Arrière-cuisine' },
  { id:'comptoir',        nom:'Comptoir' }
];

const DEFAULT_POINTS = {
  lobby: [
    { id:'lob_1', label:'Nettoyage complet int/ext des blocs poubelles', freq:'J' },
    { id:'lob_2', label:'Nettoyage des tables dessus et tranches', freq:'J' },
    { id:'lob_3', label:'Nettoyage des pieds de tables', freq:'J' },
    { id:'lob_4', label:'Montée des chaises sur les tables', freq:'J' },
    { id:'lob_5', label:'Déplacement des tables', freq:'J' },
    { id:'lob_6', label:'Balayage des sols', freq:'J' },
    { id:'lob_7', label:'Mopage des sols', freq:'J' },
    { id:'lob_8', label:'Descente des chaises', freq:'J' },
    { id:'lob_9', label:'Nettoyage complet des chaises par zones', freq:'J' },
    { id:'lob_10', label:'Nettoyage traces sur surfaces vitrées', freq:'J' },
    { id:'lob_11', label:'Nettoyage rampes inox', freq:'J' }
  ],
  cuisine: [
    { id:'cui_1', label:'Nettoyage des 2 grils & rabats', freq:'J' },
    { id:'cui_2', label:'Nettoyage arrière des grills et friteuses', freq:'J' },
    { id:'cui_3', label:'Nettoyage des Nids d’abeilles', freq:'J' },
    { id:'cui_4', label:'Nettoyage de l’arrière des 2 grills et 2 friteuses', freq:'J' },
    { id:'cui_5', label:'Nettoyage des UHC X 3 avec brosse blanche', freq:'J' },
    { id:'cui_6', label:'Nettoyage friteuses FCN et frites', freq:'J' },
    { id:'cui_7', label:'Démontage des éléments à passer à la plonge', freq:'J' },
    { id:'cui_8', label:'Nettoyage et aseptisation des écrans, Bump, imprimante', freq:'J' },
    { id:'cui_9', label:'Nettoyage et aseptisation du frigo positif cuisine', freq:'J' },
    { id:'cui_10', label:'Nettoyage et aseptisation du frigo positif comptoir', freq:'J' },
    { id:'cui_11', label:'Nettoyage des armoires négatives et arc Fry', freq:'J' },
    { id:'cui_12', label:'Nettoyage du torsteur croque', freq:'J' },
    { id:'cui_13', label:'Nettoyage de l’Egg Cooker', freq:'J' },
    { id:'cui_14', label:'Nettoyage et aseptisation des tables à toaster', freq:'J' },
    { id:'cui_15', label:'Nettoyage des lavabos de cuisine et détartrage', freq:'J' },
    { id:'cui_16', label:'Nettoyage de l’îlot central (tables production)', freq:'J' },
    { id:'cui_17', label:'Nettoyage de l’arbre à panière', freq:'J' },
    { id:'cui_18', label:'Nettoyage du poste OAT sur roulette', freq:'J' },
    { id:'cui_19', label:'Nettoyage du poste de boisson', freq:'J' },
    { id:'cui_20', label:'Nettoyage du poste dessert', freq:'J' },
    { id:'cui_21', label:'Nettoyage des tables amovibles comptoir', freq:'J' },
    { id:'cui_22', label:'Nettoyage poste LAD', freq:'J' },
    { id:'cui_23', label:'Nettoyage du micro-onde comptoir', freq:'J' },
    { id:'cui_24', label:'Nettoyage de l’îlot à boisson', freq:'J' },
    { id:'cui_25', label:'Nettoyage arrière des machines carpigiani et shake', freq:'J' },
    { id:'cui_26', label:'Nettoyage des plinthes de la cuisine', freq:'H' }
  ],
  arriere_cuisine: [
    { id:'ac_1', label:'Nettoyage du lave plateaux', freq:'J' },
    { id:'ac_2', label:'Nettoyage de la plonge dessus dessous', freq:'J' },
    { id:'ac_3', label:'Nettoyage coin machine à laver', freq:'J' },
    { id:'ac_4', label:'Nettoyage du coin évacuation eaux usées', freq:'J' },
    { id:'ac_5', label:'Nettoyage des sols', freq:'J' },
    { id:'ac_6', label:'Nettoyage encadrements porte aluminium', freq:'H' },
    { id:'ac_7', label:'Nettoyage complet portes accès', freq:'H' },
    { id:'ac_8', label:'Nettoyage des murs', freq:'H' },
    { id:'ac_9', label:'Nettoyage des grilles d’aérations', freq:'M' }
  ],
  comptoir: [
    { id:'cmp_1', label:'Nettoyage du poste à frites', freq:'J' },
    { id:'cmp_2', label:'Nettoyage du comptoir intégral (dessus/dessous/face)', freq:'J' },
    { id:'cmp_3', label:'Nettoyage des dessous de caisses', freq:'J' },
    { id:'cmp_4', label:'Remontage des éléments passés à la plonge', freq:'J' },
    { id:'cmp_5', label:'Nettoyage des dessus d’éléments', freq:'J' },
    { id:'cmp_6', label:'Brossage et brossage des sols', freq:'J' },
    { id:'cmp_7', label:'Nettoyage des évacuations (grille, cloches)', freq:'J' },
    { id:'cmp_8', label:'Nettoyage des deux faces portes accès', freq:'J' },
    { id:'cmp_9', label:'Nettoyage des évacuations d’eau', freq:'J' },
    { id:'cmp_10', label:'Nettoyage de luminaires comptoir', freq:'J' },
    { id:'cmp_11', label:'Nettoyage des Plexiglas comptoir et vitre caisse', freq:'J' },
    { id:'cmp_12', label:'Nettoyage des sols', freq:'J' },
    { id:'cmp_13', label:'Nettoyage du salad bar et du plug pâtisserie', freq:'J' },
    { id:'cmp_14', label:'Nettoyage des inox', freq:'J' },
    { id:'cmp_15', label:'Nettoyage frigo intérieur', freq:'J' },
    { id:'cmp_16', label:'Nettoyage de l’arche du comptoir', freq:'J' },
    { id:'cmp_17', label:'Nettoyage des seuils de porte d’entrée', freq:'J' },
    { id:'cmp_18', label:'Nettoyage poignées de portes', freq:'J' },
    { id:'cmp_19', label:'Nettoyage des roulettes des équipements', freq:'H' },
    { id:'cmp_20', label:'Nettoyage toaster + uhc', freq:'H' },
    { id:'cmp_21', label:'Nettoyage des plinthes', freq:'H' },
    { id:'cmp_22', label:'Nettoyage des roulettes', freq:'H' },
    { id:'cmp_23', label:'Nettoyage grilles d’aérations cuisine blanche', freq:'M' },
    { id:'cmp_24', label:'Nettoyage des murs', freq:'M' },
    { id:'cmp_25', label:'Nettoyage des grilles d’aérations', freq:'M' }
  ]
};

/* =========================================================================
   MOTEUR DE STOCKAGE HYBRIDE (MIGRATION AUTO VERSION 3)
   ========================================================================= */
const DB_NAME = 'soan-hybrid-db';
const DB_VERSION = 3;
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      const stores = ['controles', 'agents', 'task_schedule', 'sync_queue', 'mail_schedule', 'pdf_reports'];
      stores.forEach(s => {
        if(!db.objectStoreNames.contains(s)){
          db.createObjectStore(s, { keyPath: (s === 'task_schedule' ? 'taskId' : 'id') });
        }
      });
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
  return dbPromise;
}

async function idbPut(store, value){
  try {
    const db = await openDB();
    if(!db.objectStoreNames.contains(store)) return value;
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      tx.oncomplete = ()=>resolve(value);
      tx.onerror = ()=>reject(tx.error);
    });
  } catch(e) { return value; }
}

async function idbGet(store, id){
  try {
    const db = await openDB();
    if(!db.objectStoreNames.contains(store)) return null;
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(id);
      req.onsuccess = ()=>resolve(req.result || null);
      req.onerror = ()=>reject(req.error);
    });
  } catch(e) { return null; }
}

async function idbGetAll(store){
  try {
    const db = await openDB();
    if(!db.objectStoreNames.contains(store)) return [];
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = ()=>resolve(req.result || []);
      req.onerror = ()=>reject(req.error);
    });
  } catch(e) { return []; }
}

async function idbDelete(store, id){
  try {
    const db = await openDB();
    if(!db.objectStoreNames.contains(store)) return;
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = ()=>resolve();
      tx.onerror = ()=>reject(tx.error);
    });
  } catch(e) {}
}

async function pushToCloud(collection, id, data){
  await idbPut(collection, data);
  if(navigator.onLine){
    db.collection(collection).doc(id).set(data, { merge: true })
      .then(() => idbDelete('sync_queue', `${collection}_${id}`))
      .catch(() => idbPut('sync_queue', { id: `${collection}_${id}`, collection, docId: id, data }));
  } else {
    await idbPut('sync_queue', { id: `${collection}_${id}`, collection, docId: id, data });
  }
}

async function syncPendingQueue(){
  if(!navigator.onLine) return;
  const queue = await idbGetAll('sync_queue');
  for(const item of queue){
    try {
      await db.collection(item.collection).doc(item.docId).set(item.data, { merge: true });
      await idbDelete('sync_queue', item.id);
    } catch(e){}
  }
}

window.addEventListener('online', syncPendingQueue);

/* =========================================================================
   RÉCUPÉRATION DYNAMIQUE DES TÂCHES
   ========================================================================= */
async function getAllTasksMap(forceCloud = false){
  let tasksMap = JSON.parse(JSON.stringify(DEFAULT_POINTS));
  
  const localTasks = await idbGetAll('task_schedule');
  localTasks.forEach(item => {
    if(item.deleted) {
      if(tasksMap[item.zoneId]) {
        tasksMap[item.zoneId] = tasksMap[item.zoneId].filter(p => p.id !== item.taskId);
      }
    } else {
      const zId = item.zoneId || 'lobby';
      if(!tasksMap[zId]) tasksMap[zId] = [];
      const existingIdx = tasksMap[zId].findIndex(p => p.id === item.taskId);
      
      const taskObj = {
        id: item.taskId,
        label: item.label,
        freq: item.freq,
        targetValue: item.targetValue
      };

      if(existingIdx >= 0){
        tasksMap[zId][existingIdx] = Object.assign(tasksMap[zId][existingIdx], taskObj);
      } else {
        tasksMap[zId].push(taskObj);
      }
    }
  });

  if(navigator.onLine && forceCloud){
    db.collection('task_schedule').get().then(snap => {
      snap.docs.forEach(doc => idbPut('task_schedule', doc.data()));
    }).catch(()=>{});
  }

  return tasksMap;
}

async function getPointsForToday(zoneId, dateIso){
  const d = new Date(dateIso);
  const currentDay = d.getDay();
  const currentDate = d.getDate();
  
  const allMap = await getAllTasksMap();
  const zonePoints = allMap[zoneId] || [];

  return zonePoints.filter(p => {
    const freq = p.freq || 'J';
    const targetVal = Number(p.targetValue || 1);

    if(freq === 'J') return true;
    if(freq === 'H') return currentDay === targetVal;
    if(freq === 'M') return currentDate === targetVal;
    return false;
  });
}

/* =========================================================================
   DÉCONNEXION AUTOMATIQUE & ENVOI MAIL IN-APP
   ========================================================================= */
let session = null;
let currentPin = '';
let pendingRole = 'agent';
let activeZoneId = null;
let activeControleId = null;
let activeMode = 'equipe';
let secretTapCount = 0;
let secretTapTimer = null;

let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 3 * 60 * 1000;

function resetInactivityTimer(){
  clearTimeout(inactivityTimer);
  if(session){
    inactivityTimer = setTimeout(() => {
      session = null;
      currentPin = '';
      toast('Session expirée suite à 3 min d’inactivité');
      renderLogin();
    }, INACTIVITY_TIMEOUT);
  }
}

['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer, { passive: true });
});

setInterval(async () => {
  const config = await idbGet('mail_schedule', 'global_config');
  if(!config || !config.active || !config.emails || config.emails.length === 0) return;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayKey = todayISO();

  if(config.time1 === currentTime && config.lastSentDate !== `${todayKey}_${currentTime}`){
    config.lastSentDate = `${todayKey}_${currentTime}`;
    await pushToCloud('mail_schedule', 'global_config', config);
    toast(`✉️ Heure d'envoi atteinte (${currentTime}). Envoi du mail en cours...`);
    triggerInAppMailSending(config.emails);
  }
}, 60000);

const root = document.getElementById('app-root');

function todayISO(){ return new Date().toISOString().slice(0,10); }
function fmtDate(iso){ return iso.split('-').reverse().join('/'); }
function uid(prefix){ return (prefix||'id')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8); }

function toast(msg){
  let t = document.getElementById('toastEl');
  if(!t){ t=document.createElement('div'); t.id='toastEl'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 3500);
}

function openPhotoViewer(src, title){
  const backdrop = document.createElement('div');
  backdrop.className = 'pv-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  backdrop.innerHTML = `
    <div style="color:#fff;margin-bottom:12px;font-weight:600;font-size:14px;text-align:center;">${title||'Visualisation Photo'}</div>
    <img src="${src}" style="max-width:100%;max-height:78vh;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.6);">
    <button class="btn amber" style="margin-top:16px;padding:8px 24px;">Fermer</button>
  `;
  document.body.appendChild(backdrop);
  backdrop.onclick = () => backdrop.remove();
}

function fileToResizedBase64(file, maxWidth){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ()=>{
      img.onerror = reject;
      img.onload = ()=>{
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function topbarHtml(title, sub){
  const online = navigator.onLine;
  return `
    <div class="topbar">
      <div>
        <div class="brand-eyebrow">${sub||'SASU SOAN — Prestation Nettoyage'}</div>
        <div class="brand-title">${title}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="net-status ${online?'online':'offline'}"><span class="net-dot"></span>${online?'En ligne':'Hors-ligne'}</div>
      </div>
    </div>
  `;
}

function renderLogin(){
  clearTimeout(inactivityTimer);
  syncPendingQueue();
  root.innerHTML = `
    <div id="screen-login">
      <div class="login-card">
        <div class="brand-eyebrow">SASU SOAN</div>
        <div class="brand-title">Contrôle Prestations</div>
        <div class="role-switch">
          <button class="role-btn ${pendingRole==='agent'?'active':''}" data-role="agent">Équipe</button>
          <button class="role-btn ${pendingRole==='controleur'?'active':''}" data-role="controleur">Contrôleur</button>
        </div>
        <div class="section-note">Saisis ton code à 4 chiffres</div>
        <div class="pin-dots" id="pinDots"></div>
        <div class="pin-pad" id="pinPad"></div>
        <div class="pin-error" id="pinError"></div>
      </div>
    </div>
  `;
  root.querySelectorAll('.role-btn').forEach(b=>{
    b.onclick = ()=>{ pendingRole=b.dataset.role; currentPin=''; renderLogin(); };
  });
  renderPinDots();
  renderPinPad();
}

function renderPinDots(){
  const el = document.getElementById('pinDots');
  if(el) el.innerHTML = [0,1,2,3].map(i=>`<div class="pin-dot ${i<currentPin.length?'filled':''}"></div>`).join('');
}

function renderPinPad(){
  const el = document.getElementById('pinPad');
  if(!el) return;
  const keys = ['1','2','3','4','5','6','7','8','9','secret','0','⌫'];
  el.innerHTML = keys.map(k=>{
    if(k==='secret'){
      return `<div id="secretKeyZone" style="cursor:default;user-select:none;"></div>`;
    }
    return `<button class="pin-key ${k==='⌫'?'wide':''}" data-key="${k}">${k}</button>`;
  }).join('');

  el.querySelectorAll('[data-key]').forEach(btn=>{
    btn.onclick = ()=>onPinKey(btn.dataset.key);
  });

  const secretZone = document.getElementById('secretKeyZone');
  if(secretZone){
    secretZone.onclick = ()=>{
      secretTapCount++;
      clearTimeout(secretTapTimer);
      secretTapTimer = setTimeout(() => { secretTapCount = 0; }, 1500);

      if(secretTapCount >= 5){
        secretTapCount = 0;
        const codeInput = prompt("Saisissez le code d'accès administrateur :");
        if(codeInput === "2105"){
          session = { role: 'controleur', agentId: 'admin_temp', nom: 'Admin Secours' };
          resetInactivityTimer();
          goToZones();
        } else if(codeInput !== null){
          toast("Code administrateur incorrect");
        }
      }
    };
  }
}

function onPinKey(k){
  const errEl = document.getElementById('pinError');
  if(k==='⌫'){ currentPin = currentPin.slice(0,-1); if(errEl) errEl.textContent=''; renderPinDots(); return; }
  if(currentPin.length>=4) return;
  currentPin += k;
  renderPinDots();
  if(currentPin.length===4) checkPin();
}

async function checkPin(){
  const localAgents = await idbGetAll('agents');
  let match = localAgents.find(a=>a.pin===currentPin && a.role===pendingRole && a.actif!==false);

  if(!match && navigator.onLine){
    try {
      const snap = await db.collection('agents').where('pin', '==', currentPin).get();
      match = snap.docs.map(d=>d.data()).find(a=>a.role===pendingRole && a.actif!==false);
      if(match) await idbPut('agents', match);
    } catch(e){}
  }

  if(match){
    session = { role:pendingRole, agentId:match.id, nom:match.nom };
    currentPin='';
    resetInactivityTimer();
    goToZones();
  } else {
    const errEl = document.getElementById('pinError');
    if(errEl) errEl.textContent = 'Code incorrect'; currentPin=''; setTimeout(renderPinDots,150);
  }
}

async function goToZones(){ activeZoneId=null; await renderZones(); }

/* =========================================================================
   MENU PRINCIPAL
   ========================================================================= */
async function renderZones(){
  resetInactivityTimer();
  const date = todayISO();
  const roleLabel = session.role==='agent' ? `Équipe · ${session.nom}` : `Contrôleur · ${session.nom}`;

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(roleLabel, fmtDate(date))}
      <div class="section">
        <div class="section-title">Zones de Prestation</div>
        <div class="zone-grid" id="zoneGrid"></div>
      </div>
      
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <button class="btn ghost block" id="historyBtn" style="flex:1;">📜 Historique</button>
        <button class="btn ghost block" id="statsBtn" style="flex:1;">📊 Dashboard</button>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:15px;">
        <button class="btn ghost block" id="globalPdfBtn" style="flex:1;border-color:#C7791B;color:#C7791B;">📄 Rapport PDF de la Journée</button>
        <button class="btn ghost block" id="mailScheduleBtn" style="flex:1;border-color:#2B6E68;color:#2B6E68;">✉️ Envois Mails</button>
      </div>

      ${session.role==='controleur' ? `
        <button class="btn amber block" id="adminTasksBtn" style="margin-bottom:10px;">📅 Gestion des Tâches</button>
        <button class="btn amber block" id="adminUsersBtn" style="margin-bottom:10px;">👤 Gestion des Utilisateurs</button>
      ` : ''}
      <button class="btn ghost block" id="logoutBtn">Déconnexion</button>
    </div>
  `;

  const grid = document.getElementById('zoneGrid');
  const isAgent = session.role === 'agent';

  const updateGridUI = async () => {
    let html = '';
    for(const z of ZONES){
      const activePoints = await getPointsForToday(z.id, date);
      const controleId = `${date}__${z.id}`;
      const c = await idbGet('controles', controleId);

      let remaining = 0;
      if(isAgent){
        const eqReponses = (c && c.passageEquipe && c.passageEquipe.reponses) || {};
        activePoints.forEach(p => {
          const r = eqReponses[p.id];
          if(!r || r.conforme === null || r.conforme === undefined) remaining++;
        });
      } else {
        const cvReponses = (c && c.contreVisite && c.contreVisite.reponses) || {};
        activePoints.forEach(p => {
          const r = cvReponses[p.id];
          if(!r || r.conforme === undefined || r.conforme === null) remaining++;
        });
      }

      const badgeText = remaining === 0 ? '✓ Complété' : `${remaining} restant(s)`;
      const badgeBg = remaining === 0 ? '#2B6E68' : '#C7791B';

      html += `
        <div class="zone-card" data-zone="${z.id}" style="cursor:pointer;">
          <div>
            <div class="zone-name">${z.nom}</div>
            <div class="zone-meta">${activePoints.length} tâche(s) au planning</div>
          </div>
          <span class="zone-badge" style="background:${badgeBg};color:#fff;font-weight:700;padding:4px 8px;border-radius:6px;font-size:11px;">${badgeText}</span>
        </div>
      `;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.zone-card').forEach(card=>{
      card.onclick = ()=>{
        activeZoneId = card.dataset.zone;
        activeControleId = `${date}__${activeZoneId}`;
        activeMode = isAgent ? 'equipe' : 'contreVisite';
        renderControle();
      };
    });
  };

  await updateGridUI();

  if(navigator.onLine){
    ZONES.forEach(z => {
      const controleId = `${date}__${z.id}`;
      db.collection('controles').doc(controleId).get().then(doc => {
        if(doc.exists){
          idbPut('controles', doc.data()).then(() => updateGridUI());
        }
      }).catch(()=>{});
    });
  }

  document.getElementById('historyBtn').onclick = () => renderHistory();
  document.getElementById('statsBtn').onclick = () => renderStats();
  document.getElementById('globalPdfBtn').onclick = () => generateGlobalPDF();

  const mailBtn = document.getElementById('mailScheduleBtn');
  if(mailBtn){
    mailBtn.onclick = (evt) => {
      evt.preventDefault();
      renderMailScheduleAdmin();
    };
  }

  document.getElementById('logoutBtn').onclick = ()=>{ session=null; clearTimeout(inactivityTimer); currentPin=''; renderLogin(); };
  
  const tasksBtn = document.getElementById('adminTasksBtn');
  if(tasksBtn) tasksBtn.onclick = () => renderTaskAdmin();

  const usersBtn = document.getElementById('adminUsersBtn');
  if(usersBtn) usersBtn.onclick = () => renderAgentsAdmin();
}

/* =========================================================================
   PROGRAMMATION & ENVOI DIRECT IN-APP DU MAIL
   ========================================================================= */
async function generateAndStorePDFData(){
  const date = todayISO();
  let totalNok = 0;
  let totalEcarts = 0;

  for(const z of ZONES){
    const controleId = `${date}__${z.id}`;
    let c = await idbGet('controles', controleId);
    if(navigator.onLine && !c){
      try {
        const doc = await db.collection('controles').doc(controleId).get();
        if(doc.exists) c = doc.data();
      } catch(e){}
    }

    const activePoints = await getPointsForToday(z.id, date);
    const eq = (c && c.passageEquipe) || {};
    const cv = (c && c.contreVisite) || {};

    for(const p of activePoints){
      const rEq = (eq.reponses && eq.reponses[p.id]) || {};
      const rCv = (cv.reponses && cv.reponses[p.id]) || {};
      let eqConformeCalculated = (rEq.photos && rEq.photos.length > 0) ? (rEq.conforme !== false) : false;
      let cvConformeCalculated = (rCv.conforme === false) ? false : true;

      const isFinalOk = (cvConformeCalculated === true);
      const isRealEcart = (eqConformeCalculated === true && cvConformeCalculated === false);

      if(!isFinalOk || !eqConformeCalculated) totalNok++;
      if(isRealEcart) totalEcarts++;
    }
  }

  const statusSummary = totalNok === 0 
    ? 'PRESTATION CONFORME — 0 NOK' 
    : `${totalNok} NOK dont ${totalEcarts} écart(s)`;

  const reportDocId = `report_${date}`;
  const reportData = {
    id: reportDocId,
    dateIso: date,
    formattedDate: fmtDate(date),
    nokCount: totalNok,
    ecartsCount: totalEcarts,
    statusSummary: statusSummary
  };

  await pushToCloud('pdf_reports', reportDocId, reportData);

  const appUrl = window.location.href.split('#')[0];
  const downloadLink = `${appUrl}#histDateSelect`;

  return { totalNok, totalEcarts, statusSummary, downloadLink };
}

async function triggerInAppMailSending(emails){
  if(!emails || emails.length === 0){
    toast('Inscrivez au moins un e-mail destinataire');
    return;
  }

  if(typeof emailjs === 'undefined'){
    toast("Erreur : Bibliothèque EmailJS introuvable.");
    return;
  }

  try {
    toast("Génération & envoi du rapport par mail...");
    const pdfMeta = await generateAndStorePDFData();

    for(const recipient of emails){
      const templateParams = {
        to_email: recipient,
        email: recipient,
        reply_to: recipient,
        date: fmtDate(todayISO()),
        bilan: pdfMeta.statusSummary,
        pdf_link: pdfMeta.downloadLink,
        message: `Bilan du jour : ${pdfMeta.statusSummary}.\nConsultez le rapport complet et les photos ici : ${pdfMeta.downloadLink}`
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );
    }
    toast(`✉️ Mail transmis avec succès à ${emails.length} destinataire(s) !`);
  } catch(err) {
    console.error("Erreur EmailJS détaillée :", err);
    const detail = (err && err.text) ? err.text : (err.message || JSON.stringify(err));
    toast(`EmailJS Erreur : ${detail}`);
  }
}

async function renderMailScheduleAdmin(){
  resetInactivityTimer();
  
  let mailConfig = await idbGet('mail_schedule', 'global_config') || {
    id: 'global_config',
    active: true,
    time1: '18:00',
    emails: []
  };

  if(navigator.onLine){
    try {
      const doc = await db.collection('mail_schedule').doc('global_config').get();
      if(doc.exists){
        mailConfig = doc.data();
        await idbPut('mail_schedule', mailConfig);
      }
    } catch(e){}
  }

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Programmation Mails', 'Rapports Automatiques')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section" style="padding:16px;">
        <div class="section-note">Inscrivez les adresses destinataires et définissez l'heure quotidienne d'envoi du PDF.</div>

        <div style="background:#fff;border:1px solid #E7E1D6;padding:14px;border-radius:10px;margin-bottom:15px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-weight:700;font-size:13px;color:#211E1A;">État de la programmation</span>
            <input type="checkbox" id="mailActiveCheck" ${mailConfig.active?'checked':''} style="width:20px;height:20px;accent-color:#2B6E68;cursor:pointer;">
          </div>

          <div style="margin-top:10px;">
            <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:2px;">Heure d'envoi quotidien :</label>
            <input type="time" id="mailTime1" value="${mailConfig.time1||'18:00'}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:13px;">
          </div>
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;padding:14px;border-radius:10px;margin-bottom:15px;">
          <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:10px;">Liste des Destinataires</div>
          <div id="emailListContainer"></div>
          
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="email" id="newEmailInput" placeholder="ex: direction@soan.fr" style="flex:1;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:12px;">
            <button class="btn amber small" id="addEmailBtn" style="padding:6px 12px;">+ Ajouter</button>
          </div>
        </div>

        <button class="btn amber block" id="saveMailConfigBtn" style="margin-bottom:10px;">Enregistrer la Configuration</button>
        <button class="btn ghost block" id="sendTestNowBtn" style="border-color:#2B6E68;color:#2B6E68;">🧪 Tester l'envoi In-App du Mail</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  const renderEmailsUI = () => {
    const container = document.getElementById('emailListContainer');
    if(!mailConfig.emails || mailConfig.emails.length === 0){
      container.innerHTML = `<div style="font-size:12px;color:#6B655C;font-style:italic;">Aucune adresse enregistrée.</div>`;
      return;
    }
    container.innerHTML = mailConfig.emails.map((em, idx) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #E7E1D6;font-size:12px;">
        <span style="font-weight:600;color:#211E1A;">${em}</span>
        <button class="btn danger small del-email-btn" data-idx="${idx}" style="padding:2px 8px;font-size:10px;">Suppr.</button>
      </div>
    `).join('');

    container.querySelectorAll('.del-email-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        mailConfig.emails.splice(idx, 1);
        renderEmailsUI();
      };
    });
  };

  renderEmailsUI();

  document.getElementById('addEmailBtn').onclick = () => {
    const input = document.getElementById('newEmailInput');
    const val = input.value.trim();
    if(val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)){
      mailConfig.emails = mailConfig.emails || [];
      if(!mailConfig.emails.includes(val)){
        mailConfig.emails.push(val);
        input.value = '';
        renderEmailsUI();
      } else { toast('Adresse déjà présente'); }
    } else { toast('Saisissez un e-mail valide'); }
  };

  document.getElementById('saveMailConfigBtn').onclick = async () => {
    mailConfig.active = document.getElementById('mailActiveCheck').checked;
    mailConfig.time1 = document.getElementById('mailTime1').value;

    await pushToCloud('mail_schedule', 'global_config', mailConfig);
    toast('Configuration mail sauvegardée !');
    goToZones();
  };

  document.getElementById('sendTestNowBtn').onclick = async () => {
    if(!mailConfig.emails || mailConfig.emails.length === 0){
      toast('Inscrivez au moins un e-mail destinataire');
      return;
    }
    await triggerInAppMailSending(mailConfig.emails);
  };
}

/* =========================================================================
   SAISIE CONTRÔLE / PRESTATION ZONE
   ========================================================================= */
async function renderControle(){
  resetInactivityTimer();
  const date = todayISO();
  const currentHour = new Date().getHours();
  
  let c = await idbGet('controles', activeControleId) || {
    id: activeControleId, zoneId: activeZoneId, date,
    passageEquipe: { agentNom:null, heure:null, reponses:{} },
    contreVisite:  { controleurNom:null, heure:null, reponses:{} }
  };

  if(navigator.onLine){
    db.collection('controles').doc(activeControleId).get().then(doc => {
      if(doc.exists) {
        c.passageEquipe = doc.data().passageEquipe || c.passageEquipe;
        c.contreVisite = doc.data().contreVisite || c.contreVisite;
        idbPut('controles', c);
      }
    }).catch(()=>{});
  }

  const zone = ZONES.find(z=>z.id===activeZoneId);
  const activePoints = await getPointsForToday(activeZoneId, date);
  const isContreVisite = activeMode==='contreVisite';
  
  const currentBranch = isContreVisite ? c.contreVisite : c.passageEquipe;
  const equipeReponses = (c.passageEquipe && c.passageEquipe.reponses) || {};

  activePoints.forEach(p => {
    if(!isContreVisite){
      if(currentHour >= 10){
        if(!currentBranch.reponses[p.id]){
          currentBranch.reponses[p.id] = { conforme: false, photos:[], commentaire:'Non réalisé avant 10h' };
        } else if(!currentBranch.reponses[p.id].photos || currentBranch.reponses[p.id].photos.length === 0){
          currentBranch.reponses[p.id].conforme = false;
        }
      }
    } else {
      if(currentHour >= 18){
        if(!currentBranch.reponses[p.id] || currentBranch.reponses[p.id].conforme === null || currentBranch.reponses[p.id].conforme === undefined){
          currentBranch.reponses[p.id] = currentBranch.reponses[p.id] || { photos:[], commentaire:'' };
          currentBranch.reponses[p.id].conforme = true;
        }
      }
    }
  });

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(zone.nom, isContreVisite ? 'Contre-visite Contrôleur' : 'Réalisation Prestation')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div id="pointsList"></div>
        <button class="btn amber block" id="saveBtn" style="margin-top:12px;">Terminer et Retourner aux Zones</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  const triggerAutoSave = async () => {
    const currentTime = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    currentBranch.heure = currentTime;
    
    if(isContreVisite) currentBranch.controleurNom = session.nom;
    else currentBranch.agentNom = session.nom;

    await pushToCloud('controles', c.id, c);
  };

  const renderPhotosHtml = (photos, isMine, pId) => {
    return photos.map((pSrc, idx) => `
      <div style="position:relative;display:inline-block;">
        <img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo - ${pId}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer;">
        ${isMine ? `<button class="del-photo-btn" data-point="${pId}" data-idx="${idx}" style="position:absolute;top:-4px;right:-4px;background:#B23A34;color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;font-weight:bold;line-height:1;">✕</button>` : ''}
      </div>
    `).join('');
  };

  const listEl = document.getElementById('pointsList');
  
  const refreshPointsListUI = () => {
    listEl.innerHTML = activePoints.map(p=>{
      const r = currentBranch.reponses[p.id] || { conforme: null, photos:[], commentaire:'' };

      const myPhotos = r.photos || [];
      const eqR = equipeReponses[p.id] || {};
      const eqPhotos = isContreVisite ? (eqR.photos || []) : [];

      const eqWasOk = (eqR.conforme === true && eqR.photos && eqR.photos.length > 0);
      const isEquipeNok = isContreVisite && !eqWasOk;

      const isEquipeLocked = !isContreVisite && myPhotos.length === 0;
      const isCtrlNokLocked = isContreVisite && eqWasOk && myPhotos.length === 0;

      return `
        <div class="point-item" data-point="${p.id}" style="border:1px solid ${isEquipeNok?'#B23A34':'#E7E1D6'};padding:12px;border-radius:10px;margin-bottom:12px;background:${isEquipeNok?'#F6DEDC':'#fff'};">
          <div class="point-head">
            <div class="point-label" style="font-weight:600;">
              ${p.label} <small>(${p.freq==='J'?'Jour':(p.freq==='H'?'Hebdo':'Mensuel')})</small>
              ${isEquipeNok ? `<span style="background:#B23A34;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px;font-weight:bold;">⚠️ ÉQUIPE : NOK</span>` : ''}
            </div>
            <div class="point-toggle" style="margin-top:6px;">
              <button class="toggle-btn conforme ${r.conforme===true?'active':''}" data-val="true" ${isEquipeLocked ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>✓ OK</button>
              <button class="toggle-btn non-conforme ${r.conforme===false?'active':''}" data-val="false" ${(isEquipeLocked || isCtrlNokLocked) ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>✕ NOK</button>
            </div>
          </div>

          ${isContreVisite && eqPhotos.length ? `
            <div style="font-size:11px;color:#2B6E68;font-weight:700;margin-top:8px;">📸 Photos transmises par l'Équipe :</div>
            <div class="point-photo-row" style="display:flex;gap:6px;overflow-x:auto;padding:6px;background:#DCEEEC;border-radius:8px;margin-top:4px;">
              ${eqPhotos.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Équipe - ${p.label}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">`).join('')}
            </div>
          ` : ''}

          ${isContreVisite && eqR.commentaire ? `
            <div style="font-size:11px;color:#2B6E68;margin-top:4px;font-style:italic;">💬 Obs. Équipe (${c.passageEquipe.agentNom||'Équipe'}) : "${eqR.commentaire}"</div>
          ` : ''}

          <div style="font-size:11px;color:#6B655C;margin-top:8px;">
            ${isContreVisite ? 'Tes photos contrôleur (exigée si passage en NOK) :' : 'Photo obligatoire pour activer la réponse :'}
          </div>
          <div class="point-photo-row" id="photos_${p.id}" style="display:flex;gap:6px;align-items:center;overflow-x:auto;margin-top:4px;">
            ${renderPhotosHtml(myPhotos, true, p.id)}
            <label class="photo-btn" style="border:1px dashed #C7791B;padding:8px 12px;border-radius:6px;font-size:12px;color:#C7791B;cursor:pointer;white-space:nowrap;">
              📷 + Photo
              <input type="file" accept="image/*" capture="environment" style="display:none;" data-photo-input>
            </label>
          </div>
          
          <textarea class="point-comment" placeholder="${isContreVisite ? 'Remarques Contrôleur (optionnel)' : 'Remarques Équipe (optionnel)'}" style="width:100%;margin-top:8px;padding:6px;border-radius:6px;border:1px solid #E7E1D6;">${r.commentaire||''}</textarea>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.click-zoom').forEach(img => {
      img.onclick = () => openPhotoViewer(img.src, img.dataset.title);
    });

    listEl.querySelectorAll('.del-photo-btn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const pId = btn.dataset.point;
        const idx = parseInt(btn.dataset.idx);
        if(currentBranch.reponses[pId] && currentBranch.reponses[pId].photos){
          currentBranch.reponses[pId].photos.splice(idx, 1);
          await triggerAutoSave();
          toast('Photo supprimée');
          refreshPointsListUI();
        }
      };
    });

    listEl.querySelectorAll('.point-item').forEach(item=>{
      const pId = item.dataset.point;
      if(!currentBranch.reponses[pId]) {
        currentBranch.reponses[pId] = { conforme: null, photos:[], commentaire:'' };
      }
      const r = currentBranch.reponses[pId];

      item.querySelectorAll('.toggle-btn').forEach(btn=>{
        btn.onclick = async (e)=>{
          if(btn.hasAttribute('disabled')){
            if(!isContreVisite){
              toast('📷 Dépose au moins une photo pour déverrouiller cet item');
            } else {
              toast('📷 Photo contrôleur obligatoire pour passer cet item Équipe OK en NOK !');
            }
            e.preventDefault();
            return;
          }
          r.conforme = btn.dataset.val==='true';
          item.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          
          await triggerAutoSave();
          toast('Enregistré');
        };
      });

      const fileInput = item.querySelector('[data-photo-input]');
      fileInput.onchange = async ()=>{
        if(!fileInput.files.length) return;
        const dataUrl = await fileToResizedBase64(fileInput.files[0], 600);
        r.photos = r.photos || [];
        r.photos.push(dataUrl);

        await triggerAutoSave();
        toast('Photo ajoutée');
        refreshPointsListUI();
      };

      item.querySelector('.point-comment').oninput = (e)=>{
        r.commentaire = e.target.value;
        clearTimeout(item.__commentTimer);
        item.__commentTimer = setTimeout(async ()=>{
          await triggerAutoSave();
        }, 800);
      };
    });
  };

  refreshPointsListUI();

  document.getElementById('saveBtn').onclick = async ()=>{
    await triggerAutoSave();
    goToZones();
  };
}

/* =========================================================================
   ÉCRAN HISTORIQUE
   ========================================================================= */
async function renderHistory(){
  resetInactivityTimer();
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Historique des Prestations', 'Consultation Archives')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section" style="padding:16px;">
        <div class="field" style="margin-bottom:15px;">
          <label style="font-weight:600;font-size:13px;color:#211E1A;display:block;margin-bottom:6px;">Sélectionner une date d'archive :</label>
          <input type="date" id="histDateSelect" value="${todayISO()}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #E7E1D6;font-size:14px;background:#fff;">
        </div>
        <div id="histSummary" style="margin-bottom:20px;"></div>
        <div id="histContent">Chargement…</div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;
  const dateInput = document.getElementById('histDateSelect');
  
  const loadHistoryDate = async (selectedDate) => {
    const summaryEl = document.getElementById('histSummary');
    const content = document.getElementById('histContent');
    content.innerHTML = '<div class="section-note">Chargement des données...</div>';
    summaryEl.innerHTML = '';
    
    let htmlContent = '';
    let summaryHtml = `
      <div style="background:#FAF8F3;border:1px solid #E7E1D6;border-radius:10px;padding:12px;margin-bottom:15px;">
        <div style="font-weight:700;font-size:12px;color:#C7791B;text-transform:uppercase;margin-bottom:8px;">Sommaire par Zone (${fmtDate(selectedDate)})</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    `;

    let hasDataForDate = false;

    for(const z of ZONES){
      const controleId = `${selectedDate}__${z.id}`;
      let c = await idbGet('controles', controleId);
      if(navigator.onLine && !c){
        try {
          const doc = await db.collection('controles').doc(controleId).get();
          if(doc.exists) c = doc.data();
        } catch(e){}
      }

      const activePoints = await getPointsForToday(z.id, selectedDate);
      const eq = (c && c.passageEquipe) || {};
      const cv = (c && c.contreVisite) || {};

      let zoneNokCount = 0;
      let zoneChecked = 0;

      activePoints.forEach(p => {
        const rEq = (eq.reponses && eq.reponses[p.id]) || {};
        const rCv = (cv.reponses && cv.reponses[p.id]) || {};
        const eqOk = ((rEq.photos && rEq.photos.length > 0) && rEq.conforme !== false);
        const cvOk = (rCv.conforme !== false);

        if(rEq.conforme !== undefined || rCv.conforme !== undefined) zoneChecked++;
        if(!cvOk || !eqOk) zoneNokCount++;
      });

      if(c) hasDataForDate = true;

      summaryHtml += `
        <a href="#hist_zone_${z.id}" style="text-decoration:none;display:flex;justify-content:space-between;align-items:center;background:#fff;padding:8px 10px;border-radius:6px;border:1px solid #E7E1D6;color:#211E1A;font-size:12px;font-weight:600;">
          <span>• ${z.nom}</span>
          <span style="font-size:10px;padding:2px 6px;border-radius:4px;color:#fff;background:${zoneNokCount > 0 ? '#B23A34' : (zoneChecked > 0 ? '#2B6E68' : '#6B655C')};">
            ${zoneNokCount > 0 ? `${zoneNokCount} NOK` : (zoneChecked > 0 ? 'Conforme' : 'Non saisi')}
          </span>
        </a>
      `;

      if(c){
        htmlContent += `
          <div id="hist_zone_${z.id}" style="border:1px solid #E7E1D6;border-radius:12px;margin-bottom:20px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <div style="background:#211E1A;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-weight:700;font-size:14px;color:#F3E2C6;">ZONE : ${z.nom.toUpperCase()}</div>
              <a href="#histSummary" style="color:#C7791B;font-size:11px;text-decoration:none;">↑ Sommaire</a>
            </div>

            <div style="padding:12px;">
        `;

        activePoints.forEach(p => {
          const rEq = (eq.reponses && eq.reponses[p.id]) || {};
          const rCv = (cv.reponses && cv.reponses[p.id]) || {};
          
          const eqPhotos = rEq.photos || [];
          const cvPhotos = rCv.photos || [];

          const eqOk = (eqPhotos.length > 0 && rEq.conforme !== false);
          const cvOk = (rCv.conforme !== false);

          const isFinalOk = (cvOk === true);
          const isRealEcart = (eqOk === true && cvOk === false);

          const eqAgent = rEq.agentNom || eq.agentNom || 'Agent';
          const eqTime = rEq.heure || eq.heure || '--:--';
          const cvCtrl = rCv.controleurNom || cv.controleurNom || 'Contrôleur';
          const cvTime = rCv.heure || cv.heure || '--:--';

          htmlContent += `
            <div style="border:1px solid ${isFinalOk ? '#2B6E68' : '#B23A34'};background:${isFinalOk ? '#DCEEEC' : '#FEF2F2'};padding:12px;border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;">
                <div style="font-weight:600;font-size:13.5px;color:#211E1A;flex:1;">${p.label}</div>
                ${isRealEcart ? `<span style="background:#B23A34;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;">ÉCART / NOK</span>` : ''}
              </div>

              <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600;background:${eqOk?'#2B6E68':'#B23A34'};color:#fff;">
                  <span>Équipe (${eqAgent} ${eqTime}) :</span>
                  <strong>${eqOk?'✓ OK':'✕ NOK'}</strong>
                </div>

                <div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600;background:${cvOk?'#2B6E68':'#B23A34'};color:#fff;">
                  <span>Contrôleur (${cvCtrl} ${cvTime}) :</span>
                  <strong>${cvOk?'✓ OK':'✕ NOK'}</strong>
                </div>
              </div>

              ${rEq.commentaire ? `<div style="font-size:11px;color:#4A453E;margin-top:4px;">💬 <em>Obs. Équipe [${eqAgent} à ${eqTime}] :</em> "${rEq.commentaire}"</div>` : ''}
              ${rCv.commentaire ? `<div style="font-size:11px;color:#C7791B;margin-top:4px;">💬 <em>Obs. Contrôleur [${cvCtrl} à ${cvTime}] :</em> "${rCv.commentaire}"</div>` : ''}

              ${(eqPhotos.length || cvPhotos.length) ? `
                <div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">
                  ${eqPhotos.map(pSrc => `
                    <div style="position:relative;flex-shrink:0;">
                      <img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Équipe (${eqAgent} ${eqTime}) - ${p.label}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">
                      <span style="position:absolute;bottom:0;left:0;right:0;background:#2B6E68;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">${eqAgent} (${eqTime})</span>
                    </div>
                  `).join('')}

                  ${cvPhotos.map(pSrc => `
                    <div style="position:relative;flex-shrink:0;">
                      <img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Contrôleur (${cvCtrl} ${cvTime}) - ${p.label}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #C7791B;cursor:pointer;">
                      <span style="position:absolute;bottom:0;left:0;right:0;background:#C7791B;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">CTRL: ${cvCtrl} (${cvTime})</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        });
        htmlContent += `</div></div>`;
      }
    }

    summaryHtml += `</div></div>`;
    
    if(hasDataForDate){
      summaryEl.innerHTML = summaryHtml;
      content.innerHTML = htmlContent;
    } else {
      summaryEl.innerHTML = '';
      content.innerHTML = '<div class="section-note" style="text-align:center;padding:20px;">Aucun rapport enregistré pour cette date.</div>';
    }

    content.querySelectorAll('.click-zoom').forEach(img => {
      img.onclick = () => openPhotoViewer(img.src, img.dataset.title);
    });
  };

  dateInput.onchange = (e) => loadHistoryDate(e.target.value);
  loadHistoryDate(todayISO());
}

/* =========================================================================
   ÉCRAN STATISTIQUES & SUIVI CENTRÉ SUR LES NOK
   ========================================================================= */
async function renderStats(){
  resetInactivityTimer();
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Suivi des Anomalies (NOK)', 'Tableau de Bord')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section" style="padding:16px;">
        <div class="field" style="margin-bottom:15px;">
          <label style="font-weight:600;font-size:13px;color:#211E1A;display:block;margin-bottom:6px;">Contexte de comparaison :</label>
          <select id="statsContextSelect" style="width:100%;padding:10px;border-radius:8px;border:1px solid #E7E1D6;font-size:14px;background:#fff;">
            <option value="prev_week">7 derniers jours vs 7 jours précédents</option>
            <option value="target">7 derniers jours vs Seuil Cible (Max 5% NOK)</option>
          </select>
        </div>
        <div id="statsDashboard">Chargement du dashboard…</div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;
  const contextSelect = document.getElementById('statsContextSelect');

  let allControles = await idbGetAll('controles');
  if(navigator.onLine){
    try {
      const snap = await db.collection('controles').get();
      allControles = snap.docs.map(d=>d.data());
    } catch(e){}
  }

  const computePeriodStats = (startDateIso, endDateIso) => {
    let totalChecked = 0, nokCount = 0, ecartsCount = 0;
    let zoneBreakdown = {};
    let itemNokMap = {};

    ZONES.forEach(z => { zoneBreakdown[z.id] = { total:0, nok:0, nom:z.nom }; });

    allControles.filter(c => c.date >= startDateIso && c.date <= endDateIso).forEach(c => {
      const eq = (c.passageEquipe && c.passageEquipe.reponses) || {};
      const cv = (c.contreVisite && c.contreVisite.reponses) || {};

      Object.keys(eq).forEach(pId => {
        const rEq = eq[pId];
        const rCv = cv[pId];
        if(rEq){
          totalChecked++;
          const eqOk = (rEq.photos && rEq.photos.length > 0 && rEq.conforme !== false);
          const cvOk = (rCv ? rCv.conforme !== false : true);

          if(zoneBreakdown[c.zoneId]) zoneBreakdown[c.zoneId].total++;

          if(!cvOk || !eqOk){
            nokCount++;
            if(zoneBreakdown[c.zoneId]) zoneBreakdown[c.zoneId].nok++;
            itemNokMap[pId] = (itemNokMap[pId] || 0) + 1;
          }

          if(eqOk === true && cvOk === false){
            ecartsCount++;
          }
        }
      });
    });

    const nokRate = totalChecked ? Math.round((nokCount / totalChecked) * 100) : 0;

    return { totalChecked, nokCount, ecartsCount, nokRate, zoneBreakdown, itemNokMap };
  };

  const updateStatsUI = () => {
    const today = new Date();
    const d7 = new Date(today); d7.setDate(d7.getDate() - 6);
    const d14 = new Date(today); d14.setDate(d14.getDate() - 13);

    const currentStats = computePeriodStats(d7.toISOString().slice(0,10), todayISO());
    const prevStats = computePeriodStats(d14.toISOString().slice(0,10), d7.toISOString().slice(0,10));

    const mode = contextSelect.value;
    const refNokRate = mode === 'target' ? 5 : prevStats.nokRate;
    const refLabel = mode === 'target' ? 'vs Cible Max (5%)' : 'vs Semaine précédente';

    const deltaNok = currentStats.nokRate - refNokRate;

    let topNokItems = Object.keys(currentStats.itemNokMap).map(id => {
      let label = id;
      Object.keys(DEFAULT_POINTS).forEach(zk => {
        const found = DEFAULT_POINTS[zk].find(pt => pt.id === id);
        if(found) label = found.label;
      });
      return { id, label, count: currentStats.itemNokMap[id] };
    }).sort((a,b) => b.count - a.count).slice(0,5);

    let html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
        <div style="background:#FAF8F3;padding:14px;border-radius:10px;border:1px solid #E7E1D6;text-align:center;">
          <div style="font-size:10px;color:#6B655C;text-transform:uppercase;font-weight:700;">Taux d'Anomalies (NOK)</div>
          <div style="font-size:26px;font-weight:800;color:#B23A34;margin-top:2px;">${currentStats.nokRate}%</div>
          <div style="font-size:11px;font-weight:600;margin-top:2px;color:${deltaNok<=0?'#2B6E68':'#B23A34'};">
            ${deltaNok<=0?'▼ ':'▲ +'}${deltaNok}% ${refLabel}
          </div>
        </div>

        <div style="background:#FAF8F3;padding:14px;border-radius:10px;border:1px solid #E7E1D6;text-align:center;">
          <div style="font-size:10px;color:#6B655C;text-transform:uppercase;font-weight:700;">Anomalies Relevées</div>
          <div style="font-size:20px;font-weight:800;color:#B23A34;margin-top:4px;">${currentStats.nokCount} NOK</div>
          <div style="font-size:12px;color:#6B655C;margin-top:2px;font-weight:600;">dont ${currentStats.ecartsCount} écart(s)</div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid #E7E1D6;border-radius:10px;padding:14px;margin-bottom:15px;">
        <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:12px;">📊 Analyse Comparative des Défauts (NOK)</div>
        <div style="display:flex;align-items:flex-end;justify-style:space-around;height:120px;border-bottom:2px solid #E7E1D6;padding-bottom:5px;">
          <div style="display:flex;flex-direction:column;align-items:center;width:40%;">
            <span style="font-size:11px;font-weight:700;color:#B23A34;margin-bottom:4px;">${currentStats.nokRate}% NOK</span>
            <div style="width:100%;max-width:50px;background:#B23A34;height:${Math.max(10, currentStats.nokRate * 1.2)}px;border-top-left-radius:6px;border-top-right-radius:6px;"></div>
            <span style="font-size:10px;color:#6B655C;margin-top:6px;font-weight:600;">7j Actuels</span>
          </div>

          <div style="display:flex;flex-direction:column;align-items:center;width:40%;">
            <span style="font-size:11px;font-weight:700;color:#C7791B;margin-bottom:4px;">${refNokRate}% NOK</span>
            <div style="width:100%;max-width:50px;background:#C7791B;height:${Math.max(10, refNokRate * 1.2)}px;border-top-left-radius:6px;border-top-right-radius:6px;"></div>
            <span style="font-size:10px;color:#6B655C;margin-top:6px;font-weight:600;">${mode==='target'?'Seuil Cible':'7j Précédents'}</span>
          </div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid #E7E1D6;border-radius:10px;padding:14px;margin-bottom:15px;">
        <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:10px;">Répartition des NOK par Zone (7 derniers jours)</div>
    `;

    ZONES.forEach(z => {
      const zb = currentStats.zoneBreakdown[z.id];
      const zNokRate = zb.total ? Math.round((zb.nok / zb.total) * 100) : 0;
      html += `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
            <span style="font-weight:600;color:#211E1A;">${z.nom}</span>
            <strong style="color:${zNokRate===0?'#2B6E68':'#B23A34'};">${zNokRate}% NOK (${zb.nok}/${zb.total})</strong>
          </div>
          <div style="background:#E7E1D6;height:8px;border-radius:4px;overflow:hidden;">
            <div style="background:${zNokRate===0?'#2B6E68':'#B23A34'};width:${zNokRate}%;height:100%;"></div>
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <div style="background:#fff;border:1px solid #E7E1D6;border-radius:10px;padding:14px;">
        <div style="font-weight:700;font-size:13px;color:#B23A34;margin-bottom:10px;">⚠️ Classement des Tâches les plus souvent NOK</div>
        ${topNokItems.length > 0 ? topNokItems.map(te => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #E7E1D6;font-size:12px;">
            <span style="color:#211E1A;font-weight:500;">${te.label}</span>
            <span style="background:#FEF2F2;color:#B23A34;font-weight:700;padding:2px 8px;border-radius:4px;font-size:11px;border:1px solid #B23A34;">${te.count} fois NOK</span>
          </div>
        `).join('') : '<div style="font-size:12px;color:#2B6E68;font-weight:600;">Aucune anomalie NOK relevée sur cette période ! 🎉</div>'}
      </div>
    `;

    document.getElementById('statsDashboard').innerHTML = html;
  };

  contextSelect.onchange = updateStatsUI;
  updateStatsUI();
}

/* =========================================================================
   GÉNÉRATION DU RAPPORT PDF GLOBAL
   ========================================================================= */
async function generateGlobalPDF(){
  resetInactivityTimer();
  if(typeof window.jspdf === 'undefined'){ toast('Bibliothèque PDF indisponible'); return; }
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const date = todayISO();
  
  const C_INK = [33, 30, 26];
  const C_AMBER = [199, 121, 27];
  const C_TEAL = [43, 110, 104];
  const C_TEAL_BG = [220, 238, 236];
  const C_RED = [178, 58, 52];
  const C_RED_BG = [254, 242, 242];
  const C_BG = [250, 248, 243];
  const C_LINE = [231, 225, 214];

  let totalNok = 0;
  let totalEcarts = 0;
  const zonePageMap = {};

  // --- PAGE 1 : EN-TÊTE ET SOMMAIRE ---
  docPdf.setFillColor(...C_INK);
  docPdf.rect(0, 0, 210, 28, 'F');
  
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(15);
  docPdf.text('SASU SOAN — RAPPORT DE PRESTATION', 14, 15);
  
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(9);
  docPdf.setTextColor(220, 220, 220);
  docPdf.text(`Date : ${fmtDate(date)}  |  Généré le : ${new Date().toLocaleTimeString('fr-FR')}`, 14, 22);

  docPdf.setFillColor(...C_BG);
  docPdf.roundedRect(14, 34, 182, 22, 3, 3, 'F');
  docPdf.setDrawColor(...C_LINE);
  docPdf.roundedRect(14, 34, 182, 22, 3, 3, 'S');

  docPdf.setTextColor(...C_INK);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(10);
  docPdf.text('SOMMAIRE DE PRESTATION', 18, 42);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(8.5);
  docPdf.setTextColor(100, 100, 100);
  docPdf.text('Cliquez sur une zone ci-dessous pour accéder directement au rapport détaillé.', 18, 48);

  let currentY = 64;
  
  for(const z of ZONES){
    docPdf.setFillColor(255, 255, 255);
    docPdf.roundedRect(14, currentY, 182, 12, 2, 2, 'F');
    docPdf.setDrawColor(...C_LINE);
    docPdf.roundedRect(14, currentY, 182, 12, 2, 2, 'S');

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(10);
    docPdf.setTextColor(...C_AMBER);
    docPdf.text(`• ZONE : ${z.nom.toUpperCase()}`, 18, currentY + 8);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(8.5);
    docPdf.setTextColor(...C_INK);
    docPdf.text('Accéder au détail ->', 140, currentY + 8);

    zonePageMap[z.id] = { ySommaire: currentY, pageTarget: 0 };
    currentY += 16;
  }

  // --- PAGES DE DETAIL ---
  for(const z of ZONES){
    docPdf.addPage();
    const pageNum = docPdf.internal.getNumberOfPages();
    zonePageMap[z.id].pageTarget = pageNum;

    let y = 20;

    docPdf.setFillColor(...C_AMBER);
    docPdf.rect(14, y, 182, 8, 'F');
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(11);
    docPdf.text(`ZONE : ${z.nom.toUpperCase()}`, 18, y + 5.5);
    y += 14;

    const controleId = `${date}__${z.id}`;
    let c = await idbGet('controles', controleId);
    if(navigator.onLine && !c){
      try {
        const doc = await db.collection('controles').doc(controleId).get();
        if(doc.exists) c = doc.data();
      } catch(e){}
    }

    const activePoints = await getPointsForToday(z.id, date);
    const eq = (c && c.passageEquipe) || {};
    const cv = (c && c.contreVisite) || {};

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(8.5);
    docPdf.setTextColor(...C_INK);
    docPdf.text(`Prestation du ${fmtDate(date)}`, 14, y);
    y += 8;

    for(const p of activePoints){
      const rEq = (eq.reponses && eq.reponses[p.id]) || { conforme: null, photos:[], commentaire:'', agentNom: eq.agentNom, heure: eq.heure };
      const rCv = (cv.reponses && cv.reponses[p.id]) || { conforme: null, photos:[], commentaire:'', controleurNom: cv.controleurNom, heure: cv.heure };

      let eqConformeCalculated = (rEq.photos && rEq.photos.length > 0) ? (rEq.conforme !== false) : false;
      let cvConformeCalculated = (rCv.conforme === false) ? false : true;

      const isFinalOk = (cvConformeCalculated === true);
      const isRealEcart = (eqConformeCalculated === true && cvConformeCalculated === false);

      if(!isFinalOk || !eqConformeCalculated) totalNok++;
      if(isRealEcart) totalEcarts++;

      if(y > 250){ docPdf.addPage(); y = 20; }

      if(isFinalOk){
        docPdf.setFillColor(...C_TEAL_BG);
        docPdf.setDrawColor(...C_TEAL);
      } else {
        docPdf.setFillColor(...C_RED_BG);
        docPdf.setDrawColor(...C_RED);
      }

      docPdf.roundedRect(14, y, 182, 14, 2, 2, 'FD');

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(...C_INK);
      docPdf.text(p.label, 18, y + 6);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8);
      docPdf.text(`Équipe: ${eqConformeCalculated?'OK':'NOK'}`, 125, y + 6);
      docPdf.text(`Contrôleur: ${cvConformeCalculated?'OK':'NOK'}`, 150, y + 6);

      if(isRealEcart){
        docPdf.setFillColor(...C_RED);
        docPdf.rect(175, y + 2, 16, 10, 'F');
        docPdf.setTextColor(255, 255, 255);
        docPdf.setFont('helvetica', 'bold');
        docPdf.setFontSize(7);
        docPdf.text('ÉCART', 177, y + 8);
      }

      y += 18;

      const eqAgent = rEq.agentNom || eq.agentNom || 'Agent';
      const eqTime = rEq.heure || eq.heure || '--:--';
      const cvCtrl = rCv.controleurNom || cv.controleurNom || 'Contrôleur';
      const cvTime = rCv.heure || cv.heure || '--:--';

      if(rEq.commentaire || rCv.commentaire || eqAgent || cvCtrl){
        docPdf.setFontSize(8);
        docPdf.setTextColor(80, 80, 80);
        if(rEq.commentaire){
          docPdf.text(`• Obs. Équipe [${eqAgent} à ${eqTime}] : ${rEq.commentaire}`, 18, y);
          y += 5;
        }
        if(rCv.commentaire){
          docPdf.text(`• Obs. Contrôleur [${cvCtrl} à ${cvTime}] : ${rCv.commentaire}`, 18, y);
          y += 5;
        }
      }

      const allEqPhotos = rEq.photos || [];
      const allCvPhotos = rCv.photos || [];

      if(allEqPhotos.length > 0 || allCvPhotos.length > 0){
        if(y > 210){ docPdf.addPage(); y = 20; }

        let xPos = 18;
        
        for(const imgBase64 of allEqPhotos){
          try {
            docPdf.addImage(imgBase64, 'JPEG', xPos, y, 55, 38);
            docPdf.setFillColor(...C_TEAL);
            docPdf.rect(xPos, y + 38, 55, 6, 'F');
            docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
            docPdf.text(`ÉQUIPE : ${eqAgent} (${eqTime})`, xPos + 2, y + 42.5);

            xPos += 58;
            if(xPos > 140){ xPos = 18; y += 48; }
          } catch(e){}
        }

        for(const imgBase64 of allCvPhotos){
          try {
            docPdf.addImage(imgBase64, 'JPEG', xPos, y, 55, 38);
            docPdf.setFillColor(...C_AMBER);
            docPdf.rect(xPos, y + 38, 55, 6, 'F');
            docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
            docPdf.text(`CTRL : ${cvCtrl} (${cvTime})`, xPos + 2, y + 42.5);

            xPos += 58;
            if(xPos > 140){ xPos = 18; y += 48; }
          } catch(e){}
        }

        y += 50;
      }
    }
  }

  docPdf.setPage(1);
  for(const z of ZONES){
    const info = zonePageMap[z.id];
    if(info && info.pageTarget > 0){
      docPdf.link(14, info.ySommaire, 182, 12, { pageNumber: info.pageTarget });
    }
  }

  docPdf.setFillColor(...(totalNok === 0 ? C_TEAL : C_RED));
  docPdf.roundedRect(14, 140, 182, 14, 3, 3, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(10);
  
  const statusMsg = totalNok === 0 
    ? 'BILAN CONTRÔLE : PRESTATION CONFORME — 0 NOK' 
    : `BILAN CONTRÔLE : ${totalNok} NOK dont ${totalEcarts} écart(s)`;
  
  docPdf.text(statusMsg, 18, 149);

  docPdf.save(`Rapport_SOAN_Global_${date}.pdf`);
}

/* =========================================================================
   ADMINISTRATION DU PLANNING & DE L'ÉDITION DES TÂCHES
   ========================================================================= */
async function renderTaskAdmin(){
  resetInactivityTimer();
  const allMap = await getAllTasksMap();

  let tasksHtml = '';
  ZONES.forEach(z => {
    const zonePoints = allMap[z.id] || [];
    tasksHtml += `
      <div style="margin-top:20px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #C7791B;padding-bottom:6px;">
        <div class="section-title" style="margin:0;font-size:16px;color:#C7791B;">${z.nom.toUpperCase()}</div>
        <button class="btn amber small add-task-btn" data-zone="${z.id}">+ Ajouter une tâche</button>
      </div>
    `;
    
    if(zonePoints.length === 0){
      tasksHtml += `<div style="font-size:12px;color:#6B655C;font-style:italic;padding:8px 0;">Aucune tâche enregistrée dans cette zone.</div>`;
    } else {
      zonePoints.forEach(p => {
        const currentFreq = p.freq || 'J';
        const currentVal = p.targetValue || 1;

        tasksHtml += `
          <div class="task-admin-card" data-task-id="${p.id}" data-zone-id="${z.id}" style="background:#fff;border:1px solid #E7E1D6;padding:12px;border-radius:8px;margin-top:10px;">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
              <input type="text" class="task-label-input" value="${p.label.replace(/"/g, '&quot;')}" style="flex:1;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:13px;font-weight:600;color:#211E1A;">
              <button class="btn danger small delete-task-btn" data-task-id="${p.id}" data-zone-id="${z.id}" style="padding:6px 10px;">Suppr.</button>
            </div>
            
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <div style="flex:1;min-width:130px;">
                <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:2px;">Fréquence :</label>
                <select class="freq-select" data-task="${p.id}" style="width:100%;padding:6px;border-radius:6px;border:1px solid #E7E1D6;font-size:12px;">
                  <option value="J" ${currentFreq==='J'?'selected':''}>Quotidien (Tous les jours)</option>
                  <option value="H" ${currentFreq==='H'?'selected':''}>Hebdomadaire (Un jour/semaine)</option>
                  <option value="M" ${currentFreq==='M'?'selected':''}>Mensuel (Un jour/mois)</option>
                </select>
              </div>

              <div class="target-val-box" id="target_box_${p.id}" style="flex:1;min-width:140px;display:${currentFreq==='J'?'none':'block'};">
                <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:2px;">Jour d'exécution :</label>
                <select class="val-select-hebdo" data-task="${p.id}" style="width:100%;padding:6px;border-radius:6px;border:1px solid #E7E1D6;font-size:12px;display:${currentFreq==='H'?'block':'none'};">
                  <option value="1" ${currentVal==1?'selected':''}>Lundi</option>
                  <option value="2" ${currentVal==2?'selected':''}>Mardi</option>
                  <option value="3" ${currentVal==3?'selected':''}>Mercredi</option>
                  <option value="4" ${currentVal==4?'selected':''}>Jeudi</option>
                  <option value="5" ${currentVal==5?'selected':''}>Vendredi</option>
                  <option value="6" ${currentVal==6?'selected':''}>Samedi</option>
                  <option value="0" ${currentVal==0?'selected':''}>Dimanche</option>
                </select>

                <div class="val-input-mensuel-wrap" style="display:${currentFreq==='M'?'flex':'none'};align-items:center;gap:6px;">
                  <input type="number" class="val-input-mensuel" data-task="${p.id}" min="1" max="28" value="${currentVal}" style="width:70px;padding:6px;border-radius:6px;border:1px solid #E7E1D6;font-size:12px;">
                  <span style="font-size:11px;color:#6B655C;">du mois</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }
  });

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Planning & Référentiel', 'Gestion des Tâches')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section" style="padding:16px;">
        <div class="section-note">Modifiez les libellés, récurrences, ou ajoutez/supprimez des tâches par zone.</div>
        ${tasksHtml}
        <button class="btn amber block" id="saveTasksBtn" style="margin-top:20px;margin-bottom:20px;">Sauvegarder les modifications</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  document.querySelectorAll('.freq-select').forEach(sel => {
    sel.onchange = () => {
      const taskId = sel.dataset.task;
      const val = sel.value;
      const targetBox = document.getElementById(`target_box_${taskId}`);
      const selectHebdo = targetBox.querySelector('.val-select-hebdo');
      const wrapMensuel = targetBox.querySelector('.val-input-mensuel-wrap');

      if(val === 'J'){
        targetBox.style.display = 'none';
      } else if(val === 'H'){
        targetBox.style.display = 'block';
        selectHebdo.style.display = 'block';
        wrapMensuel.style.display = 'none';
      } else if(val === 'M'){
        targetBox.style.display = 'block';
        selectHebdo.style.display = 'none';
        wrapMensuel.style.display = 'flex';
      }
    };
  });

  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.onclick = async () => {
      const zoneId = btn.dataset.zone;
      const label = prompt("Nom de la nouvelle tâche :");
      if(!label || !label.trim()) return;

      const newTaskId = uid(`task_${zoneId}`);
      const taskData = {
        taskId: newTaskId,
        zoneId: zoneId,
        label: label.trim(),
        freq: 'J',
        targetValue: 1,
        deleted: false
      };

      await pushToCloud('task_schedule', newTaskId, taskData);
      toast('Tâche ajoutée !');
      renderTaskAdmin();
    };
  });

  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.onclick = async () => {
      if(!confirm("Supprimer définitivement cette tâche ?")) return;
      const taskId = btn.dataset.taskId;
      const zoneId = btn.dataset.zoneId;

      const taskData = {
        taskId: taskId,
        zoneId: zoneId,
        deleted: true
      };

      await pushToCloud('task_schedule', taskId, taskData);
      toast('Tâche supprimée !');
      renderTaskAdmin();
    };
  });

  document.getElementById('saveTasksBtn').onclick = async ()=>{
    const cards = document.querySelectorAll('.task-admin-card');
    for(const card of cards){
      const taskId = card.dataset.taskId;
      const zoneId = card.dataset.zoneId;
      const label = card.querySelector('.task-label-input').value.trim();
      const freq = card.querySelector('.freq-select').value;
      let targetValue = 1;

      if(freq === 'H'){
        targetValue = parseInt(card.querySelector('.val-select-hebdo').value);
      } else if(freq === 'M'){
        targetValue = parseInt(card.querySelector('.val-input-mensuel').value) || 1;
      }

      const data = {
        taskId,
        zoneId,
        label: label || 'Tâche sans nom',
        freq,
        targetValue,
        deleted: false
      };

      await pushToCloud('task_schedule', taskId, data);
    }
    toast('Tâches et planning sauvegardés !');
    goToZones();
  };
}

/* =========================================================================
   ADMINISTRATION UTILISATEURS
   ========================================================================= */
async function renderAgentsAdmin(){
  resetInactivityTimer();
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Gestion Utilisateurs', 'Cloud & Local')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div id="agentsList"><div class="section-note">Chargement…</div></div>
        <button class="btn amber block" id="addAgentBtn" style="margin-top:15px;">+ Ajouter un profil</button>
      </div>
    </div>
  `;
  document.getElementById('backBtn').onclick = goToZones;
  document.getElementById('addAgentBtn').onclick = ()=>openAgentModal();
  
  await syncAgentsList();
}

async function syncAgentsList(){
  let agents = await idbGetAll('agents');
  
  if(navigator.onLine){
    try {
      const snap = await db.collection('agents').get();
      agents = snap.docs.map(d=>Object.assign({ id: d.id }, d.data()));
      for(const a of agents) await idbPut('agents', a);
    } catch(e){}
  }
  refreshAgentsList(agents);
}

function refreshAgentsList(agents){
  const el = document.getElementById('agentsList');
  if(!el) return;
  if(!agents.length){
    el.innerHTML = '<div class="section-note">Aucun profil enregistré. Créez votre premier compte ci-dessous.</div>';
    return;
  }
  el.innerHTML = agents.map(a=>`
    <div class="agent-row" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #E7E1D6;">
      <div>
        <div class="agent-name" style="font-weight:600;">${a.nom} ${a.role==='controleur'?'<span class="badge-role">Contrôleur</span>':''}</div>
        <div class="agent-meta" style="font-size:12px;color:#6B655C;">Code PIN : <strong>${a.pin}</strong></div>
      </div>
      <div class="agent-actions" style="display:flex;gap:6px;">
        <button class="btn ghost small" data-edit="${a.id}">Modifier</button>
        <button class="btn danger small" data-del="${a.id}">Suppr.</button>
      </div>
    </div>
  `).join('');

  el.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.onclick = async ()=>{
      const a = await idbGet('agents', btn.dataset.edit);
      if(a) openAgentModal(a);
    };
  });
  el.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = async ()=>{
      if(!confirm('Supprimer définitivement ce profil ?')) return;
      const id = btn.dataset.del;
      
      await idbDelete('agents', id);
      if(navigator.onLine){
        try { await db.collection('agents').doc(id).delete(); } catch(e){}
      }
      toast('Profil définitivement supprimé !');
      await syncAgentsList();
    };
  });
}

function openAgentModal(existing){
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>${existing?'Modifier':'Nouveau'} profil</h3>
      <div class="field"><label>Nom / Prénom</label><input id="am_nom" value="${existing?existing.nom:''}" placeholder="ex: Karim"></div>
      <div class="field"><label>Code PIN (4 chiffres)</label><input id="am_pin" value="${existing?existing.pin:''}" maxlength="4" inputmode="numeric" placeholder="ex: 1234"></div>
      <div class="field"><label>Rôle</label>
        <select id="am_role">
          <option value="agent" ${existing && existing.role==='agent'?'selected':''}>Équipe Nettoyage</option>
          <option value="controleur" ${existing && existing.role==='controleur'?'selected':''}>Contrôleur</option>
        </select>
      </div>
      <div style="display:flex;gap:10px;margin-top:15px;">
        <button class="btn amber" id="am_save" style="flex:1;">Enregistrer</button>
        <button class="btn ghost" id="am_cancel" style="flex:1;">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.getElementById('am_cancel').onclick = ()=>backdrop.remove();
  document.getElementById('am_save').onclick = async ()=>{
    const nom = document.getElementById('am_nom').value.trim();
    const pin = document.getElementById('am_pin').value.trim();
    const role = document.getElementById('am_role').value;
    if(!nom || !/^\d{4}$/.test(pin)){ toast('Saisissez un nom et un PIN à 4 chiffres'); return; }
    
    const id = existing ? existing.id : uid('agent');
    const agentData = { id, nom, pin, role, actif:true };
    
    await pushToCloud('agents', id, agentData);
    backdrop.remove();
    toast('Profil sauvegardé !');
    await syncAgentsList();
  };
}

/* =========================================================================
   NETTOYAGE DU CACHE SERVICE WORKER AU DEPLOIEMENT
   ========================================================================= */
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for(let registration of registrations) {
      registration.unregister();
    }
  }).catch(()=>{});
}

(function init(){
  renderLogin();
})();

})();
