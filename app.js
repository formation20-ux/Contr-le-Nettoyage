(function(){
'use strict';

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
   RÉFÉRENTIEL TÂCHES SASU SOAN
   ========================================================================= */
const ZONES = [
  { id:'lobby',           nom:'Lobby' },
  { id:'cuisine',         nom:'Cuisine' },
  { id:'arriere_cuisine', nom:'Arrière-cuisine' },
  { id:'comptoir',        nom:'Comptoir' }
];

const POINTS = {
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
   MOTEUR DE STOCKAGE HYBRIDE
   ========================================================================= */
const DB_NAME = 'soan-hybrid-db';
const DB_VERSION = 1;
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('controles')) db.createObjectStore('controles', { keyPath:'id' });
      if(!db.objectStoreNames.contains('agents')) db.createObjectStore('agents', { keyPath:'id' });
      if(!db.objectStoreNames.contains('task_schedule')) db.createObjectStore('task_schedule', { keyPath:'taskId' });
      if(!db.objectStoreNames.contains('sync_queue')) db.createObjectStore('sync_queue', { keyPath:'id' });
    };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
  return dbPromise;
}

async function idbPut(store, value){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = ()=>resolve(value);
    tx.onerror = ()=>reject(tx.error);
  });
}

async function idbGet(store, id){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = ()=>resolve(req.result || null);
    req.onerror = ()=>reject(req.error);
  });
}

async function idbGetAll(store){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = ()=>resolve(req.result || []);
    req.onerror = ()=>reject(req.error);
  });
}

async function idbDelete(store, id){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = ()=>resolve();
    tx.onerror = ()=>reject(tx.error);
  });
}

