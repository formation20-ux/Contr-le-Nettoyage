(function(){
'use strict';

/* =========================================================================
   FIREBASE — projet "Controle Nettoyage"
   L'apiKey n'est pas un secret : la sécurité vient des règles Firestore,
   pas de cacher cette config (elle est de toute façon visible dans le
   navigateur de n'importe quel visiteur).
   ========================================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyA4pQGdFIgDtt1GxfohxexgHauc4wXM4sk",
  authDomain: "controle-nettoyage.firebaseapp.com",
  projectId: "controle-nettoyage",
  storageBucket: "controle-nettoyage.firebasestorage.app",
  messagingSenderId: "1032576632030",
  appId: "1:1032576632030:web:4650e2bce60a2c7b67ae4f"
};

/* =========================================================================
   EMAILJS — à configurer (voir instructions fournies)
   ========================================================================= */
const EMAILJS_PUBLIC_KEY  = 'À_REMPLACER';
const EMAILJS_SERVICE_ID  = 'À_REMPLACER';
const EMAILJS_TEMPLATE_ID = 'À_REMPLACER';
const RAPPORT_DESTINATAIRE = 'toi@mcdcaen.com'; // adresse qui reçoit les rapports

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
if(typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY!=='À_REMPLACER'){
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

/* =========================================================================
   RÉFÉRENTIEL — à terme chargé depuis Firestore, en dur pour le MVP
   ========================================================================= */
const ZONES = [
  { id:'cuisine',    nom:'Cuisine' },
  { id:'salle',      nom:'Salle' },
  { id:'sanitaires', nom:'Sanitaires' },
  { id:'reserve',    nom:'Réserve' },
  { id:'exterieur',  nom:'Extérieur / parking' },
];

const POINTS = {
  cuisine: [
    { id:'cui_sol',    label:'Sol dégraissé et sec' },
    { id:'cui_plans',  label:'Plans de travail désinfectés' },
    { id:'cui_hottes', label:'Hottes et filtres propres' },
    { id:'cui_poub',   label:'Poubelles vidées et lavées' },
  ],
  salle: [
    { id:'sal_tables', label:'Tables et assises propres' },
    { id:'sal_sol',    label:'Sol lavé, sans traces' },
    { id:'sal_vitres', label:'Vitres et portes sans traces' },
  ],
  sanitaires: [
    { id:'san_wc',     label:'WC et lavabos désinfectés' },
    { id:'san_sol',    label:'Sol désinfecté' },
    { id:'san_stock',  label:'Papier / savon réapprovisionnés' },
  ],
  reserve: [
    { id:'res_sol',    label:'Sol propre et dégagé' },
    { id:'res_range',  label:'Rangement conforme' },
  ],
  exterieur: [
    { id:'ext_abords', label:'Abords et parking sans déchets' },
    { id:'ext_poub',   label:'Poubelles extérieures vidées' },
  ],
};

/* TODO sécurité : ce PIN client-side n'est pas une vraie authentification —
   n'importe qui inspectant le réseau/la base voit les PIN. Suffisant pour un
   usage interne à faible enjeu, mais à remplacer par une Cloud Function
   (loginWithPin + Custom Token) si le besoin de sécurité augmente. */

/* =========================================================================
   STOCKAGE HORS-LIGNE (IndexedDB)
   ========================================================================= */
const DB_NAME = 'controle-nettoyage';
const DB_VERSION = 2;
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('controles')){
        db.createObjectStore('controles', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('outbox')){
        db.createObjectStore('outbox', { keyPath:'id' });
      }
      if(!db.objectStoreNames.contains('agents')){
        db.createObjectStore('agents', { keyPath:'id' });
      }
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
async function idbGetAll(store){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = ()=>resolve(req.result || []);
    req.onerror = ()=>reject(req.error);
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
async function idbDelete(store, id){
  const db = await openDB();
  return new Promise((resolve, reject)=>{
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = ()=>resolve();
    tx.onerror = ()=>reject(tx.error);
  });
}

/* =========================================================================
   ÉTAT
   ========================================================================= */
let session = null;          // { role:'agent'|'controleur', agentId, nom }
let currentPin = '';
let pendingRole = 'agent';
let activeZoneId = null;
let activeControleId = null;
let activeMode = 'equipe';   // 'equipe' | 'contreVisite'

const root = document.getElementById('app-root');

/* =========================================================================
   UTILITAIRES
   ========================================================================= */
function todayISO(){ return new Date().toISOString().slice(0,10); }
function uid(prefix){ return (prefix||'id')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8); }
function fmtDate(iso){ return iso.split('-').reverse().join('/'); }

function toast(msg){
  let t = document.getElementById('toastEl');
  if(!t){ t=document.createElement('div'); t.id='toastEl'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}

function openPhotoViewer(src, label){
  const backdrop = document.createElement('div');
  backdrop.className = 'pv-backdrop';
  backdrop.innerHTML = `
    ${label?`<div class="pv-label">${label}</div>`:''}
    <button class="pv-close" aria-label="Fermer">✕</button>
    <img class="pv-img" src="${src}">
  `;
  document.body.appendChild(backdrop);
  const close = ()=>backdrop.remove();
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) close(); });
  backdrop.querySelector('.pv-close').addEventListener('click', close);
}

function controleId(zoneId, date){ return `${date}__${zoneId}`; }

async function getOrCreateControle(zoneId, date){
  const id = controleId(zoneId, date);
  let c = await idbGet('controles', id);
  if(!c){
    c = {
      id, zoneId, date,
      passageEquipe: { agentNom:null, heure:null, reponses:{}, statut:'a_faire' },
      contreVisite:  { controleurNom:null, heure:null, reponses:{}, statut:'non_demarree' },
    };
    await idbPut('controles', c);
  }
  return c;
}

/* Compresse une photo prise/choisie en JPEG base64 (même logique que le
   Suivi de stock : redimensionnement via canvas avant stockage/upload) */
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
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* =========================================================================
   SYNCHRO — file d'attente hors-ligne
   TODO backend : brancher pushToServer() sur Firestore (via Cloud Function
   ou SDK Firestore avec persistance offline). Tant que ce n'est pas fait,
   les éléments restent visibles dans la file "en attente".
   ========================================================================= */
async function queueForSync(controle){
  await idbPut('outbox', { id: controle.id, controle, queuedAt: Date.now() });
  updateSyncBadge();
  trySync();
}

async function pushToServer(item){
  // Écrit le contrôle dans Firestore. NOTE : les photos sont encore
  // stockées en base64 dans le document (limite Firestore : 1 Mo/document).
  // Ça passe pour tester, mais à migrer vers Drive avant un usage réel
  // avec plusieurs photos par contrôle (équipe + contre-visite cumulées).
  await db.collection('controles').doc(item.controle.id).set(item.controle, { merge:true });
}

async function trySync(){
  if(!navigator.onLine) return;
  const items = await idbGetAll('outbox');
  for(const item of items){
    try{
      await pushToServer(item);
      await idbDelete('outbox', item.id);
    }catch(err){
      // reste en file, on retentera plus tard
      break;
    }
  }
  updateSyncBadge();
}

async function updateSyncBadge(){
  const items = await idbGetAll('outbox');
  const el = document.getElementById('syncBadge');
  if(!el) return;
  if(items.length){
    el.textContent = `${items.length} en attente de synchro`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

window.addEventListener('online', trySync);

/* =========================================================================
   RENDU — TOPBAR COMMUNE
   ========================================================================= */
function topbarHtml(title, sub){
  const online = navigator.onLine;
  return `
    <div class="topbar">
      <div>
        <div class="brand-eyebrow">${sub||'Contrôle Nettoyage'}</div>
        <div class="brand-title">${title}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="net-status ${online?'online':'offline'}"><span class="net-dot"></span>${online?'En ligne':'Hors-ligne'}</div>
        <div class="sync-pill hidden" id="syncBadge"></div>
      </div>
    </div>
  `;
}

/* =========================================================================
   ÉCRAN LOGIN
   ========================================================================= */
function renderLogin(){
  syncAgentsFromFirestore();
  root.innerHTML = `
    <div id="screen-login">
      <div class="login-card">
        <div class="brand-eyebrow">McDo Caen Centre Ville</div>
        <div class="brand-title">Contrôle Nettoyage</div>
        <div class="role-switch">
          <button class="role-btn ${pendingRole==='agent'?'active':''}" data-role="agent">Équipe nettoyage</button>
          <button class="role-btn ${pendingRole==='controleur'?'active':''}" data-role="controleur">Contrôleur</button>
        </div>
        <div class="section-note">Entre ton code à 4 chiffres</div>
        <div class="pin-dots" id="pinDots"></div>
        <div class="pin-pad" id="pinPad"></div>
        <div class="pin-error" id="pinError"></div>
      </div>
    </div>
  `;
  root.querySelectorAll('.role-btn').forEach(b=>{
    b.addEventListener('click', ()=>{ pendingRole=b.dataset.role; currentPin=''; renderLogin(); });
  });
  renderPinDots();
  renderPinPad();
}

function renderPinDots(){
  const el = document.getElementById('pinDots');
  el.innerHTML = [0,1,2,3].map(i=>`<div class="pin-dot ${i<currentPin.length?'filled':''}"></div>`).join('');
}

function renderPinPad(){
  const el = document.getElementById('pinPad');
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  el.innerHTML = keys.map(k=>{
    if(k==='') return `<div></div>`;
    return `<button class="pin-key ${k==='⌫'?'wide':''}" data-key="${k}">${k}</button>`;
  }).join('');
  el.querySelectorAll('[data-key]').forEach(btn=>{
    btn.addEventListener('click', ()=>onPinKey(btn.dataset.key));
  });
}

function onPinKey(k){
  const errEl = document.getElementById('pinError');
  if(k==='⌫'){ currentPin = currentPin.slice(0,-1); errEl.textContent=''; renderPinDots(); return; }
  if(currentPin.length>=4) return;
  currentPin += k;
  renderPinDots();
  if(currentPin.length===4) checkPin();
}

async function syncAgentsFromFirestore(){
  if(!navigator.onLine) return;
  try{
    const snap = await db.collection('agents').get();
    const dbi = await openDB();
    await new Promise((resolve, reject)=>{
      const tx = dbi.transaction('agents', 'readwrite');
      const store = tx.objectStore('agents');
      snap.docs.forEach(d=>store.put(Object.assign({ id:d.id }, d.data())));
      tx.oncomplete = resolve;
      tx.onerror = ()=>reject(tx.error);
    });
  }catch(err){ /* on retentera plus tard, le cache local reste valable */ }
}

async function checkPin(){
  const errEl = document.getElementById('pinError');
  const agents = await idbGetAll('agents');
  const match = agents.find(a=>a.pin===currentPin && a.role===pendingRole && a.actif!==false);
  if(match){
    session = { role:pendingRole, agentId:match.id, nom:match.nom };
    currentPin=''; goToZones();
  } else {
    errEl.textContent = 'Code incorrect'; currentPin=''; setTimeout(renderPinDots,150);
  }
}

/* =========================================================================
   ÉCRAN LISTE DES ZONES
   ========================================================================= */
async function goToZones(){ activeZoneId=null; trySync(); await renderZones(); }

async function renderZones(){
  const date = todayISO();
  const controles = await Promise.all(ZONES.map(z=>getOrCreateControle(z.id, date)));
  const roleLabel = session.role==='agent' ? `Équipe · ${session.nom}` : 'Contre-visite';

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(roleLabel, fmtDate(date))}
      <div class="section">
        <div class="section-title">Zones à contrôler</div>
        <div class="section-note" style="margin-bottom:12px;">${session.role==='agent' ? 'Choisis une zone pour saisir ton passage.' : 'Choisis une zone pour faire ta contre-visite.'}</div>
        <div class="zone-grid" id="zoneGrid"></div>
      </div>
      <button class="btn ghost block" id="dashBtn" style="margin-bottom:10px;">📊 Tableau de bord</button>
      ${session.role==='controleur' ? '<button class="btn ghost block" id="agentsBtn" style="margin-bottom:10px;">👤 Gestion des utilisateurs</button>' : ''}
      <button class="btn ghost block" id="logoutBtn">Changer d'utilisateur</button>
    </div>
  `;
  const grid = document.getElementById('zoneGrid');
  grid.innerHTML = ZONES.map((z,i)=>{
    const c = controles[i];
    const statut = session.role==='agent' ? c.passageEquipe.statut : c.contreVisite.statut;
    const badge = statutBadge(statut, session.role);
    const nbPoints = POINTS[z.id].length;
    return `
      <div class="zone-card" data-zone="${z.id}">
        <div>
          <div class="zone-name">${z.nom}</div>
          <div class="zone-meta">${nbPoints} point${nbPoints>1?'s':''} de contrôle</div>
        </div>
        ${badge}
      </div>
    `;
  }).join('');
  grid.querySelectorAll('.zone-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      activeZoneId = card.dataset.zone;
      activeControleId = controleId(activeZoneId, date);
      activeMode = session.role==='agent' ? 'equipe' : 'contreVisite';
      renderControle();
    });
  });
  document.getElementById('logoutBtn').addEventListener('click', ()=>{ session=null; currentPin=''; renderLogin(); });
  document.getElementById('dashBtn').addEventListener('click', renderDashboard);
  const agentsBtn = document.getElementById('agentsBtn');
  if(agentsBtn) agentsBtn.addEventListener('click', renderAgentsAdmin);
  updateSyncBadge();
}

function statutBadge(statut, role){
  const map = {
    a_faire:      { cls:'a-faire', label:'À faire' },
    rempli:       { cls:'fait',    label:'Rempli' },
    'synchronisé':{ cls:'fait',    label:'Rempli' },
    non_demarree: { cls:'a-faire', label:'À faire' },
    en_cours:     { cls:'en-cours',label:'En cours' },
    faite:        { cls:'fait',    label:'Faite' },
  };
  const m = map[statut] || map.a_faire;
  return `<span class="zone-badge ${m.cls}">${m.label}</span>`;
}

/* =========================================================================
   ÉCRAN POINTS DE CONTRÔLE (passage équipe OU contre-visite)
   ========================================================================= */
async function renderControle(){
  const c = await idbGet('controles', activeControleId);
  const zone = ZONES.find(z=>z.id===activeZoneId);
  const points = POINTS[activeZoneId];
  const isContreVisite = activeMode==='contreVisite';
  const branch = isContreVisite ? c.contreVisite : c.passageEquipe;
  const equipeReponses = c.passageEquipe.reponses || {};

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(zone.nom, isContreVisite ? 'Contre-visite' : 'Passage équipe')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section" style="padding-bottom:6px;">
        <div id="pointsList"></div>
        <button class="btn amber block" id="saveBtn" style="margin-top:6px;">
          ${isContreVisite ? 'Enregistrer la contre-visite' : 'Enregistrer le passage'}
        </button>
        ${branch.statut==='rempli' || branch.statut==='faite' ? `
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn ghost small" id="pdfBtn" style="flex:1;">📄 PDF</button>
          ${session.role==='controleur' ? '<button class="btn ghost small" id="mailBtn" style="flex:1;">✉️ Envoyer par mail</button>' : ''}
        </div>` : ''}
      </div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', goToZones);
  const pdfBtn = document.getElementById('pdfBtn');
  if(pdfBtn) pdfBtn.addEventListener('click', ()=>generateControlePDF(c));
  const mailBtn = document.getElementById('mailBtn');
  if(mailBtn) mailBtn.addEventListener('click', ()=>sendReportEmail(c));

  const listEl = document.getElementById('pointsList');
  listEl.innerHTML = points.map(p=>{
    const r = branch.reponses[p.id] || { conforme:null, photo:null, commentaire:'' };
    const ecart = isContreVisite && equipeReponses[p.id] && r.conforme!==null && r.conforme!==equipeReponses[p.id].conforme;
    return `
      <div class="point-item" data-point="${p.id}">
        <div class="point-head">
          <div class="point-label">${p.label}${ecart?'<span class="ecart-flag">écart</span>':''}</div>
          <div class="point-toggle">
            <button class="toggle-btn conforme ${r.conforme===true?'active':''}" data-val="true">✓ Conforme</button>
            <button class="toggle-btn non-conforme ${r.conforme===false?'active':''}" data-val="false">✕ Non conforme</button>
          </div>
        </div>
        <div class="point-photo-row">
          ${r.photo ? `<img class="photo-thumb" src="${r.photo}" data-full="${r.photo}" data-label="${isContreVisite?'Contre-visite':'Équipe'}">` : ''}
          <label class="photo-btn">
            📷 ${r.photo?'Reprendre la photo':'Prendre une photo'}
            <input type="file" accept="image/*" capture="environment" style="display:none;" data-photo-input>
          </label>
          ${isContreVisite && equipeReponses[p.id] && equipeReponses[p.id].photo ? `<img class="photo-thumb" src="${equipeReponses[p.id].photo}" data-full="${equipeReponses[p.id].photo}" data-label="Photo équipe" title="Photo de l'équipe">` : ''}
        </div>
        <textarea class="point-comment" placeholder="Commentaire (optionnel)">${r.commentaire||''}</textarea>
      </div>
    `;
  }).join('');

  listEl.addEventListener('click', (e)=>{
    const img = e.target.closest('.photo-thumb[data-full]');
    if(img) openPhotoViewer(img.dataset.full, img.dataset.label||'');
  });

  listEl.querySelectorAll('.point-item').forEach(item=>{
    const pointId = item.dataset.point;
    if(!branch.reponses[pointId]) branch.reponses[pointId] = { conforme:null, photo:null, commentaire:'' };
    const r = branch.reponses[pointId];

    item.querySelectorAll('.toggle-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        r.conforme = btn.dataset.val==='true';
        item.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        refreshEcartFlag(item, pointId, equipeReponses, isContreVisite);
      });
    });

    const fileInput = item.querySelector('[data-photo-input]');
    fileInput.addEventListener('change', async ()=>{
      if(!fileInput.files.length) return;
      const dataUrl = await fileToResizedBase64(fileInput.files[0], 1200);
      r.photo = dataUrl;
      let thumb = item.querySelector('.photo-thumb[data-label="'+(isContreVisite?'Contre-visite':'Équipe')+'"]') || item.querySelector('.point-photo-row .photo-thumb:not([title])');
      if(!thumb){
        thumb = document.createElement('img');
        thumb.className = 'photo-thumb';
        item.querySelector('.point-photo-row').prepend(thumb);
      }
      thumb.src = dataUrl;
      thumb.dataset.full = dataUrl;
      thumb.dataset.label = isContreVisite ? 'Contre-visite' : 'Équipe';
    });

    item.querySelector('.point-comment').addEventListener('input', (e)=>{
      r.commentaire = e.target.value;
    });
  });

  document.getElementById('saveBtn').addEventListener('click', async ()=>{
    const allAnswered = points.every(p=>branch.reponses[p.id] && branch.reponses[p.id].conforme!==null);
    if(!allAnswered){ toast('Renseigne conforme / non conforme sur chaque point'); return; }
    branch.heure = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    if(isContreVisite){ branch.controleurNom = session.nom; branch.statut = 'faite'; }
    else { branch.agentNom = session.nom; branch.statut = 'rempli'; }
    await idbPut('controles', c);
    await queueForSync(c);
    toast('Enregistré' + (navigator.onLine ? '' : ' — en attente de réseau'));
    goToZones();
  });
}

function refreshEcartFlag(item, pointId, equipeReponses, isContreVisite){
  if(!isContreVisite) return;
  const labelEl = item.querySelector('.point-label');
  const existingFlag = labelEl.querySelector('.ecart-flag');
  const currentBtn = item.querySelector('.toggle-btn.active');
  const currentVal = currentBtn ? currentBtn.dataset.val==='true' : null;
  const hasEcart = equipeReponses[pointId] && currentVal!==null && currentVal!==equipeReponses[pointId].conforme;
  if(hasEcart && !existingFlag){
    labelEl.insertAdjacentHTML('beforeend', '<span class="ecart-flag">écart</span>');
  } else if(!hasEcart && existingFlag){
    existingFlag.remove();
  }
}

/* =========================================================================
   ÉCRAN DASHBOARD
   ========================================================================= */
let dashChart = null;

async function fetchAllControles(){
  const snap = await db.collection('controles').get();
  return snap.docs.map(d=>d.data());
}

function computeStats(docs){
  // Conformité par zone (basée sur le passage équipe)
  const zoneStats = {}; // zoneId -> {conforme, total}
  const byDate = {};    // date -> {conforme, total}
  const pointFail = {}; // "zone · label" -> count non conforme
  const ecarts = [];    // liste des écarts équipe vs contre-visite

  docs.forEach(doc=>{
    const zone = ZONES.find(z=>z.id===doc.zoneId);
    const zoneNom = zone ? zone.nom : doc.zoneId;
    const points = POINTS[doc.zoneId] || [];
    const eqReponses = (doc.passageEquipe && doc.passageEquipe.reponses) || {};
    const cvReponses = (doc.contreVisite && doc.contreVisite.reponses) || {};

    zoneStats[doc.zoneId] = zoneStats[doc.zoneId] || { nom:zoneNom, conforme:0, total:0 };
    byDate[doc.date] = byDate[doc.date] || { conforme:0, total:0 };

    points.forEach(p=>{
      const r = eqReponses[p.id];
      if(r && r.conforme!==null && r.conforme!==undefined){
        zoneStats[doc.zoneId].total++;
        byDate[doc.date].total++;
        if(r.conforme){ zoneStats[doc.zoneId].conforme++; byDate[doc.date].conforme++; }
        else{
          const key = `${zoneNom} · ${p.label}`;
          pointFail[key] = (pointFail[key]||0)+1;
        }
      }
      const rc = cvReponses[p.id];
      if(r && rc && r.conforme!==null && rc.conforme!==null && r.conforme!==rc.conforme){
        ecarts.push({ date:doc.date, zone:zoneNom, point:p.label, equipe:r.conforme, controleur:rc.conforme });
      }
    });
  });

  return { zoneStats, byDate, pointFail, ecarts };
}

async function renderDashboard(){
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Tableau de bord', session.role==='agent' ? session.nom : 'Contrôleur')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div id="dashContent" class="section"><div class="section-note">Chargement…</div></div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', goToZones);

  let docs = [];
  try{ docs = await fetchAllControles(); }
  catch(err){ document.getElementById('dashContent').innerHTML = '<div class="section-note">Impossible de charger les statistiques (hors-ligne ?). Réessaie une fois connecté.</div>'; return; }

  if(session.role==='agent'){ renderDashboardAgent(docs); }
  else{ renderDashboardControleur(docs); }
}

function renderDashboardAgent(docs){
  const mine = docs.filter(d=>d.passageEquipe && d.passageEquipe.agentNom===session.nom)
    .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
  const el = document.getElementById('dashContent');
  if(!mine.length){ el.innerHTML = '<div class="section-note">Aucun passage enregistré pour l\'instant.</div>'; return; }
  el.innerHTML = `
    <div class="section-title" style="margin-bottom:10px;">Tes derniers passages</div>
    ${mine.map(d=>{
      const zone = ZONES.find(z=>z.id===d.zoneId);
      const points = POINTS[d.zoneId]||[];
      const reponses = d.passageEquipe.reponses||{};
      const nbConforme = points.filter(p=>reponses[p.id] && reponses[p.id].conforme).length;
      return `<div class="hist-row"><div><div class="hist-main">${zone?zone.nom:d.zoneId}</div><div class="hist-sub">${fmtDate(d.date)} · ${d.passageEquipe.heure||''}</div></div><span class="pill ${nbConforme===points.length?'pos':'neg'}">${nbConforme}/${points.length} conforme</span></div>`;
    }).join('')}
  `;
}

function renderDashboardControleur(docs){
  const { zoneStats, byDate, pointFail, ecarts } = computeStats(docs);
  const zoneKeys = Object.keys(zoneStats);
  const totalConforme = zoneKeys.reduce((s,k)=>s+zoneStats[k].conforme,0);
  const totalPoints = zoneKeys.reduce((s,k)=>s+zoneStats[k].total,0);
  const tauxGlobal = totalPoints ? Math.round(totalConforme/totalPoints*100) : null;

  const topFails = Object.entries(pointFail).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const recentEcarts = ecarts.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);

  const el = document.getElementById('dashContent');
  el.innerHTML = `
    <div class="kpis">
      <div class="kpi ${tauxGlobal!==null && tauxGlobal>=90?'pos':(tauxGlobal!==null && tauxGlobal<70?'neg':'')}">
        <div class="label">Conformité globale</div>
        <div class="value">${tauxGlobal===null?'—':tauxGlobal+'%'}</div>
      </div>
      <div class="kpi ${ecarts.length?'neg':'pos'}">
        <div class="label">Écarts équipe / contre-visite</div>
        <div class="value">${ecarts.length}</div>
      </div>
    </div>

    <div class="section-title" style="font-size:16px;margin-bottom:8px;">Conformité par zone</div>
    ${zoneKeys.map(k=>{
      const z = zoneStats[k];
      const pct = z.total ? Math.round(z.conforme/z.total*100) : null;
      return `<div class="rank-row"><span>${z.nom}</span><span class="pill ${pct===null?'zero':(pct>=90?'pos':(pct<70?'neg':'zero'))}">${pct===null?'—':pct+'%'}</span></div>`;
    }).join('') || '<div class="section-note">Pas encore de données.</div>'}

    <div class="section-title" style="font-size:16px;margin:18px 0 8px;">Points les plus souvent non conformes</div>
    ${topFails.length ? topFails.map(([label,count])=>`<div class="rank-row"><span>${label}</span><span class="rank-count">${count}×</span></div>`).join('') : '<div class="section-note">Aucun point en défaut pour l\'instant.</div>'}

    <div class="section-title" style="font-size:16px;margin:18px 0 8px;">Évolution de la conformité</div>
    <canvas id="dashChartCanvas" height="140"></canvas>

    <div class="section-title" style="font-size:16px;margin:18px 0 8px;">Derniers écarts équipe / contre-visite</div>
    ${recentEcarts.length ? recentEcarts.map(e=>`
      <div class="hist-row">
        <div><div class="hist-main">${e.zone} · ${e.point}</div><div class="hist-sub">${fmtDate(e.date)}</div></div>
        <span class="ecart-flag">équipe : ${e.equipe?'conforme':'non conforme'} → toi : ${e.controleur?'conforme':'non conforme'}</span>
      </div>`).join('') : '<div class="section-note">Aucun écart détecté.</div>'}
  `;

  const dateKeys = Object.keys(byDate).sort();
  const canvas = document.getElementById('dashChartCanvas');
  if(canvas && dateKeys.length && typeof Chart !== 'undefined'){
    if(dashChart) dashChart.destroy();
    dashChart = new Chart(canvas, {
      type:'line',
      data:{
        labels: dateKeys.map(fmtDate),
        datasets:[{
          label:'Conformité (%)',
          data: dateKeys.map(k=>byDate[k].total ? Math.round(byDate[k].conforme/byDate[k].total*100) : null),
          borderColor:'#2B6E68', backgroundColor:'#2B6E68', tension:.3, pointRadius:3
        }]
      },
      options:{ responsive:true, scales:{ y:{ min:0, max:100 } }, plugins:{ legend:{ display:false } } }
    });
  } else if(canvas){
    canvas.replaceWith(Object.assign(document.createElement('div'),{className:'section-note',textContent:'Pas encore assez de données pour la courbe.'}));
  }
}

/* =========================================================================
   ÉCRAN GESTION DES UTILISATEURS (contrôleur uniquement)
   ========================================================================= */
async function renderAgentsAdmin(){
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Utilisateurs', 'Gestion des accès')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div id="agentsList"><div class="section-note">Chargement…</div></div>
        <button class="btn amber block" id="addAgentBtn" style="margin-top:12px;">+ Ajouter un utilisateur</button>
      </div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', goToZones);
  document.getElementById('addAgentBtn').addEventListener('click', ()=>openAgentModal());
  await refreshAgentsList();
}

async function refreshAgentsList(){
  const el = document.getElementById('agentsList');
  if(!navigator.onLine){
    el.innerHTML = '<div class="section-note">Connexion requise pour gérer les utilisateurs.</div>';
    return;
  }
  let snap;
  try{ snap = await db.collection('agents').get(); }
  catch(err){ el.innerHTML = '<div class="section-note">Erreur de chargement.</div>'; return; }
  const agents = snap.docs.map(d=>Object.assign({ id:d.id }, d.data()));
  if(!agents.length){ el.innerHTML = '<div class="section-note">Aucun utilisateur. Ajoute le premier contrôleur (toi) pour commencer.</div>'; return; }
  el.innerHTML = agents.map(a=>`
    <div class="agent-row" data-id="${a.id}">
      <div>
        <div class="agent-name">${a.nom}${a.role==='controleur'?'<span class="badge-role">Contrôleur</span>':''}${a.actif===false?'<span class="badge-inactif">Inactif</span>':''}</div>
        <div class="agent-meta">PIN : ${a.pin}</div>
      </div>
      <div class="agent-actions">
        <button class="btn ghost small" data-edit="${a.id}">Modifier</button>
        <button class="btn danger small" data-del="${a.id}">Suppr.</button>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const a = agents.find(x=>x.id===btn.dataset.edit);
      openAgentModal(a);
    });
  });
  el.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Supprimer cet utilisateur ?')) return;
      await db.collection('agents').doc(btn.dataset.del).delete();
      await syncAgentsFromFirestore();
      refreshAgentsList();
      toast('Utilisateur supprimé');
    });
  });
}

