(function(){
'use strict';

/* =========================================================================
   FIREBASE — projet "Controle Nettoyage"
   L'  n'est pas un secret : la sécurité vient des règles Firestore,
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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

/* TODO backend : remplacer par un vrai appel à la Cloud Function `loginWithPin`
   qui vérifie le PIN contre la collection Firestore `agents` et renvoie un
   Firebase Custom Token. Cette liste en dur ne sert qu'au développement local. */
const AGENTS_DEMO = [
  { id:'agent1', nom:'Karim',  pin:'1234' },
  { id:'agent2', nom:'Fatou',  pin:'5678' },
];
const CONTROLEUR_PIN = '0000'; // TODO backend : remplacer par l'auth Google mcdcaen.com

/* =========================================================================
   STOCKAGE HORS-LIGNE (IndexedDB)
   ========================================================================= */
const DB_NAME = 'controle-nettoyage';
const DB_VERSION = 1;
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

function checkPin(){
  const errEl = document.getElementById('pinError');
  if(pendingRole==='controleur'){
    if(currentPin===CONTROLEUR_PIN){
      session = { role:'controleur', nom:'Contrôleur' };
      currentPin=''; goToZones();
    } else {
      errEl.textContent = 'Code incorrect'; currentPin=''; setTimeout(renderPinDots,150);
    }
    return;
  }
  const agent = AGENTS_DEMO.find(a=>a.pin===currentPin);
  if(agent){
    session = { role:'agent', agentId:agent.id, nom:agent.nom };
    currentPin=''; goToZones();
  } else {
    errEl.textContent = 'Code incorrect'; currentPin=''; setTimeout(renderPinDots,150);
  }
}

/* =========================================================================
   ÉCRAN LISTE DES ZONES
   ========================================================================= */
async function goToZones(){ activeZoneId=null; await renderZones(); }

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
      </div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', goToZones);

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
          ${r.photo ? `<img class="photo-thumb" src="${r.photo}">` : ''}
          <label class="photo-btn">
            📷 ${r.photo?'Reprendre la photo':'Prendre une photo'}
            <input type="file" accept="image/*" capture="environment" style="display:none;" data-photo-input>
          </label>
          ${isContreVisite && equipeReponses[p.id] && equipeReponses[p.id].photo ? `<img class="photo-thumb" src="${equipeReponses[p.id].photo}" title="Photo de l'équipe">` : ''}
        </div>
        <textarea class="point-comment" placeholder="Commentaire (optionnel)">${r.commentaire||''}</textarea>
      </div>
    `;
  }).join('');

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
      let thumb = item.querySelector('.photo-thumb');
      if(!thumb){
        thumb = document.createElement('img');
        thumb.className = 'photo-thumb';
        item.querySelector('.point-photo-row').prepend(thumb);
      }
      thumb.src = dataUrl;
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
   INIT
   ========================================================================= */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

(function init(){
  renderLogin();
})();

})();