async function pushToCloud(collection, id, data){
  await idbPut(collection, data);
  if(navigator.onLine){
    try {
      await db.collection(collection).doc(id).set(data, { merge: true });
      await idbDelete('sync_queue', `${collection}_${id}`);
      return true;
    } catch(e) {
      await idbPut('sync_queue', { id: `${collection}_${id}`, collection, docId: id, data });
      return false;
    }
  } else {
    await idbPut('sync_queue', { id: `${collection}_${id}`, collection, docId: id, data });
    return false;
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
   APPLICATION LOGIC & STATE
   ========================================================================= */
let session = null;
let currentPin = '';
let pendingRole = 'agent';
let activeZoneId = null;
let activeControleId = null;
let activeMode = 'equipe';

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
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
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

async function getPointsForToday(zoneId, dateIso){
  const d = new Date(dateIso);
  const currentDay = d.getDay();
  const currentDate = d.getDate();
  const allPoints = POINTS[zoneId] || [];
  
  let schedMap = {};
  const localSched = await idbGetAll('task_schedule');
  localSched.forEach(s => { schedMap[s.taskId] = s; });

  if(navigator.onLine){
    try {
      const snap = await db.collection('task_schedule').get();
      snap.docs.forEach(doc => { 
        schedMap[doc.id] = doc.data(); 
        idbPut('task_schedule', doc.data());
      });
    } catch(e) {}
  }

  return allPoints.filter(p=>{
    if(p.freq === 'J') return true;
    const custom = schedMap[p.id];
    if(p.freq === 'H'){
      const targetDay = custom ? Number(custom.targetValue) : 1;
      return currentDay === targetDay;
    }
    if(p.freq === 'M'){
      const targetDate = custom ? Number(custom.targetValue) : 1;
      return currentDate === targetDate;
    }
    return false;
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
        <button class="btn amber small block" id="bypassBtn" style="margin-top:15px;">🔓 Accès Direct Admin Contrôleur</button>
      </div>
    </div>
  `;
  root.querySelectorAll('.role-btn').forEach(b=>{
    b.onclick = ()=>{ pendingRole=b.dataset.role; currentPin=''; renderLogin(); };
  });
  renderPinDots();
  renderPinPad();

  document.getElementById('bypassBtn').onclick = ()=>{
    session = { role: 'controleur', agentId: 'admin_temp', nom: 'Admin Secours' };
    goToZones();
  };
}

function renderPinDots(){
  const el = document.getElementById('pinDots');
  if(el) el.innerHTML = [0,1,2,3].map(i=>`<div class="pin-dot ${i<currentPin.length?'filled':''}"></div>`).join('');
}

function renderPinPad(){
  const el = document.getElementById('pinPad');
  if(!el) return;
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  el.innerHTML = keys.map(k=>{
    if(k==='') return `<div></div>`;
    return `<button class="pin-key ${k==='⌫'?'wide':''}" data-key="${k}">${k}</button>`;
  }).join('');
  el.querySelectorAll('[data-key]').forEach(btn=>{
    btn.onclick = ()=>onPinKey(btn.dataset.key);
  });
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
    currentPin=''; goToZones();
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
        <button class="btn ghost block" id="statsBtn" style="flex:1;">📊 Stats</button>
      </div>

      <button class="btn ghost block" id="globalPdfBtn" style="margin-bottom:15px;border-color:#C7791B;color:#C7791B;">📄 Générer Rapport Global PDF de la Journée</button>

      ${session.role==='controleur' ? `
        <button class="btn amber block" id="adminTasksBtn" style="margin-bottom:10px;">📅 Planning & Fréquence des Tâches</button>
        <button class="btn amber block" id="adminUsersBtn" style="margin-bottom:10px;">👤 Gestion des Utilisateurs / Accès</button>
      ` : ''}
      <button class="btn ghost block" id="logoutBtn">Déconnexion</button>
    </div>
  `;

  const grid = document.getElementById('zoneGrid');
  let html = '';
  for(const z of ZONES){
    const activePoints = await getPointsForToday(z.id, date);
    html += `
      <div class="zone-card" data-zone="${z.id}">
        <div>
          <div class="zone-name">${z.nom}</div>
          <div class="zone-meta">${activePoints.length} tâche(s) programmée(s) aujourd'hui</div>
        </div>
        <span class="zone-badge a-faire">À réaliser</span>
      </div>
    `;
  }
  grid.innerHTML = html;

  grid.querySelectorAll('.zone-card').forEach(card=>{
    card.onclick = ()=>{
      activeZoneId = card.dataset.zone;
      activeControleId = `${date}__${activeZoneId}`;
      activeMode = session.role==='agent' ? 'equipe' : 'contreVisite';
      renderControle();
    };
  });

  document.getElementById('historyBtn').onclick = () => renderHistory();
  document.getElementById('statsBtn').onclick = () => renderStats();
  document.getElementById('globalPdfBtn').onclick = () => generateGlobalPDF();
  document.getElementById('logoutBtn').onclick = ()=>{ session=null; currentPin=''; renderLogin(); };
  
  const tasksBtn = document.getElementById('adminTasksBtn');
  if(tasksBtn) tasksBtn.onclick = () => renderTaskAdmin();

  const usersBtn = document.getElementById('adminUsersBtn');
  if(usersBtn) usersBtn.onclick = () => renderAgentsAdmin();
}

/* =========================================================================
   SAISIE CONTRÔLE / PRESTATION ZONE (ALERTE NOK & SÉCURITÉ PHOTO)
   ========================================================================= */
async function renderControle(){
  const date = todayISO();
  
  let c = await idbGet('controles', activeControleId) || {
    id: activeControleId, zoneId: activeZoneId, date,
    passageEquipe: { agentNom:null, heure:null, reponses:{} },
    contreVisite:  { controleurNom:null, heure:null, reponses:{} }
  };

  if(navigator.onLine){
    try {
      const doc = await db.collection('controles').doc(activeControleId).get();
      if(doc.exists) {
        const cloudData = doc.data();
        c.passageEquipe = cloudData.passageEquipe || c.passageEquipe;
        c.contreVisite = cloudData.contreVisite || c.contreVisite;
        await idbPut('controles', c);
      }
    } catch(e){}
  }

  const zone = ZONES.find(z=>z.id===activeZoneId);
  const activePoints = await getPointsForToday(activeZoneId, date);
  const isContreVisite = activeMode==='contreVisite';
  
  const currentBranch = isContreVisite ? c.contreVisite : c.passageEquipe;
  const equipeReponses = (c.passageEquipe && c.passageEquipe.reponses) || {};

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(zone.nom, isContreVisite ? 'Contre-visite Contrôleur' : 'Réalisation Prestation')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div id="pointsList"></div>
        <button class="btn amber block" id="saveBtn" style="margin-top:12px;">Enregistrer la zone</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  const listEl = document.getElementById('pointsList');
  listEl.innerHTML = activePoints.map(p=>{
    const r = currentBranch.reponses[p.id] || { conforme: (isContreVisite ? true : null), photos:[], commentaire:'' };
    
    // Si contrôleur et non renseigné -> Valider OK par défaut
    if(isContreVisite && r.conforme === null) r.conforme = true;

    const myPhotos = r.photos || [];
    const eqR = equipeReponses[p.id] || {};
    const eqPhotos = isContreVisite ? (eqR.photos || []) : [];

    // Détection si l'équipe a validé en NOK (ou si elle a été bloquée NOK sans photo)
    const isEquipeNok = isContreVisite && (eqR.conforme === false || !eqR.photos || eqR.photos.length === 0);

    return `
      <div class="point-item" data-point="${p.id}" style="border:1px solid ${isEquipeNok?'#B23A34':'#E7E1D6'};padding:12px;border-radius:10px;margin-bottom:12px;background:${isEquipeNok?'#F6DEDC':'#fff'};">
        <div class="point-head">
          <div class="point-label" style="font-weight:600;">
            ${p.label} <small>(${p.freq==='J'?'Jour':(p.freq==='H'?'Hebdo':'Mensuel')})</small>
            ${isEquipeNok ? `<span style="background:#B23A34;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px;font-weight:bold;">⚠️ ÉQUIPE : NOK</span>` : ''}
          </div>
          <div class="point-toggle" style="margin-top:6px;">
            <button class="toggle-btn conforme ${r.conforme===true?'active':''}" data-val="true">✓ OK</button>
            <button class="toggle-btn non-conforme ${r.conforme===false?'active':''}" data-val="false">✕ NOK</button>
          </div>
        </div>

        ${isContreVisite && eqPhotos.length ? `
          <div style="font-size:11px;color:#2B6E68;font-weight:700;margin-top:8px;">📸 Photos transmises par l'Équipe :</div>
          <div class="point-photo-row" style="display:flex;gap:6px;overflow-x:auto;padding:6px;background:#DCEEEC;border-radius:8px;margin-top:4px;">
            ${eqPhotos.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Équipe - ${p.label}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">`).join('')}
          </div>
        ` : ''}

        <div style="font-size:11px;color:#6B655C;margin-top:8px;">
          ${isContreVisite ? 'Tes photos contrôleur (optionnel) :' : 'Photo obligatoire pour valider cet item :'}
        </div>
        <div class="point-photo-row" id="photos_${p.id}" style="display:flex;gap:6px;align-items:center;overflow-x:auto;margin-top:4px;">
          ${myPhotos.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo ${isContreVisite?'Contrôleur':'Équipe'} - ${p.label}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer;">`).join('')}
          <label class="photo-btn" style="border:1px dashed #C7791B;padding:8px 12px;border-radius:6px;font-size:12px;color:#C7791B;cursor:pointer;white-space:nowrap;">
            📷 + Photo
            <input type="file" accept="image/*" capture="environment" style="display:none;" data-photo-input>
          </label>
        </div>
        <textarea class="point-comment" placeholder="Remarques / Observations" style="width:100%;margin-top:8px;padding:6px;border-radius:6px;border:1px solid #E7E1D6;">${r.commentaire||''}</textarea>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.click-zoom').forEach(img => {
    img.onclick = () => openPhotoViewer(img.src, img.dataset.title);
  });

  listEl.querySelectorAll('.point-item').forEach(item=>{
    const pId = item.dataset.point;
    if(!currentBranch.reponses[pId]) {
      currentBranch.reponses[pId] = { conforme: (isContreVisite ? true : null), photos:[], commentaire:'' };
    }
    const r = currentBranch.reponses[pId];

    item.querySelectorAll('.toggle-btn').forEach(btn=>{
      btn.onclick = ()=>{
        r.conforme = btn.dataset.val==='true';
        item.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    const fileInput = item.querySelector('[data-photo-input]');
    fileInput.onchange = async ()=>{
      if(!fileInput.files.length) return;
      const dataUrl = await fileToResizedBase64(fileInput.files[0], 600);
      r.photos = r.photos || [];
      r.photos.push(dataUrl);
      
      const newImg = document.createElement('img');
      newImg.className = 'photo-thumb click-zoom';
      newImg.src = dataUrl;
      newImg.style.cssText = 'width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer;';
      newImg.onclick = () => openPhotoViewer(dataUrl, `Nouvelle photo - ${pId}`);
      item.querySelector(`#photos_${pId}`).insertBefore(newImg, item.querySelector('.photo-btn'));
    };

    item.querySelector('.point-comment').oninput = (e)=>{
      r.commentaire = e.target.value;
    };
  });

  document.getElementById('saveBtn').onclick = async ()=>{
    // Application des règles métiers
    if(!isContreVisite){
      for(const p of activePoints){
        const r = currentBranch.reponses[p.id];
        // Règle : Pas de photo par l'équipe -> verrouillé en NOK
        if(!r || !r.photos || r.photos.length === 0){
          r.conforme = false; 
        }
      }
    } else {
      // Pour le contrôleur : Si non retouché -> OK par défaut
      for(const p of activePoints){
        if(!currentBranch.reponses[p.id] || currentBranch.reponses[p.id].conforme === null){
          currentBranch.reponses[p.id] = currentBranch.reponses[p.id] || { photos:[], commentaire:'' };
          currentBranch.reponses[p.id].conforme = true;
        }
      }
    }

    currentBranch.heure = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    if(isContreVisite) currentBranch.controleurNom = session.nom;
    else currentBranch.agentNom = session.nom;

    const synced = await pushToCloud('controles', c.id, c);
    toast(synced ? 'Zone sauvegardée et synchronisée !' : 'Sauvegardé en local');
    goToZones();
  };
}

/* =========================================================================
   ÉCRAN HISTORIQUE
   ========================================================================= */
async function renderHistory(){
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Historique des Prestations', 'Consultation Archives')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div class="field">
          <label>Sélectionner une date d'archive :</label>
          <input type="date" id="histDateSelect" value="${todayISO()}">
        </div>
        <div id="histContent" style="margin-top:15px;">Chargement…</div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;
  const dateInput = document.getElementById('histDateSelect');
  
  const loadHistoryDate = async (selectedDate) => {
    const content = document.getElementById('histContent');
    content.innerHTML = '<div class="section-note">Chargement des données...</div>';
    
    let html = '';
    for(const z of ZONES){
      const controleId = `${selectedDate}__${z.id}`;
      let c = await idbGet('controles', controleId);
      if(navigator.onLine && !c){
        try {
          const doc = await db.collection('controles').doc(controleId).get();
          if(doc.exists) c = doc.data();
        } catch(e){}
      }

      if(c){
        const eq = c.passageEquipe || {};
        const cv = c.contreVisite || {};
        html += `
          <div style="border:1px solid #E7E1D6;padding:12px;border-radius:10px;margin-bottom:12px;background:#fff;">
            <div style="font-weight:600;color:#C7791B;font-size:15px;">ZONE : ${z.nom}</div>
            <div style="font-size:11px;color:#6B655C;margin-bottom:8px;">
              Équipe : ${eq.agentNom||'N/A'} (${eq.heure||'--:--'}) | Contrôleur : ${cv.controleurNom||'N/A'} (${cv.heure||'--:--'})
            </div>
        `;

        const activePoints = await getPointsForToday(z.id, selectedDate);
        activePoints.forEach(p => {
          const rEq = (eq.reponses && eq.reponses[p.id]) || {};
          const rCv = (cv.reponses && cv.reponses[p.id]) || {};
          const allPhotos = [...(rEq.photos||[]), ...(rCv.photos||[])];

          const eqOk = rEq.conforme === true && rEq.photos && rEq.photos.length > 0;
          const cvOk = rCv.conforme !== false;

          html += `
            <div style="padding:6px 0;border-top:1px dashed #E7E1D6;font-size:12px;">
              <div><strong>${p.label}</strong> -> Équipe: [${eqOk?'OK':'NOK'}] | Ctrl: [${cvOk?'OK':'NOK'}]</div>
              ${allPhotos.length ? `
                <div style="display:flex;gap:6px;margin-top:4px;overflow-x:auto;">
                  ${allPhotos.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="${p.label}" style="width:45px;height:45px;object-fit:cover;border-radius:4px;cursor:pointer;">`).join('')}
                </div>
              ` : ''}
            </div>
          `;
        });
        html += `</div>`;
      }
    }

    content.innerHTML = html || '<div class="section-note">Aucun rapport enregistré pour cette date.</div>';
    
    content.querySelectorAll('.click-zoom').forEach(img => {
      img.onclick = () => openPhotoViewer(img.src, img.dataset.title);
    });
  };

  dateInput.onchange = (e) => loadHistoryDate(e.target.value);
  loadHistoryDate(todayISO());
}

/* =========================================================================
   ÉCRAN STATISTIQUES
   ========================================================================= */
async function renderStats(){
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Statistiques & Conformité', 'Suivi de Prestation')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div id="statsContent">Chargement des données statistiques…</div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  let allControles = await idbGetAll('controles');
  if(navigator.onLine){
    try {
      const snap = await db.collection('controles').get();
      allControles = snap.docs.map(d=>d.data());
    } catch(e){}
  }

  let totalPointsChecked = 0;
  let totalConformes = 0;
  let totalEcarts = 0;
  let zoneStats = {};

  ZONES.forEach(z => { zoneStats[z.id] = { total:0, ok:0, nom:z.nom }; });

  allControles.forEach(c => {
    const eq = (c.passageEquipe && c.passageEquipe.reponses) || {};
    const cv = (c.contreVisite && c.contreVisite.reponses) || {};

    Object.keys(eq).forEach(pId => {
      const rEq = eq[pId];
      if(rEq){
        totalPointsChecked++;
        const eqOk = rEq.conforme === true && rEq.photos && rEq.photos.length > 0;
        if(eqOk) {
          totalConformes++;
          if(zoneStats[c.zoneId]) zoneStats[c.zoneId].ok++;
        }
        if(zoneStats[c.zoneId]) zoneStats[c.zoneId].total++;

        const rCv = cv[pId];
        const cvOk = rCv ? (rCv.conforme !== false) : true;
        if(eqOk !== cvOk) totalEcarts++;
      }
    });
  });

  const tauxGlobal = totalPointsChecked ? Math.round((totalConformes / totalPointsChecked) * 100) : 0;

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
      <div style="background:#FAF8F3;padding:12px;border-radius:10px;border:1px solid #E7E1D6;text-align:center;">
        <div style="font-size:11px;color:#6B655C;text-transform:uppercase;">Conformité Globale</div>
        <div style="font-size:24px;font-weight:700;color:#2B6E68;margin-top:4px;">${tauxGlobal}%</div>
      </div>
      <div style="background:#FAF8F3;padding:12px;border-radius:10px;border:1px solid #E7E1D6;text-align:center;">
        <div style="font-size:11px;color:#6B655C;text-transform:uppercase;">Écarts Détectés</div>
        <div style="font-size:24px;font-weight:700;color:#B23A34;margin-top:4px;">${totalEcarts}</div>
      </div>
    </div>

    <div style="font-weight:600;margin-bottom:10px;font-size:14px;">Taux de Conformité par Zone :</div>
  `;

  ZONES.forEach(z => {
    const zs = zoneStats[z.id];
    const pct = zs.total ? Math.round((zs.ok / zs.total) * 100) : 0;
    html += `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
          <span>${z.nom}</span>
          <strong>${pct}% (${zs.ok}/${zs.total})</strong>
        </div>
        <div style="background:#E7E1D6;height:8px;border-radius:4px;overflow:hidden;">
          <div style="background:#2B6E68;width:${pct}%;height:100%;"></div>
        </div>
      </div>
    `;
  });

  document.getElementById('statsContent').innerHTML = html;
}

/* =========================================================================
   GÉNÉRATION DU RAPPORT PDF GLOBAL (FONDS VERTS & BANDEAUX SÉPARÉS)
   ========================================================================= */
async function generateGlobalPDF(){
  if(typeof window.jspdf === 'undefined'){ toast('Bibliothèque PDF indisponible'); return; }
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const date = todayISO();
  
  const C_INK = [33, 30, 26];
  const C_AMBER = [199, 121, 27];
  const C_TEAL = [43, 110, 104];
  const C_TEAL_BG = [220, 238, 236]; // Fond vert pastel
  const C_RED = [178, 58, 52];
  const C_RED_BG = [254, 242, 242]; // Fond rouge pastel
  const C_BG = [250, 248, 243];
  const C_LINE = [231, 225, 214];

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

  // --- GENERATION DES PAGES DE ZONES ---
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
    docPdf.text(`Passage Équipe : ${eq.agentNom || 'Non renseigné'} (${eq.heure||'--:--'})   |   Contrôleur : ${cv.controleurNom || 'Non effectué'} (${cv.heure||'--:--'})`, 14, y);
    y += 8;

    for(const p of activePoints){
      const rEq = (eq.reponses && eq.reponses[p.id]) || { conforme: null, photos:[], commentaire:'' };
      const rCv = (cv.reponses && cv.reponses[p.id]) || { conforme: null, photos:[], commentaire:'' };

      // Règle 1 : Pas de photo équipe -> NOK
      let eqConformeCalculated = (rEq.photos && rEq.photos.length > 0) ? (rEq.conforme !== false) : false;

      // Règle 2 : Pas de mise en NOK contrôleur -> OK par défaut
      let cvConformeCalculated = (rCv.conforme === false) ? false : true;

      const isBothOk = (eqConformeCalculated === true && cvConformeCalculated === true);
      const isEcart = (eqConformeCalculated !== cvConformeCalculated);

      if(isEcart) totalEcarts++;

      if(y > 250){ docPdf.addPage(); y = 20; }

      // Couleur de fond de l'encadré
      if(isBothOk){
        docPdf.setFillColor(...C_TEAL_BG);
        docPdf.setDrawColor(...C_TEAL);
      } else if(isEcart){
        docPdf.setFillColor(...C_RED_BG);
        docPdf.setDrawColor(...C_RED);
      } else {
        docPdf.setFillColor(255, 255, 255);
        docPdf.setDrawColor(...C_LINE);
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

      if(isEcart){
        docPdf.setFillColor(...C_RED);
        docPdf.rect(175, y + 2, 16, 10, 'F');
        docPdf.setTextColor(255, 255, 255);
        docPdf.setFont('helvetica', 'bold');
        docPdf.setFontSize(7);
        docPdf.text('ÉCART', 177, y + 8);
      }

      y += 18;

      if(rEq.commentaire || rCv.commentaire){
        docPdf.setFontSize(8);
        docPdf.setTextColor(100, 100, 100);
        if(rEq.commentaire){ docPdf.text(`• Obs. Équipe : ${rEq.commentaire}`, 18, y); y += 5; }
        if(rCv.commentaire){ docPdf.text(`• Obs. Contrôleur : ${rCv.commentaire}`, 18, y); y += 5; }
      }

      const allEqPhotos = rEq.photos || [];
      const allCvPhotos = rCv.photos || [];

      if(allEqPhotos.length > 0 || allCvPhotos.length > 0){
        if(y > 210){ docPdf.addPage(); y = 20; }

        let xPos = 18;
        
        // Affichage des photos Équipe
        for(const imgBase64 of allEqPhotos){
          try {
            docPdf.addImage(imgBase64, 'JPEG', xPos, y, 55, 38);
            // Bandeau de légende distinct sous la photo
            docPdf.setFillColor(...C_TEAL);
            docPdf.rect(xPos, y + 38, 55, 6, 'F');
            docPdf.setFontSize(7); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
            docPdf.text('PHOTO ÉQUIPE', xPos + 15, y + 42.5);

            xPos += 58;
            if(xPos > 140){ xPos = 18; y += 48; }
          } catch(e){}
        }

        // Affichage des photos Contrôleur
        for(const imgBase64 of allCvPhotos){
          try {
            docPdf.addImage(imgBase64, 'JPEG', xPos, y, 55, 38);
            // Bandeau de légende distinct sous la photo
            docPdf.setFillColor(...C_AMBER);
            docPdf.rect(xPos, y + 38, 55, 6, 'F');
            docPdf.setFontSize(7); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
            docPdf.text('PHOTO CONTRÔLEUR', xPos + 12, y + 42.5);

            xPos += 58;
            if(xPos > 140){ xPos = 18; y += 48; }
          } catch(e){}
        }

        y += 50;
      }
    }
  }

  // --- RETOUR PAGE 1 : LIENS CLIQUABLES ---
  docPdf.setPage(1);
  for(const z of ZONES){
    const info = zonePageMap[z.id];
    if(info && info.pageTarget > 0){
      docPdf.link(14, info.ySommaire, 182, 12, { pageNumber: info.pageTarget });
    }
  }

  docPdf.setFillColor(...(totalEcarts === 0 ? C_TEAL : C_RED));
  docPdf.roundedRect(14, 140, 182, 14, 3, 3, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(10);
  docPdf.text(`BILAN CONTRÔLE : ${totalEcarts === 0 ? 'PRESTATION CONFORME — AUCUN ÉCART' : totalEcarts + ' ÉCART(S) CONSTATÉ(S)'}`, 18, 149);

  docPdf.save(`Rapport_SOAN_Global_${date}.pdf`);
}

/* =========================================================================
   ADMINISTRATION DU PLANNING
   ========================================================================= */
async function renderTaskAdmin(){
  let schedMap = {};
  const localSched = await idbGetAll('task_schedule');
  localSched.forEach(s => { schedMap[s.taskId] = s; });

  let tasksHtml = '';
  ZONES.forEach(z => {
    const periodicPoints = (POINTS[z.id] || []).filter(p => p.freq === 'H' || p.freq === 'M');
    if(periodicPoints.length){
      tasksHtml += `<div class="section-title" style="margin-top:15px;font-size:16px;color:#C7791B;">${z.nom}</div>`;
      periodicPoints.forEach(p => {
        const custom = schedMap[p.id];
        const currentVal = custom ? custom.targetValue : 1;
        tasksHtml += `
          <div class="agent-row" style="flex-direction:column;align-items:flex-start;gap:6px;padding:10px 0;border-bottom:1px solid #E7E1D6;">
            <div style="font-weight:600;">${p.label} <span class="badge-role">${p.freq==='H'?'Hebdo':'Mensuel'}</span></div>
            <div style="display:flex;align-items:center;gap:10px;width:100%;">
              <label style="font-size:12px;color:#6B655C;">Jour d'exécution :</label>
              ${p.freq==='H' ? `
                <select class="task-sched-select" data-task="${p.id}" data-freq="H" style="flex:1;padding:6px;border-radius:6px;border:1px solid #E7E1D6;">
                  <option value="1" ${currentVal==1?'selected':''}>Lundi</option>
                  <option value="2" ${currentVal==2?'selected':''}>Mardi</option>
                  <option value="3" ${currentVal==3?'selected':''}>Mercredi</option>
                  <option value="4" ${currentVal==4?'selected':''}>Jeudi</option>
                  <option value="5" ${currentVal==5?'selected':''}>Vendredi</option>
                  <option value="6" ${currentVal==6?'selected':''}>Samedi</option>
                  <option value="0" ${currentVal==0?'selected':''}>Dimanche</option>
                </select>
              ` : `
                <input type="number" class="task-sched-input" data-task="${p.id}" data-freq="M" min="1" max="28" value="${currentVal}" style="width:80px;padding:6px;border-radius:6px;border:1px solid #E7E1D6;">
                <span style="font-size:12px;color:#6B655C;">du mois</span>
              `}
            </div>
          </div>
        `;
      });
    }
  });

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Planning des Tâches', 'Administration Hybrid')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div class="section-note">Définissez précisément le jour de réalisation de chaque tâche.</div>
        ${tasksHtml}
        <button class="btn amber block" id="saveTasksBtn" style="margin-top:20px;">Enregistrer le planning</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;
  document.getElementById('saveTasksBtn').onclick = async ()=>{
    const selects = document.querySelectorAll('.task-sched-select');
    for(const sel of selects){
      const data = { taskId: sel.dataset.task, freq: sel.dataset.freq, targetValue: parseInt(sel.value) };
      await pushToCloud('task_schedule', sel.dataset.task, data);
    }
    const inputs = document.querySelectorAll('.task-sched-input');
    for(const inp of inputs){
      const data = { taskId: inp.dataset.task, freq: inp.dataset.freq, targetValue: parseInt(inp.value)||1 };
      await pushToCloud('task_schedule', inp.dataset.task, data);
    }
    toast('Planning sauvegardé !');
    goToZones();
  };
}

/* =========================================================================
   ADMINISTRATION UTILISATEURS
   ========================================================================= */
async function renderAgentsAdmin(){
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

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

(function init(){
  renderLogin();
})();

})();