function openAgentModal(existing){
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>${existing?'Modifier':'Nouvel'} utilisateur</h3>
      <div class="field"><label>Nom</label><input id="am_nom" value="${existing?existing.nom:''}" placeholder="ex: Karim"></div>
      <div class="field"><label>Code PIN (4 chiffres)</label><input id="am_pin" value="${existing?existing.pin:''}" maxlength="4" inputmode="numeric" placeholder="ex: 1234"></div>
      <div class="field"><label>Rôle</label>
        <select id="am_role">
          <option value="agent" ${existing && existing.role==='agent'?'selected':''}>Équipe nettoyage</option>
          <option value="controleur" ${existing && existing.role==='controleur'?'selected':''}>Contrôleur</option>
        </select>
      </div>
      <div class="field"><label>Statut</label>
        <select id="am_actif">
          <option value="true" ${!existing || existing.actif!==false?'selected':''}>Actif</option>
          <option value="false" ${existing && existing.actif===false?'selected':''}>Inactif</option>
        </select>
      </div>
      <div class="form-actions" style="display:flex;gap:10px;">
        <button class="btn amber" id="am_save">Enregistrer</button>
        <button class="btn ghost" id="am_cancel">Annuler</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) backdrop.remove(); });
  document.getElementById('am_cancel').addEventListener('click', ()=>backdrop.remove());
  document.getElementById('am_save').addEventListener('click', async ()=>{
    const nom = document.getElementById('am_nom').value.trim();
    const pin = document.getElementById('am_pin').value.trim();
    const role = document.getElementById('am_role').value;
    const actif = document.getElementById('am_actif').value==='true';
    if(!nom || !/^\d{4}$/.test(pin)){ toast('Nom requis et PIN à 4 chiffres'); return; }
    const id = existing ? existing.id : uid('agent');
    try{
      await db.collection('agents').doc(id).set({ nom, pin, role, actif }, { merge:true });
      await syncAgentsFromFirestore();
      backdrop.remove();
      toast('Utilisateur enregistré');
      refreshAgentsList();
    }catch(err){ toast('Erreur d\'enregistrement (connexion ?)'); }
  });
}

/* =========================================================================
   GÉNÉRATION PDF
   ========================================================================= */
function generateControlePDF(c){
  if(typeof window.jspdf === 'undefined'){ toast('Génération PDF indisponible (bibliothèque non chargée)'); return; }
  const { jsPDF } = window.jspdf;
  const zone = ZONES.find(z=>z.id===c.zoneId);
  const points = POINTS[c.zoneId] || [];
  const docPdf = new jsPDF();
  let y = 20;

  docPdf.setFont('helvetica','bold'); docPdf.setFontSize(16);
  docPdf.text('McDo Caen Centre Ville — Contrôle Nettoyage', 14, y); y+=8;
  docPdf.setFontSize(12);
  docPdf.text(`${zone?zone.nom:c.zoneId} — ${fmtDate(c.date)}`, 14, y); y+=10;

  const addBranch = (label, branch)=>{
    docPdf.setFont('helvetica','bold'); docPdf.setFontSize(12);
    docPdf.text(label + (branch.heure?` (${branch.heure})`:''), 14, y); y+=7;
    docPdf.setFont('helvetica','normal'); docPdf.setFontSize(10);
    points.forEach(p=>{
      const r = branch.reponses ? branch.reponses[p.id] : null;
      if(y>270){ docPdf.addPage(); y=20; }
      const verdict = r && r.conforme===true ? 'Conforme' : (r && r.conforme===false ? 'NON CONFORME' : '—');
      docPdf.text(`• ${p.label} : ${verdict}`, 16, y); y+=6;
      if(r && r.commentaire){ docPdf.setFontSize(9); docPdf.text(`   "${r.commentaire}"`, 18, y); docPdf.setFontSize(10); y+=6; }
      if(r && r.photo){
        if(y>230){ docPdf.addPage(); y=20; }
        try{ docPdf.addImage(r.photo, 'JPEG', 16, y, 50, 38); y+=42; }catch(e){ /* image illisible, on ignore */ }
      }
    });
    y+=6;
  };

  addBranch('Passage équipe', c.passageEquipe || {});
  if(c.contreVisite && c.contreVisite.statut==='faite'){ addBranch('Contre-visite', c.contreVisite); }

  docPdf.save(`controle-${c.zoneId}-${c.date}.pdf`);
}

/* =========================================================================
   ENVOI DE MAIL (via EmailJS — voir instructions de configuration)
   ========================================================================= */
async function sendReportEmail(c){
  if(EMAILJS_PUBLIC_KEY==='À_REMPLACER'){
    toast('EmailJS non configuré — voir les instructions');
    return;
  }
  const zone = ZONES.find(z=>z.id===c.zoneId);
  const points = POINTS[c.zoneId] || [];
  const reponses = (c.passageEquipe && c.passageEquipe.reponses) || {};
  const nonConformes = points.filter(p=>reponses[p.id] && reponses[p.id].conforme===false);
  const summary = points.map(p=>{
    const r = reponses[p.id];
    const v = r && r.conforme===true ? 'Conforme' : (r && r.conforme===false ? 'NON CONFORME' : '—');
    return `- ${p.label} : ${v}${r && r.commentaire ? ' ('+r.commentaire+')' : ''}`;
  }).join('\n');

  try{
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: RAPPORT_DESTINATAIRE,
      zone: zone ? zone.nom : c.zoneId,
      date: fmtDate(c.date),
      nb_non_conformes: nonConformes.length,
      resume: summary,
    });
    toast('Rapport envoyé par mail');
  }catch(err){
    toast('Échec de l\'envoi — vérifie la config EmailJS');
  }
}

/* =========================================================================
   INIT
   ========================================================================= */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

(function init(){
  renderLogin();
  trySync();
})();

})();
