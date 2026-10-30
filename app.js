(function(){
'use strict';

/* =========================================================================
   CORRECTIFS MOBILE & CLAVIER PHYSIQUE PC
   ========================================================================= */
if(!document.querySelector('meta[name="format-detection"]')){
  const metaTel = document.createElement('meta');
  metaTel.name = 'format-detection';
  metaTel.content = 'telephone=no';
  document.head.appendChild(metaTel);
}

const styleFix = document.createElement('style');
styleFix.innerHTML = `
  body, #app-root {
    padding-bottom: 90px !important;
    background-color: #FAF8F3 !important;
  }
  button, .pin-key, .role-btn, .zone-card, .back-link {
    touch-action: manipulation !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .pin-key, .pin-key * {
    color: #211E1A !important;
    text-decoration: none !important;
  }
  .point-photo-row {
    padding: 6px 8px !important;
    overflow-y: visible !important;
  }
  .del-photo-btn {
    position: absolute !important;
    top: -6px !important;
    right: -6px !important;
    background: #B23A34 !important;
    color: #fff !important;
    border: 2px solid #fff !important;
    border-radius: 50% !important;
    width: 22px !important;
    height: 22px !important;
    font-size: 11px !important;
    font-weight: bold !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
    z-index: 10 !important;
    cursor: pointer;
  }
  .dash-chart-title {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex-wrap: wrap !important;
    word-break: break-word !important;
    margin-bottom: 25px !important;
  }
  .loading-spinner {
    display: inline-block;
    width: 24px;
    height: 24px;
    border: 3px solid rgba(199, 121, 27, 0.2);
    border-radius: 50%;
    border-top-color: #C7791B;
    animation: spin 0.8s ease-in-out infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleFix);

window.addEventListener('keydown', (e) => {
  const loginScreen = document.getElementById('screen-login');
  if(!loginScreen) return;

  if(e.key >= '0' && e.key <= '9'){
    onPinKey(e.key);
  } else if(e.key === 'Backspace' || e.key === 'Delete'){
    onPinKey('⌫');
  }
});

/* =========================================================================
   MOTEUR DE TRADUCTION MULTILINGUE ÉLARGI (i18n DYNAMIQUE)
   ========================================================================= */
const SUPPORTED_LANGUAGES = {
  fr: '🇫🇷 Français',
  en: '🇬🇧 English',
  es: '🇪🇸 Español',
  ar: '🇸🇦 العربية',
  pt: '🇵🇹 Português',
  de: '🇩🇪 Deutsch',
  it: '🇮🇹 Italiano',
  pl: '🇵🇱 Polski',
  ro: '🇷🇴 Română',
  tr: '🇹🇷 Türkçe',
  zh: '🇨🇳 中文',
  hi: '🇮🇳 हिन्दी'
};

const STATIC_TRANSLATIONS = {};
const translationCache = {};

function t(text){
  const lang = (session && session.lang) ? session.lang : 'fr';
  if(lang === 'fr' || !text) return text;
  if(STATIC_TRANSLATIONS[lang] && STATIC_TRANSLATIONS[lang][text]) {
    return STATIC_TRANSLATIONS[lang][text];
  }
  return translationCache[`${lang}_${text}`] || text;
}

async function translateDynamicText(text, targetLang){
  if(!text || targetLang === 'fr') return text;
  if(STATIC_TRANSLATIONS[targetLang] && STATIC_TRANSLATIONS[targetLang][text]){
    return STATIC_TRANSLATIONS[targetLang][text];
  }
  const cacheKey = `${targetLang}_${text}`;
  if(translationCache[cacheKey]) return translationCache[cacheKey];

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data && data.responseData && data.responseData.translatedText){
      const translated = data.responseData.translatedText;
      translationCache[cacheKey] = translated;
      return translated;
    }
  } catch(e){}
  return text;
}

/* =========================================================================
   CONFIGURATION EMAILJS & FIREBASE
   ========================================================================= */
const EMAILJS_CONFIG = {
  serviceId: "service_oxp40jn",
  templateId: "template_w9x0ucj",
  publicKey: "WaGLuQh-wIKia0dGl"
};

if(typeof emailjs !== 'undefined'){
  emailjs.init(EMAILJS_CONFIG.publicKey);
}

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
   RÉFÉRENTIEL TÂCHES PAR DÉFAUT
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
   MOTEUR DE STOCKAGE HYBRIDE & CONFIG GLOBALE
   ========================================================================= */
const DB_NAME = 'soan-hybrid-db';
const DB_VERSION = 5;
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      const stores = ['controles', 'agents', 'task_schedule', 'sync_queue', 'mail_schedule', 'pdf_reports', 'photos', 'global_reports'];
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

// CORRECTION IMPORTANTE : ON AWAIT BIEN LE "SET" DE FIREBASE POUR GARANTIR LE RETOUR UTILISATEUR
async function pushToCloud(collection, id, data){
  await idbPut(collection, data);
  if(navigator.onLine){
    try {
      await db.collection(collection).doc(id).set(data, { merge: true });
      await idbDelete('sync_queue', `${collection}_${id}`);
    } catch(err) {
      await idbPut('sync_queue', { id: `${collection}_${id}`, collection, docId: id, data });
    }
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

async function getGlobalConfig() {
  let conf = await idbGet('mail_schedule', 'global_config');
  if(navigator.onLine){
    try {
      const doc = await db.collection('mail_schedule').doc('global_config').get();
      if(doc.exists) {
        conf = doc.data();
        await idbPut('mail_schedule', conf);
      }
    } catch(e){}
  }
  if (!conf) conf = {};
  if (conf.active === undefined) conf.active = true;
  if (!conf.time1) conf.time1 = '18:00';
  if (!conf.emails) conf.emails = [];
  if (conf.enableEquipe === undefined) conf.enableEquipe = true;
  if (conf.appName === undefined) conf.appName = 'SASU SOAN';
  if (conf.reqPhotoEq === undefined) conf.reqPhotoEq = false;
  return conf;
}

/* =========================================================================
   GESTION OPTIMISÉE DES PHOTOS POUR DÉPASSER LA LIMITE DE 1 Mo FIREBASE
   ========================================================================= */
async function getPhotoBase64(photoId) {
  if (!photoId) return '';
  if (photoId.startsWith('data:image')) return photoId; 
  
  let doc = await idbGet('photos', photoId);
  if (!doc && navigator.onLine) {
    try {
      const snap = await db.collection('photos').doc(photoId).get();
      if(snap.exists){
        doc = snap.data();
        await idbPut('photos', doc); 
      }
    } catch(e){}
  }
  return doc ? doc.base64 : '';
}

/* =========================================================================
   SYNCHRONISATION TEMPS RÉEL (ANTI-DESYNC)
   ========================================================================= */
function clearRealtimeListeners() {
  if(window.zoneListeners) {
    window.zoneListeners.forEach(u => { if(typeof u === 'function') u(); });
    window.zoneListeners = [];
  }
  if(window.controleListener) {
    if(typeof window.controleListener === 'function') window.controleListener();
    window.controleListener = null;
  }
}

/* =========================================================================
   RÉCUPÉRATION DYNAMIQUE DES TÂCHES
   ========================================================================= */
async function getAllTasksMap(forceCloud = false){
  if(navigator.onLine && forceCloud){
    try {
      const snap = await db.collection('task_schedule').get();
      for (const doc of snap.docs) {
        await idbPut('task_schedule', doc.data());
      }
    } catch(e) {}
  }

  let tasksMap = JSON.parse(JSON.stringify(DEFAULT_POINTS));
  
  Object.keys(tasksMap).forEach(zId => {
    tasksMap[zId].forEach((p, idx) => {
      if (p.order === undefined) p.order = idx;
    });
  });
  
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
        targetValue: item.targetValue,
        order: item.order !== undefined ? item.order : 9999
      };

      if(existingIdx >= 0){
        tasksMap[zId][existingIdx] = Object.assign(tasksMap[zId][existingIdx], taskObj);
      } else {
        tasksMap[zId].push(taskObj);
      }
    }
  });

  Object.keys(tasksMap).forEach(zId => {
    tasksMap[zId].sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  return tasksMap;
}

async function getPointsForToday(zoneId, dateIso){
  if (zoneId === 'global') return [];
  
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
   DÉCONNEXION AUTOMATIQUE
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
      toast(t('Session expirée suite à 3 min d’inactivité'));
      renderLogin();
    }, INACTIVITY_TIMEOUT);
  }
}

['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer, { passive: true });
});

const root = document.getElementById('app-root');

function todayISO(){ return new Date().toISOString().slice(0,10); }
function fmtDate(iso){ return iso.split('-').reverse().join('/'); }
function uid(prefix){ return (prefix||'id')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8); }

function toast(msg){
  let tEl = document.getElementById('toastEl');
  if(!tEl){ tEl=document.createElement('div'); tEl.id='toastEl'; tEl.className='toast'; document.body.appendChild(tEl); }
  tEl.textContent = msg;
  tEl.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>tEl.classList.remove('show'), 3500);
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
    if(!file) return reject("Aucun fichier sélectionné");
    const reader = new FileReader();
    
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        try {
          const targetW = Math.min(maxWidth, img.width);
          const scale = targetW / img.width;
          const targetH = Math.round(img.height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, targetW, targetH);
          
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch(err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function topbarHtml(title, sub, appName = "SASU SOAN"){
  const online = navigator.onLine;
  return `
    <div class="topbar">
      <div>
        <div class="brand-eyebrow">${t(sub||`${appName} — Prestation Nettoyage`)}</div>
        <div class="brand-title">${title}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="net-status ${online?'online':'offline'}"><span class="net-dot"></span>${t(online?'En ligne':'Hors-ligne')}</div>
      </div>
    </div>
  `;
}

async function renderLogin(){
  clearRealtimeListeners();
  clearTimeout(inactivityTimer);
  syncPendingQueue();
  
  const conf = await getGlobalConfig();
  if (!conf.enableEquipe) {
    pendingRole = 'controleur';
  }

  root.innerHTML = `
    <div id="screen-login">
      <div class="login-card">
        <div class="brand-eyebrow">${conf.appName}</div>
        <div class="brand-title">Contrôle Prestations</div>
        <div class="role-switch">
          <button class="role-btn ${pendingRole==='agent'?'active':''}" data-role="agent" style="display:${conf.enableEquipe?'block':'none'}">Équipe</button>
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
          session = { role: 'controleur', agentId: 'admin_temp', nom: 'Admin Secours', lang: 'fr', isAdmin: true };
          resetInactivityTimer();
          goToZones();
        } else if(codeInput !== null){
          toast("Code administrateur incorrect");
        }
      }
    };
  }
}

async function onPinKey(k){
  const errEl = document.getElementById('pinError');
  if(k==='⌫'){ 
    currentPin = currentPin.slice(0,-1); 
    if(errEl) { errEl.textContent=''; errEl.style.color = '#B23A34'; }
    renderPinDots(); 
    return; 
  }
  if(currentPin.length>=4) return;
  currentPin += k;
  renderPinDots();
  if(currentPin.length===4) {
    if(errEl) {
      errEl.style.color = '#6B655C'; 
      errEl.textContent = t('⏳ Vérification...');
    }
    await checkPin();
  }
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

  const errEl = document.getElementById('pinError');
  if(match){
    session = { role:pendingRole, agentId:match.id, nom:match.nom, lang: match.lang || 'fr', isAdmin: match.isAdmin === true };
    currentPin='';
    resetInactivityTimer();
    goToZones();
  } else {
    if(errEl) {
       errEl.style.color = '#B23A34';
       errEl.textContent = t('Code incorrect');
    }
    currentPin=''; 
    setTimeout(renderPinDots,150);
  }
}

async function goToZones(){ activeZoneId=null; await renderZones(); }

/* =========================================================================
   MENU PRINCIPAL
   ========================================================================= */
async function renderZones(){
  clearRealtimeListeners();
  resetInactivityTimer();
  
  await getAllTasksMap(true);
  
  const date = todayISO();
  const roleTitle = session.role==='agent' ? t('Équipe') : t('Contrôleur');
  const roleLabel = `${roleTitle} · ${session.nom}`;
  const userLang = (session && session.lang) ? session.lang : 'fr';
  const config = await getGlobalConfig();

  const allAgents = await idbGetAll('agents');
  const hasAdmin = allAgents.some(a => a.isAdmin === true);
  const canAccessAdmin = session.isAdmin || session.agentId === 'admin_temp' || (session.role === 'controleur' && !hasAdmin);

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(roleLabel, fmtDate(date), config.appName)}
      <div class="section">
        <div class="section-title">${t('Zones de Prestation')}</div>
        <button class="btn block" id="globalReportBtn" style="margin-bottom:12px; border-color:#211E1A; background:#211E1A; color:#fff; font-size:14px; padding:10px;">📝 ${t('Bilan Général du Jour')}</button>
        <div class="zone-grid" id="zoneGrid">
          <div style="text-align:center;padding:30px;"><div class="loading-spinner"></div></div>
        </div>
      </div>
      
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <button class="btn ghost block" id="historyBtn" style="flex:1;">${t('📜 Historique')}</button>
        <button class="btn ghost block" id="statsBtn" style="flex:1;">${t('📊 Dashboard')}</button>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:15px;">
        <button class="btn ghost block" id="globalPdfBtn" style="flex:1;border-color:#C7791B;color:#C7791B;">${t('📄 Rapport PDF')}</button>
        ${canAccessAdmin ? `<button class="btn ghost block" id="mailScheduleBtn" style="flex:1;border-color:#2B6E68;color:#2B6E68;">⚙️ Paramètres</button>` : ''}
      </div>

      ${canAccessAdmin ? `
        <button class="btn amber block" id="adminTasksBtn" style="margin-bottom:10px;">${t('📅 Gestion des Tâches')}</button>
        <button class="btn amber block" id="adminUsersBtn" style="margin-bottom:10px;">${t('👤 Gestion des Utilisateurs')}</button>
      ` : ''}
      <button class="btn ghost block" id="logoutBtn">${t('Déconnexion')}</button>
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
      const eqReponses = (c && c.passageEquipe && c.passageEquipe.reponses) || {};
      const cvReponses = (c && c.contreVisite && c.contreVisite.reponses) || {};

      activePoints.forEach(p => {
        if(isAgent && config.enableEquipe){
          const rEq = eqReponses[p.id];
          const rCv = cvReponses[p.id];
          const eqAnswered = rEq && rEq.conforme !== null && rEq.conforme !== undefined;
          const cvAnswered = rCv && rCv.conforme !== null && rCv.conforme !== undefined;
          
          if (!eqAnswered && !cvAnswered) remaining++;
        } else {
          const r = cvReponses[p.id];
          if(!r || r.conforme === undefined || r.conforme === null) remaining++;
        }
      });

      const badgeText = remaining === 0 ? t('✓ Complété') : `${remaining} ${t('restant(s)')}`;
      const badgeBg = remaining === 0 ? '#2B6E68' : '#C7791B';

      const nbTasks = activePoints.length;
      const taskLabelPlural = nbTasks <= 1 ? t('tâche') : t('tâches');
      const translatedZoneName = await translateDynamicText(z.nom, userLang);

      html += `
        <div class="zone-card" data-zone="${z.id}" style="cursor:pointer;">
          <div>
            <div class="zone-name">${translatedZoneName}</div>
            <div class="zone-meta">${nbTasks} ${taskLabelPlural} ${t('au planning')}</div>
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
        activeMode = (isAgent && config.enableEquipe) ? 'equipe' : 'contreVisite';
        renderControle();
      };
    });
  };

  // Affichage immédiat des données locales
  await getAllTasksMap(false);
  await updateGridUI();

  // Mise à jour silencieuse du Cloud en arrière-plan sans bloquer l'écran
  getAllTasksMap(true, updateGridUI);

  const globalBtn = document.getElementById('globalReportBtn');
  if(globalBtn) {
      globalBtn.onclick = () => {
          activeZoneId = 'global';
          activeControleId = `${date}__global`;
          activeMode = (isAgent && config.enableEquipe) ? 'equipe' : 'contreVisite';
          renderControle();
      };
  }

  if(navigator.onLine){
    window.zoneListeners = window.zoneListeners || [];
    ZONES.forEach(z => {
      const controleId = `${date}__${z.id}`;
      const unsub = db.collection('controles').doc(controleId).onSnapshot(doc => {
        if(doc.exists){
          idbPut('controles', doc.data()).then(() => {
            if(document.getElementById('zoneGrid')) updateGridUI();
          });
        }
      });
      window.zoneListeners.push(unsub);
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
   PROGRAMMATION MAILS ET REGLAGES GLOBAUX
   ========================================================================= */
async function generateAndStorePDFData(){
  const date = todayISO();
  const config = await getGlobalConfig();
  const enableEq = config.enableEquipe;

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
      const isRealEcart = enableEq ? (eqConformeCalculated === true && cvConformeCalculated === false) : false;

      if(!isFinalOk) totalNok++;
      if(isRealEcart) totalEcarts++;
    }
  }

  const statusSummary = totalNok === 0 
    ? (enableEq ? 'PRESTATION CONFORME — 0 NOK' : 'CONSTAT CONFORME — 0 NOK')
    : (enableEq ? `${totalNok} NOK dont ${totalEcarts} écart(s)` : `${totalNok} NOK`);

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
  clearRealtimeListeners();
  resetInactivityTimer();
  let mailConfig = await getGlobalConfig();

  const getStorageInfo = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        return `${usageMB} Mo`;
      } catch (e) {
        return 'Calcul impossible';
      }
    }
    return 'Non supporté';
  };

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Paramètres & Mails', 'Gestion Globale', mailConfig.appName)}
      <div class="back-link" id="backBtn">${t('← Retour aux zones')}</div>
      <div class="section" style="padding:16px;">
        
        <div style="background:#fff;border:1px solid #E7E1D6;padding:14px;border-radius:10px;margin-bottom:15px;">
          <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:10px;">⚙️ Préférences de l'application</div>
          
          <div style="margin-bottom:12px;">
            <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:4px;font-weight:600;">Nom de l'entreprise :</label>
            <input type="text" id="appNameInput" value="${mailConfig.appName}" placeholder="ex: SASU SOAN" style="width:100%;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:13px;">
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px dashed #E7E1D6;">
            <span style="font-size:12px;color:#211E1A;font-weight:600;">Activer la saisie Équipe (Double contrôle)</span>
            <input type="checkbox" id="enableEquipeCheck" ${mailConfig.enableEquipe?'checked':''} style="width:20px;height:20px;accent-color:#2B6E68;cursor:pointer;">
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px dashed #E7E1D6;">
            <div style="display:flex;flex-direction:column;">
              <span style="font-size:12px;color:#211E1A;font-weight:600;">Photo obligatoire pour dire OK (Équipe)</span>
              <span style="font-size:10px;color:#6B655C;">(Le bouton NOK exige TOUJOURS une photo)</span>
            </div>
            <input type="checkbox" id="reqPhotoEqCheck" ${mailConfig.reqPhotoEq?'checked':''} style="width:20px;height:20px;accent-color:#2B6E68;cursor:pointer;">
          </div>
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;padding:14px;border-radius:10px;margin-bottom:15px;">
          <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:10px;">☁️ Stockage & Base de données</div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px dashed #E7E1D6;margin-bottom:8px;">
            <div style="display:flex;flex-direction:column;">
              <span style="font-size:12px;color:#211E1A;font-weight:600;">Stockage Cloud (Firebase)</span>
              <span style="font-size:10px;color:#6B655C;">Espace réel occupé sur le serveur</span>
            </div>
            <button class="btn ghost small" id="calcCloudBtn" style="padding:4px 8px;font-size:10px;border-color:#2B6E68;color:#2B6E68;">Calculer</button>
            <span id="firebaseUsageBadge" style="display:none;background:#DCEEEC;color:#2B6E68;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;"></span>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;flex-direction:column;">
              <span style="font-size:12px;color:#211E1A;font-weight:600;">Stockage Local (Cet appareil)</span>
              <span style="font-size:10px;color:#6B655C;">Données en cache sur ce téléphone/PC</span>
            </div>
            <span id="storageUsageBadge" style="background:#E7E1D6;color:#211E1A;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">Calcul...</span>
          </div>

          <button class="btn ghost block" id="clearCacheBtn" style="border-color:#B23A34;color:#B23A34;margin-top:10px;font-size:12px;">🗑️ Vider le cache de l'appareil</button>
          <div style="font-size:9.5px;color:#B23A34;text-align:center;margin-top:6px;">Ne supprime pas les données de la journée en cours.</div>
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;padding:14px;border-radius:10px;margin-bottom:15px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-weight:700;font-size:13px;color:#211E1A;">Envoi automatique PDF</span>
            <input type="checkbox" id="mailActiveCheck" ${mailConfig.active?'checked':''} style="width:20px;height:20px;accent-color:#2B6E68;cursor:pointer;">
          </div>

          <div style="margin-top:10px;">
            <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:2px;">Heure d'envoi quotidien :</label>
            <input type="time" id="mailTime1" value="${mailConfig.time1||'18:00'}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:13px;">
          </div>
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;padding:14px;border-radius:10px;margin-bottom:15px;">
          <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:10px;">Destinataires du Rapport</div>
          <div id="emailListContainer"></div>
          
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="email" id="newEmailInput" placeholder="ex: direction@entreprise.fr" style="flex:1;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:12px;">
            <button class="btn amber small" id="addEmailBtn" style="padding:6px 12px;">+ Ajouter</button>
          </div>
        </div>

        <button class="btn amber block" id="saveMailConfigBtn" style="margin-bottom:10px;">Enregistrer la Configuration</button>
        <button class="btn ghost block" id="sendTestNowBtn" style="border-color:#2B6E68;color:#2B6E68;">🧪 Tester l'envoi In-App du Mail</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  getStorageInfo().then(res => {
    const badge = document.getElementById('storageUsageBadge');
    if(badge) badge.textContent = res;
  });

  document.getElementById('calcCloudBtn').onclick = async () => {
    const btn = document.getElementById('calcCloudBtn');
    const badge = document.getElementById('firebaseUsageBadge');
    btn.textContent = 'Calcul...';
    
    try {
      const snap = await db.collection('controles').get();
      let totalStr = '';
      snap.docs.forEach(d => totalStr += JSON.stringify(d.data()));
      const snap2 = await db.collection('pdf_reports').get();
      snap2.docs.forEach(d => totalStr += JSON.stringify(d.data()));
      
      let photosSize = 0;
      const snap3 = await db.collection('photos').get();
      snap3.docs.forEach(d => {
         const data = d.data();
         if(data.base64) photosSize += data.base64.length;
      });
      
      const sizeMB = ((new Blob([totalStr]).size + photosSize) / (1024 * 1024)).toFixed(2);
      btn.style.display = 'none';
      badge.style.display = 'inline-block';
      badge.textContent = `${sizeMB} Mo`;
    } catch(e) {
      btn.textContent = 'Erreur';
    }
  };

  document.getElementById('clearCacheBtn').onclick = async () => {
    if(confirm("Voulez-vous vraiment vider le cache de cet appareil ? Cela libérera de l'espace local. Toutes les données restent sécurisées sur Firebase.")){
      const today = todayISO();
      const idb = await openDB();
      
      const txC = idb.transaction('controles', 'readwrite');
      const storeC = txC.objectStore('controles');
      const reqC = storeC.getAllKeys();
      reqC.onsuccess = () => {
        reqC.result.forEach(k => {
          if(!String(k).startsWith(today)) storeC.delete(k);
        });
      };
      
      const txP = idb.transaction('pdf_reports', 'readwrite');
      const storeP = txP.objectStore('pdf_reports');
      const reqP = storeP.getAllKeys();
      reqP.onsuccess = () => {
        reqP.result.forEach(k => {
          if(k !== `report_${today}`) storeP.delete(k);
        });
      };

      toast('Cache nettoyé avec succès !');
      setTimeout(() => {
        getStorageInfo().then(res => {
          const badge = document.getElementById('storageUsageBadge');
          if(badge) badge.textContent = res;
        });
      }, 1000);
    }
  };

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
    mailConfig.appName = document.getElementById('appNameInput').value.trim() || 'SASU SOAN';
    mailConfig.active = document.getElementById('mailActiveCheck').checked;
    mailConfig.enableEquipe = document.getElementById('enableEquipeCheck').checked;
    mailConfig.reqPhotoEq = document.getElementById('reqPhotoEqCheck').checked;
    mailConfig.time1 = document.getElementById('mailTime1').value;

    await pushToCloud('mail_schedule', 'global_config', mailConfig);
    toast('Configuration sauvegardée !');
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
   SAISIE CONTRÔLE / PRESTATION ZONE (OPTIMISÉE ANTI-LAG)
   ========================================================================= */
let isPhotoUploading = false; 
let isInteracting = false; 
let interactionTimer = null;
let autoSaveTimer = null;

async function renderControle(){
  clearRealtimeListeners();
  resetInactivityTimer();
  isPhotoUploading = false;
  isInteracting = false;
  
  const date = todayISO();
  const currentHour = new Date().getHours();
  const userLang = (session && session.lang) ? session.lang : 'fr';
  
  const config = await getGlobalConfig();
  const enableEq = config.enableEquipe;

  const isGlobal = activeZoneId === 'global';

  let c = await idbGet('controles', activeControleId);
  if(!c) {
    c = {
      id: activeControleId, zoneId: activeZoneId, date,
      passageEquipe: { agentNom:null, heure:null, reponses:{} },
      contreVisite:  { controleurNom:null, heure:null, reponses:{} }
    };
  }

  if (!c.passageEquipe.reponses) c.passageEquipe.reponses = {};
  if (!c.contreVisite.reponses) c.contreVisite.reponses = {};

  const zone = isGlobal ? { id: 'global', nom: 'Bilan Général du Jour' } : ZONES.find(z=>z.id===activeZoneId);
  const activePoints = isGlobal ? [] : await getPointsForToday(activeZoneId, date);
  const isContreVisite = activeMode==='contreVisite';
  
  let currentBranch = isContreVisite ? c.contreVisite : c.passageEquipe;
  let equipeReponses = c.passageEquipe.reponses;

  if (!isGlobal) {
    activePoints.forEach(p => {
      if(!isContreVisite && enableEq){
        if(currentHour >= 10){
          if(!currentBranch.reponses[p.id]){
            currentBranch.reponses[p.id] = { conforme: false, photos:[], commentaire: t('Non réalisé avant 10h') };
          } else if(config.reqPhotoEq && (!currentBranch.reponses[p.id].photos || currentBranch.reponses[p.id].photos.length === 0)){
            currentBranch.reponses[p.id].conforme = false;
          }
        }
      }
    });
  }

  let viewSubtitle = '';
  if(!enableEq) viewSubtitle = t('Rapport de Constat');
  else viewSubtitle = isContreVisite ? t('Contre-visite Contrôleur') : t('Réalisation Prestation');

  const translatedZoneName = isGlobal ? t('Bilan Général du Jour') : await translateDynamicText(zone.nom, userLang);

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(translatedZoneName, viewSubtitle, config.appName)}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="back-link" id="backBtn" style="margin:0;">${t('← Retour')}</div>
        <button class="btn ghost small" id="forceSaveBtn" style="border-color:#2B6E68; color:#2B6E68; display:flex; align-items:center; gap:6px;">
          💾 ${t('Sauvegarder')}
        </button>
      </div>
      <div class="section">
        <div id="pointsList">
          <div style="text-align:center;padding:30px;">
            <div class="loading-spinner"></div>
            <div style="font-size:12px;color:#6B655C;margin-top:10px;">${t('Chargement…')}</div>
          </div>
        </div>
        <button class="btn amber block" id="saveBtn" style="margin-top:12px;">${t('Terminer et Retourner aux Zones')}</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  const triggerAutoSave = async (immediate = false) => {
    isInteracting = true;
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(() => { isInteracting = false; }, 3000);

    const currentTime = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    currentBranch.heure = currentTime;
    
    if(isContreVisite) currentBranch.controleurNom = session.nom;
    else currentBranch.agentNom = session.nom;

    await idbPut('controles', c); 

    clearTimeout(autoSaveTimer);
    if (immediate) {
        if(navigator.onLine) await pushToCloud('controles', c.id, c);
    } else {
        autoSaveTimer = setTimeout(() => {
            if(navigator.onLine) pushToCloud('controles', c.id, c);
        }, 1000);
    }
  };

  document.getElementById('forceSaveBtn').onclick = async () => {
    if(isPhotoUploading) {
      toast('⏳ Veuillez patienter, une photo est en cours de traitement...');
      return;
    }
    const btn = document.getElementById('forceSaveBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ En cours...';
    btn.disabled = true;
    
    await triggerAutoSave(true);
    
    btn.innerHTML = '✅ Terminé';
    toast('Données synchronisées avec succès sur le Cloud !');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 2000);
  };

  const renderSinglePhotoHtml = (src, pId, idx, locked) => {
    return `
      <div class="photo-item-thumb" data-idx="${idx}" style="position:relative;display:inline-block;margin-right:8px;margin-top:4px;">
        <img class="photo-thumb click-zoom" src="${src}" data-title="Photo - ${pId}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer;">
        ${!locked ? `<button class="del-photo-btn" data-point="${pId}" data-idx="${idx}">✕</button>` : ''}
      </div>
    `;
  };

  const refreshPointsListUI = async () => {
    let pointsHtml = '';

    if (!isGlobal) {
        for(const p of activePoints){
          const r = currentBranch.reponses[p.id] || { conforme: null, photos:[], commentaire:'' };

          const eqR = equipeReponses[p.id] || {};
          const cvR = (c.contreVisite && c.contreVisite.reponses && c.contreVisite.reponses[p.id]) || {};

          const eqPhotoIds = eqR.photos || [];
          const eqPhotosBase64 = [];
          for(let pid of eqPhotoIds) { eqPhotosBase64.push(await getPhotoBase64(pid)); }

          const cvPhotoIds = cvR.photos || [];
          const cvPhotosBase64 = [];
          for(let pid of cvPhotoIds) { cvPhotosBase64.push(await getPhotoBase64(pid)); }

          const myPhotosBase64 = isContreVisite ? cvPhotosBase64 : eqPhotosBase64;
          const myPhotoIds = isContreVisite ? cvPhotoIds : eqPhotoIds;

          const isAlreadyControlled = cvR.conforme !== undefined && cvR.conforme !== null;
          const isLockedByControl = !isContreVisite && isAlreadyControlled;

          const eqWasOk = (eqR.conforme === true && (!config.reqPhotoEq || (eqPhotoIds && eqPhotoIds.length > 0)));
          const isEquipeNok = enableEq && isContreVisite && !eqWasOk && (eqR.conforme !== undefined);

          let disableOk = isLockedByControl;
          let disableNok = isLockedByControl || myPhotoIds.length === 0; 
          let photoWarningText = '';
          
          if(enableEq) {
            if(!isContreVisite) {
              if (!isLockedByControl && config.reqPhotoEq && myPhotoIds.length === 0) {
                  disableOk = true;
              }
              if(config.reqPhotoEq) photoWarningText = t('Photo obligatoire pour toute saisie (OK ou NOK) :');
              else photoWarningText = t('Photo obligatoire pour signaler une anomalie (NOK) :');
            } else {
              photoWarningText = t('Photo contrôleur exigée pour invalider (NOK) :');
            }
          } else {
            photoWarningText = t('Photo exigée pour signaler un NOK :');
          }

          if (isLockedByControl) photoWarningText = t('🔒 Saisie verrouillée (déjà contrôlée)');

          const freqLabel = p.freq==='J' ? t('Jour') : (p.freq==='H' ? t('Hebdo') : t('Mensuel'));
          const displayLabel = await translateDynamicText(p.label, userLang);

          pointsHtml += `
            <div class="point-item" data-point="${p.id}" style="border:1px solid ${isEquipeNok?'#B23A34':'#E7E1D6'};padding:12px;border-radius:10px;margin-bottom:12px;background:${isEquipeNok?'#F6DEDC':'#fff'};">
              
              <div class="point-head" style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px;">
                <div class="point-label" style="flex:1; font-weight:600; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                  <span style="line-height:1.3; color:#211E1A; margin-top:2px;">${displayLabel}</span>
                  <span style="background:#FAF8F3; border:1px solid #E7E1D6; color:#857F75; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; margin-top:2px;">${freqLabel}</span>
                  ${isEquipeNok ? `<span style="background:#B23A34;color:#fff;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold;white-space:nowrap;margin-top:2px;">⚠️ ${t('Équipe').toUpperCase()} : NOK</span>` : ''}
                </div>
                
                <div class="point-toggle" style="display:flex; gap:6px; flex-shrink:0;">
                  <button class="toggle-btn conforme ${r.conforme===true?'active':''}" data-val="true" data-locked="${disableOk || isLockedByControl ? 'true' : 'false'}" data-locked-by-control="${isLockedByControl ? 'true' : 'false'}" style="padding:4px 12px; font-size:12px; font-weight:600; border-radius:20px; min-width:60px; height:32px; display:inline-flex; align-items:center; justify-content:center; white-space:nowrap; border:1px solid ${r.conforme===true?'#2B6E68':'#E7E1D6'}; background:${r.conforme===true?'#2B6E68':'#fff'}; color:${r.conforme===true?'#fff':'#6B655C'}; ${disableOk || isLockedByControl ? 'opacity:0.4; cursor:not-allowed;' : ''}">✓ OK</button>
                  <button class="toggle-btn non-conforme ${r.conforme===false?'active':''}" data-val="false" data-locked="${disableNok || isLockedByControl ? 'true' : 'false'}" data-locked-by-control="${isLockedByControl ? 'true' : 'false'}" style="padding:4px 12px; font-size:12px; font-weight:600; border-radius:20px; min-width:60px; height:32px; display:inline-flex; align-items:center; justify-content:center; white-space:nowrap; border:1px solid ${r.conforme===false?'#B23A34':'#E7E1D6'}; background:${r.conforme===false?'#B23A34':'#fff'}; color:${r.conforme===false?'#fff':'#6B655C'}; ${disableNok || isLockedByControl ? 'opacity:0.4; cursor:not-allowed;' : ''}">✕ NOK</button>
                </div>
              </div>

              ${enableEq && isContreVisite && eqPhotosBase64.length ? `
                <div style="font-size:11px;color:#2B6E68;font-weight:700;margin-top:8px;">${t('📸 Photos transmises par l\'Équipe :')}</div>
                <div class="point-photo-row" style="display:flex;gap:6px;overflow-x:auto;padding:6px;background:#DCEEEC;border-radius:8px;margin-top:4px;">
                  ${eqPhotosBase64.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Équipe - ${p.label}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">`).join('')}
                </div>
              ` : ''}

              ${enableEq && isContreVisite && eqR.commentaire ? `
                <div style="font-size:11px;color:#2B6E68;margin-top:4px;font-style:italic;">${t('💬 Obs. Équipe')} (${c.passageEquipe.agentNom||t('Équipe')}) : "${eqR.commentaire}"</div>
              ` : ''}

              ${enableEq && !isContreVisite && isAlreadyControlled ? `
                <div style="font-size:11px;color:#C7791B;font-weight:700;margin-top:8px;padding:8px;background:#FAF8F3;border:1px dashed #C7791B;border-radius:8px;">
                  🔒 ${t('Tâche déjà contrôlée par')} ${c.contreVisite.controleurNom || t('le Contrôleur')} : 
                  <strong style="color:${cvR.conforme?'#2B6E68':'#B23A34'}; font-size:12px;">${cvR.conforme?'✓ OK':'✕ NOK'}</strong>
                  ${cvR.commentaire ? `<div style="margin-top:4px;font-style:italic;color:#4A453E;">💬 "${cvR.commentaire}"</div>` : ''}
                  ${cvPhotosBase64.length > 0 ? `
                    <div style="display:flex;gap:6px;overflow-x:auto;margin-top:6px;">
                      ${cvPhotosBase64.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Contrôleur" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #C7791B;cursor:pointer;">`).join('')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <div style="font-size:11px;color:#6B655C;margin-top:8px;">
                ${photoWarningText}
              </div>
              <div class="point-photo-row" id="photos_${p.id}" style="display:flex;align-items:center;overflow-x:auto;margin-top:4px;">
                <div class="my-photos-container" style="display:inline-flex;align-items:center;">
                  ${myPhotosBase64.map((pSrc, idx) => renderSinglePhotoHtml(pSrc, p.id, idx, isLockedByControl)).join('')}
                </div>
                ${!isLockedByControl ? `
                  <label class="photo-btn" style="border:1px dashed #C7791B;padding:8px 12px;border-radius:6px;font-size:12px;color:#C7791B;cursor:pointer;white-space:nowrap;margin-top:4px;">
                    ${t('📷 + Photo')}
                    <input type="file" accept="image/*" style="display:none;" data-photo-input>
                  </label>
                ` : ''}
              </div>
              
              <textarea class="point-comment" placeholder="${!enableEq ? t('Remarques (optionnel)') : (isContreVisite ? t('Remarques Contrôleur (optionnel)') : t('Remarques Équipe (optionnel)'))}" style="width:100%;margin-top:8px;padding:6px;border-radius:6px;border:1px solid #E7E1D6; box-sizing:border-box;" ${isLockedByControl ? 'disabled' : ''}>${r.commentaire||''}</textarea>
            </div>
          `;
        }
    }

    const zsId = 'zone_summary';
    const zsR = currentBranch.reponses[zsId] || { photos: [], commentaire: '' };
    const zsEqR = equipeReponses[zsId] || {};
    const zsCvR = (c.contreVisite && c.contreVisite.reponses && c.contreVisite.reponses[zsId]) || {};

    const zsEqPhotoIds = zsEqR.photos || [];
    const zsEqPhotosBase64 = [];
    for(let pid of zsEqPhotoIds) { zsEqPhotosBase64.push(await getPhotoBase64(pid)); }

    const zsCvPhotoIds = zsCvR.photos || [];
    const zsCvPhotosBase64 = [];
    for(let pid of zsCvPhotoIds) { zsCvPhotosBase64.push(await getPhotoBase64(pid)); }

    const zsMyPhotosBase64 = isContreVisite ? zsCvPhotosBase64 : zsEqPhotosBase64;
    
    const zsIsLockedByControl = false; 

    const zsTitle = isGlobal ? t('📝 Bilan Global du Jour') : t('📝 Bilan de la zone (Optionnel)');

    pointsHtml += `
      <div class="point-item" data-point="${zsId}" style="border:2px solid #C7791B;padding:12px;border-radius:10px;margin-bottom:12px;background:#FAF8F3;">
        <div style="font-weight:800;font-size:14px;color:#C7791B;margin-bottom:8px;text-transform:uppercase;">
          ${zsTitle}
        </div>

        ${enableEq && isContreVisite && zsEqPhotosBase64.length ? `
          <div style="font-size:11px;color:#2B6E68;font-weight:700;margin-top:8px;">${t('📸 Photos transmises par l\'Équipe :')}</div>
          <div class="point-photo-row" style="display:flex;gap:6px;overflow-x:auto;padding:6px;background:#DCEEEC;border-radius:8px;margin-top:4px;">
            ${zsEqPhotosBase64.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Équipe - Bilan" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">`).join('')}
          </div>
        ` : ''}

        ${enableEq && isContreVisite && zsEqR.commentaire ? `
          <div style="font-size:11px;color:#2B6E68;margin-top:4px;font-style:italic;">${t('💬 Obs. Équipe')} (${c.passageEquipe.agentNom||t('Équipe')}) : "${zsEqR.commentaire}"</div>
        ` : ''}

        ${enableEq && !isContreVisite && (zsCvR.commentaire || zsCvPhotosBase64.length > 0) ? `
          <div style="font-size:11px;color:#C7791B;font-weight:700;margin-top:8px;padding:8px;background:#fff;border:1px dashed #C7791B;border-radius:8px;">
            🔒 ${t('Bilan complété par')} ${c.contreVisite.controleurNom || t('le Contrôleur')}
            ${zsCvR.commentaire ? `<div style="margin-top:4px;font-style:italic;color:#4A453E;">💬 "${zsCvR.commentaire}"</div>` : ''}
            ${zsCvPhotosBase64.length > 0 ? `
              <div style="display:flex;gap:6px;overflow-x:auto;margin-top:6px;">
                ${zsCvPhotosBase64.map(pSrc=>`<img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Contrôleur" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #C7791B;cursor:pointer;">`).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="point-photo-row" id="photos_${zsId}" style="display:flex;align-items:center;overflow-x:auto;margin-top:8px;">
          <div class="my-photos-container" style="display:inline-flex;align-items:center;">
            ${zsMyPhotosBase64.map((pSrc, idx) => renderSinglePhotoHtml(pSrc, zsId, idx, zsIsLockedByControl)).join('')}
          </div>
          ${!zsIsLockedByControl ? `
            <label class="photo-btn" style="border:1px dashed #C7791B;padding:8px 12px;border-radius:6px;font-size:12px;color:#C7791B;cursor:pointer;white-space:nowrap;margin-top:4px;">
              ${t('📷 + Photo')}
              <input type="file" accept="image/*" style="display:none;" data-photo-input>
            </label>
          ` : ''}
        </div>
        
        <textarea class="point-comment" placeholder="${isGlobal ? t('Saisissez le bilan général ici (optionnel)...') : t('Remarques générales sur la zone (optionnel)')}" style="width:100%;margin-top:8px;padding:6px;border-radius:6px;border:1px solid #E7E1D6; box-sizing:border-box; min-height:60px;" ${zsIsLockedByControl ? 'disabled' : ''}>${zsR.commentaire||''}</textarea>
      </div>
    `;

    const listEl = document.getElementById('pointsList');
    if(listEl) listEl.innerHTML = pointsHtml;

    document.querySelectorAll('.click-zoom').forEach(img => {
      img.onclick = () => openPhotoViewer(img.src, img.dataset.title);
    });

    const attachDelButtons = () => {
      document.querySelectorAll('.del-photo-btn').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const pId = btn.dataset.point;
          const idx = parseInt(btn.dataset.idx);
          if(currentBranch.reponses[pId] && currentBranch.reponses[pId].photos){
            const deletedId = currentBranch.reponses[pId].photos.splice(idx, 1)[0];
            
            if(deletedId && !deletedId.startsWith('data:image')){
                idbDelete('photos', deletedId);
                if(navigator.onLine) db.collection('photos').doc(deletedId).delete().catch(()=>{});
            }

            const thumbItem = btn.closest('.photo-item-thumb');
            if(thumbItem) thumbItem.remove();
            
            if(currentBranch.reponses[pId].photos.length === 0){
              const parentCard = document.querySelector(`.point-item[data-point="${pId}"]`);
              if(parentCard && pId !== 'zone_summary'){
                const rEqLoc = equipeReponses[pId] || {};
                const eqWasOkLoc = (rEqLoc.conforme === true && (!config.reqPhotoEq || (rEqLoc.photos && rEqLoc.photos.length > 0)));
                
                parentCard.querySelectorAll('.toggle-btn').forEach(b => {
                  const isNokBtn = b.classList.contains('non-conforme');
                  const isOkBtn = b.classList.contains('conforme');
                  let lock = false;
                  
                  if(isNokBtn) lock = true; 
                  else if(isOkBtn && enableEq && !isContreVisite && config.reqPhotoEq) lock = true;

                  if(lock){
                    b.dataset.locked = 'true';
                  }
                });
              }
            }
            
            triggerAutoSave();
          }
        };
      });
    };
    attachDelButtons();

    document.querySelectorAll('.point-item').forEach(item=>{
      const pId = item.dataset.point;
      if(!currentBranch.reponses[pId]) {
        currentBranch.reponses[pId] = { conforme: null, photos:[], commentaire:'' };
      }
      const r = currentBranch.reponses[pId];

      item.querySelectorAll('.toggle-btn').forEach(btn=>{
        btn.onclick = async (e)=>{
          e.preventDefault();
          if(btn.dataset.lockedByControl === 'true'){
             toast('🔒 Cette tâche a déjà été contrôlée, modification impossible.');
             return;
          }
          if(btn.dataset.locked === 'true'){
            if(btn.classList.contains('non-conforme')) {
              toast('📷 Photo obligatoire pour signaler une anomalie (NOK)');
            } else {
              toast('📷 Photo obligatoire pour valider cette tâche (OK)');
            }
            return;
          }

          r.conforme = btn.dataset.val==='true';
          
          item.querySelectorAll('.toggle-btn').forEach(b=>{
             b.classList.remove('active');
             b.style.background = '#fff';
             b.style.color = '#6B655C';
             b.style.borderColor = '#E7E1D6';
          });
          
          btn.classList.add('active');
          if(r.conforme === true){
             btn.style.background = '#2B6E68';
             btn.style.color = '#fff';
             btn.style.borderColor = '#2B6E68';
          } else {
             btn.style.background = '#B23A34';
             btn.style.color = '#fff';
             btn.style.borderColor = '#B23A34';
          }
          
          triggerAutoSave();
        };
      });

      const fileInput = item.querySelector('[data-photo-input]');
      if(fileInput) {
          fileInput.onchange = async () => {
            if (!fileInput.files || !fileInput.files.length) return;
            
            isPhotoUploading = true;
            
            try {
              toast(t('Chargement de la photo...'));
              const file = fileInput.files[0];
              const dataUrl = await fileToResizedBase64(file, 1200);
              
              const photoId = uid('photo');
              await pushToCloud('photos', photoId, { id: photoId, base64: dataUrl });

              if (!currentBranch.reponses[pId]) {
                currentBranch.reponses[pId] = { conforme: null, photos: [], commentaire: '' };
              }
              if (!currentBranch.reponses[pId].photos) {
                currentBranch.reponses[pId].photos = [];
              }
              
              currentBranch.reponses[pId].photos.push(photoId);

              const myContainer = item.querySelector('.my-photos-container');
              if(myContainer){
                const newIdx = currentBranch.reponses[pId].photos.length - 1;
                myContainer.insertAdjacentHTML('beforeend', renderSinglePhotoHtml(dataUrl, pId, newIdx, false));
                
                const newImg = myContainer.lastElementChild.querySelector('.click-zoom');
                if(newImg) newImg.onclick = () => openPhotoViewer(newImg.src, newImg.dataset.title);
                
                attachDelButtons();
              }

              item.querySelectorAll('.toggle-btn').forEach(b => {
                b.dataset.locked = 'false';
              });

              triggerAutoSave();
            } catch (err) {
              console.error("Erreur capture photo :", err);
              toast("Erreur d'enregistrement photo");
            } finally {
              isPhotoUploading = false;
            }
          };
      }

      item.querySelector('.point-comment').oninput = (e)=>{
        r.commentaire = e.target.value;
        isInteracting = true;
        clearTimeout(item.__commentTimer);
        item.__commentTimer = setTimeout(()=>{
          triggerAutoSave();
        }, 800);
      };
    });
  };

  document.getElementById('saveBtn').onclick = async ()=>{
    if(isPhotoUploading) {
      toast('⏳ Veuillez patienter, une photo est en cours de traitement...');
      return;
    }

    let missingTasks = 0;
    if (!isGlobal) {
        for(const p of activePoints){
          const r = currentBranch.reponses[p.id];
          const cvR = (c.contreVisite && c.contreVisite.reponses && c.contreVisite.reponses[p.id]) || {};
          const isAlreadyControlled = cvR.conforme !== undefined && cvR.conforme !== null;

          if (!isContreVisite && isAlreadyControlled) continue; 

          if(!r || r.conforme === null || r.conforme === undefined){
            missingTasks++;
          }
        }
    }

    if(missingTasks > 0){
       toast(`⚠️ Impossible de terminer : Il reste ${missingTasks} tâche(s) à valider (OK/NOK).`);
       return;
    }

    await triggerAutoSave(true);
    goToZones();
  };

  await refreshPointsListUI();

  if(navigator.onLine){
    window.controleListener = db.collection('controles').doc(activeControleId).onSnapshot(doc => {
      if(doc.exists) {
        const data = doc.data();
        if(data.passageEquipe) c.passageEquipe = data.passageEquipe;
        if(data.contreVisite) c.contreVisite = data.contreVisite;
        idbPut('controles', c); 
        
        currentBranch = isContreVisite ? c.contreVisite : c.passageEquipe;
        equipeReponses = c.passageEquipe.reponses;

        if(document.getElementById('pointsList') && !isInteracting && !isPhotoUploading) {
            refreshPointsListUI();
        }
      }
    });
  }
}

/* =========================================================================
   ÉCRAN HISTORIQUE & PDF
   ========================================================================= */
async function generatePDFForDate(targetDateIso){
  resetInactivityTimer();
  if(typeof window.jspdf === 'undefined'){ toast('Bibliothèque PDF indisponible'); return; }
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const date = targetDateIso;
  const config = await getGlobalConfig();
  const enableEq = config.enableEquipe;
  
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

  docPdf.setFillColor(...C_INK);
  docPdf.rect(0, 0, 210, 28, 'F');
  
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(15);
  docPdf.text(enableEq ? `${config.appName.toUpperCase()} — RAPPORT DE PRESTATION` : `${config.appName.toUpperCase()} — RAPPORT DE CONSTAT`, 14, 15);
  
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
  docPdf.text(enableEq ? 'SOMMAIRE DE PRESTATION' : 'SOMMAIRE DU CONSTAT', 18, 42);
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
    docPdf.text(`Rapport du ${fmtDate(date)}`, 14, y);
    y += 8;

    for(const p of activePoints){
      const rEq = (eq.reponses && eq.reponses[p.id]) || { conforme: null, photos:[], commentaire:'', agentNom: eq.agentNom, heure: eq.heure };
      const rCv = (cv.reponses && cv.reponses[p.id]) || { conforme: null, photos:[], commentaire:'', controleurNom: cv.controleurNom, heure: cv.heure };

      let eqConformeCalculated = (!config.reqPhotoEq || (rEq.photos && rEq.photos.length > 0)) ? (rEq.conforme !== false) : false;
      let cvConformeCalculated = (rCv.conforme === false) ? false : true;

      const isFinalOk = (cvConformeCalculated === true);
      const isRealEcart = enableEq ? (eqConformeCalculated === true && cvConformeCalculated === false) : false;

      if(!isFinalOk) totalNok++;
      if(isRealEcart) totalEcarts++;

      const allEqPhotos = [];
      for(const pid of (enableEq ? (rEq.photos || []) : [])){
         const b64 = await getPhotoBase64(pid);
         if(b64) allEqPhotos.push(b64);
      }
      
      const allCvPhotos = [];
      for(const pid of (rCv.photos || [])){
         const b64 = await getPhotoBase64(pid);
         if(b64) allCvPhotos.push(b64);
      }

      const eqAgent = rEq.agentNom || eq.agentNom || 'Agent';
      const eqTime = rEq.heure || eq.heure || '--:--';
      const cvCtrl = rCv.controleurNom || cv.controleurNom || 'Contrôleur';
      const cvTime = rCv.heure || cv.heure || '--:--';

      let neededHeight = 16; 
      if(enableEq && rEq.commentaire) neededHeight += 5;
      if(rCv.commentaire) neededHeight += 5;

      const totalPhotos = allEqPhotos.length + allCvPhotos.length;
      if (totalPhotos > 0) {
          const photoRows = Math.ceil(totalPhotos / 3);
          neededHeight += (photoRows * 48); 
      }

      if(y + neededHeight > 280){ 
          docPdf.addPage(); 
          y = 20; 
      }

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
      
      const maxLen = enableEq ? 58 : 70;
      const safeLabel = p.label.length > maxLen ? p.label.substring(0, maxLen - 3) + '...' : p.label;
      docPdf.text(safeLabel, 18, y + 6);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8);
      
      if(enableEq) {
        docPdf.text(`Équipe: ${eqConformeCalculated?'OK':'NOK'}`, 120, y + 6);
        docPdf.text(`Contrôleur: ${cvConformeCalculated?'OK':'NOK'}`, 146, y + 6);
      } else {
        docPdf.text(`Constat: ${cvConformeCalculated?'OK':'NOK'}`, 150, y + 6);
      }

      if(enableEq && isRealEcart){
        docPdf.setFillColor(...C_RED);
        docPdf.rect(175, y + 2, 16, 10, 'F');
        docPdf.setTextColor(255, 255, 255);
        docPdf.setFont('helvetica', 'bold');
        docPdf.setFontSize(7);
        docPdf.text('ÉCART', 177, y + 8);
      }

      y += 18;

      if(rEq.commentaire || rCv.commentaire || eqAgent || cvCtrl){
        docPdf.setFontSize(8);
        docPdf.setTextColor(80, 80, 80);
        if(enableEq && rEq.commentaire){
          docPdf.text(`• Obs. Équipe [${eqAgent} à ${eqTime}] : ${rEq.commentaire}`, 18, y);
          y += 5;
        }
        if(rCv.commentaire){
          const tag = enableEq ? 'Contrôleur' : 'Constat';
          docPdf.text(`• Obs. ${tag} [${cvCtrl} à ${cvTime}] : ${rCv.commentaire}`, 18, y);
          y += 5;
        }
      }

      if(totalPhotos > 0){
        let xPos = 18;
        
        for(const imgBase64 of allEqPhotos){
          try {
            const imgProps = docPdf.getImageProperties(imgBase64);
            let finalW = 55;
            let finalH = (imgProps.height * finalW) / imgProps.width;
            if(finalH > 38) {
               finalH = 38;
               finalW = (imgProps.width * finalH) / imgProps.height;
            }
            const offsetX = xPos + (55 - finalW) / 2;
            const offsetY = y + (38 - finalH) / 2;

            docPdf.addImage(imgBase64, 'JPEG', offsetX, offsetY, finalW, finalH);
            docPdf.setFillColor(...C_TEAL);
            docPdf.rect(xPos, y + 38, 55, 6, 'F');
            docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
            docPdf.text(`ÉQUIPE : ${eqAgent}`, xPos + 2, y + 42.5);

            xPos += 58;
            if(xPos > 140){ xPos = 18; y += 48; }
          } catch(e){}
        }

        for(const imgBase64 of allCvPhotos){
          try {
            const imgProps = docPdf.getImageProperties(imgBase64);
            let finalW = 55;
            let finalH = (imgProps.height * finalW) / imgProps.width;
            if(finalH > 38) {
               finalH = 38;
               finalW = (imgProps.width * finalH) / imgProps.height;
            }
            const offsetX = xPos + (55 - finalW) / 2;
            const offsetY = y + (38 - finalH) / 2;

            docPdf.addImage(imgBase64, 'JPEG', offsetX, offsetY, finalW, finalH);
            docPdf.setFillColor(...C_AMBER);
            docPdf.rect(xPos, y + 38, 55, 6, 'F');
            docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
            docPdf.text(enableEq ? `CTRL : ${cvCtrl}` : `CONSTAT : ${cvCtrl}`, xPos + 2, y + 42.5);

            xPos += 58;
            if(xPos > 140){ xPos = 18; y += 48; }
          } catch(e){}
        }

        if(xPos !== 18) {
            y += 48;
        }
      }
    }

    // --- IMPRESSION DU BILAN DE ZONE ---
    const zsId = 'zone_summary';
    const zsEq = eq.reponses ? eq.reponses[zsId] : null;
    const zsCv = cv.reponses ? cv.reponses[zsId] : null;

    if ((zsEq && (zsEq.commentaire || (zsEq.photos && zsEq.photos.length > 0))) || 
        (zsCv && (zsCv.commentaire || (zsCv.photos && zsCv.photos.length > 0)))) {
        
        let neededHeight = 16;
        if(enableEq && zsEq && zsEq.commentaire) neededHeight += 5;
        if(zsCv && zsCv.commentaire) neededHeight += 5;
        
        let totalZPhotos = 0;
        if(zsEq && zsEq.photos) totalZPhotos += zsEq.photos.length;
        if(zsCv && zsCv.photos) totalZPhotos += zsCv.photos.length;
        if(totalZPhotos > 0) neededHeight += (Math.ceil(totalZPhotos/3) * 48);

        if(y + neededHeight > 280){ docPdf.addPage(); y = 20; }
        
        docPdf.setFillColor(250, 248, 243);
        docPdf.setDrawColor(199, 121, 27);
        docPdf.roundedRect(14, y, 182, 10, 2, 2, 'FD');
        docPdf.setFont('helvetica', 'bold');
        docPdf.setFontSize(9);
        docPdf.setTextColor(199, 121, 27);
        docPdf.text('BILAN DE LA ZONE', 18, y + 7);
        y += 14;

        if(zsEq && zsEq.commentaire || zsCv && zsCv.commentaire){
            docPdf.setFontSize(8);
            docPdf.setTextColor(80, 80, 80);
            if(enableEq && zsEq && zsEq.commentaire){
                docPdf.text(`• Bilan Équipe : ${zsEq.commentaire}`, 18, y);
                y += 5;
            }
            if(zsCv && zsCv.commentaire){
                const tag = enableEq ? 'Contrôleur' : 'Constat';
                docPdf.text(`• Bilan ${tag} : ${zsCv.commentaire}`, 18, y);
                y += 5;
            }
        }

        const zsAllEqPhotos = [];
        if(enableEq && zsEq && zsEq.photos) {
            for(const pid of zsEq.photos) { const b = await getPhotoBase64(pid); if(b) zsAllEqPhotos.push(b); }
        }
        const zsAllCvPhotos = [];
        if(zsCv && zsCv.photos) {
            for(const pid of zsCv.photos) { const b = await getPhotoBase64(pid); if(b) zsAllCvPhotos.push(b); }
        }

        if(zsAllEqPhotos.length > 0 || zsAllCvPhotos.length > 0){
            let xPos = 18;
            for(const imgBase64 of zsAllEqPhotos){
                try {
                    const imgProps = docPdf.getImageProperties(imgBase64);
                    let finalW = 55;
                    let finalH = (imgProps.height * finalW) / imgProps.width;
                    if(finalH > 38) { finalH = 38; finalW = (imgProps.width * finalH) / imgProps.height; }
                    const offsetX = xPos + (55 - finalW) / 2;
                    const offsetY = y + (38 - finalH) / 2;
                    docPdf.addImage(imgBase64, 'JPEG', offsetX, offsetY, finalW, finalH);
                    docPdf.setFillColor(...C_TEAL);
                    docPdf.rect(xPos, y + 38, 55, 6, 'F');
                    docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
                    docPdf.text(`ÉQUIPE`, xPos + 2, y + 42.5);
                    xPos += 58;
                    if(xPos > 140){ xPos = 18; y += 48; }
                } catch(e){}
            }
            for(const imgBase64 of zsAllCvPhotos){
                try {
                    const imgProps = docPdf.getImageProperties(imgBase64);
                    let finalW = 55;
                    let finalH = (imgProps.height * finalW) / imgProps.width;
                    if(finalH > 38) { finalH = 38; finalW = (imgProps.width * finalH) / imgProps.height; }
                    const offsetX = xPos + (55 - finalW) / 2;
                    const offsetY = y + (38 - finalH) / 2;
                    docPdf.addImage(imgBase64, 'JPEG', offsetX, offsetY, finalW, finalH);
                    docPdf.setFillColor(...C_AMBER);
                    docPdf.rect(xPos, y + 38, 55, 6, 'F');
                    docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
                    docPdf.text(enableEq ? `CTRL` : `CONSTAT`, xPos + 2, y + 42.5);
                    xPos += 58;
                    if(xPos > 140){ xPos = 18; y += 48; }
                } catch(e){}
            }
            if(xPos !== 18) y += 48;
        }
    }
  }

  // --- IMPRESSION DU BILAN GÉNÉRAL EN FIN DE PDF ---
  const globalId = `${date}__global`;
  let globalC = await idbGet('controles', globalId);
  if(navigator.onLine && !globalC){
      try {
          const doc = await db.collection('controles').doc(globalId).get();
          if(doc.exists) globalC = doc.data();
      } catch(e){}
  }

  if (globalC) {
      const gEq = globalC.passageEquipe || {};
      const gCv = globalC.contreVisite || {};
      const gZsEq = gEq.reponses ? gEq.reponses['zone_summary'] : null;
      const gZsCv = gCv.reponses ? gCv.reponses['zone_summary'] : null;
      
      if ((gZsEq && (gZsEq.commentaire || (gZsEq.photos && gZsEq.photos.length > 0))) || 
          (gZsCv && (gZsCv.commentaire || (gZsCv.photos && gZsCv.photos.length > 0)))) {
          
          docPdf.addPage();
          let y = 20;
          docPdf.setFillColor(33, 30, 26);
          docPdf.rect(14, y, 182, 10, 'F');
          docPdf.setTextColor(255, 255, 255);
          docPdf.setFont('helvetica', 'bold');
          docPdf.setFontSize(10);
          docPdf.text('BILAN GÉNÉRAL DE LA JOURNÉE', 18, y + 7);
          y += 16;
          
          if(gZsEq && gZsEq.commentaire || gZsCv && gZsCv.commentaire){
              docPdf.setFontSize(8);
              docPdf.setTextColor(80, 80, 80);
              if(enableEq && gZsEq && gZsEq.commentaire){
                  docPdf.text(`• Bilan Équipe : ${gZsEq.commentaire}`, 18, y);
                  y += 5;
              }
              if(gZsCv && gZsCv.commentaire){
                  const tag = enableEq ? 'Contrôleur' : 'Constat';
                  docPdf.text(`• Bilan ${tag} : ${gZsCv.commentaire}`, 18, y);
                  y += 5;
              }
          }

          const gAllEqPhotos = [];
          if(enableEq && gZsEq && gZsEq.photos) {
              for(const pid of gZsEq.photos) { const b = await getPhotoBase64(pid); if(b) gAllEqPhotos.push(b); }
          }
          const gAllCvPhotos = [];
          if(gZsCv && gZsCv.photos) {
              for(const pid of gZsCv.photos) { const b = await getPhotoBase64(pid); if(b) gAllCvPhotos.push(b); }
          }

          if(gAllEqPhotos.length > 0 || gAllCvPhotos.length > 0){
              let xPos = 18;
              for(const imgBase64 of gAllEqPhotos){
                  try {
                      if(y > 250){ docPdf.addPage(); y = 20; }
                      const imgProps = docPdf.getImageProperties(imgBase64);
                      let finalW = 55;
                      let finalH = (imgProps.height * finalW) / imgProps.width;
                      if(finalH > 38) { finalH = 38; finalW = (imgProps.width * finalH) / imgProps.height; }
                      const offsetX = xPos + (55 - finalW) / 2;
                      const offsetY = y + (38 - finalH) / 2;
                      docPdf.addImage(imgBase64, 'JPEG', offsetX, offsetY, finalW, finalH);
                      docPdf.setFillColor(...C_TEAL);
                      docPdf.rect(xPos, y + 38, 55, 6, 'F');
                      docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
                      docPdf.text(`ÉQUIPE`, xPos + 2, y + 42.5);
                      xPos += 58;
                      if(xPos > 140){ xPos = 18; y += 48; }
                  } catch(e){}
              }
              for(const imgBase64 of gAllCvPhotos){
                  try {
                      if(y > 250){ docPdf.addPage(); y = 20; }
                      const imgProps = docPdf.getImageProperties(imgBase64);
                      let finalW = 55;
                      let finalH = (imgProps.height * finalW) / imgProps.width;
                      if(finalH > 38) { finalH = 38; finalW = (imgProps.width * finalH) / imgProps.height; }
                      const offsetX = xPos + (55 - finalW) / 2;
                      const offsetY = y + (38 - finalH) / 2;
                      docPdf.addImage(imgBase64, 'JPEG', offsetX, offsetY, finalW, finalH);
                      docPdf.setFillColor(...C_AMBER);
                      docPdf.rect(xPos, y + 38, 55, 6, 'F');
                      docPdf.setFontSize(6.5); docPdf.setTextColor(255, 255, 255); docPdf.setFont('helvetica', 'bold');
                      docPdf.text(enableEq ? `CTRL` : `CONSTAT`, xPos + 2, y + 42.5);
                      xPos += 58;
                      if(xPos > 140){ xPos = 18; y += 48; }
                  } catch(e){}
              }
          }
      }
  }

  docPdf.setPage(1);
  docPdf.setFillColor(...(totalNok === 0 ? C_TEAL : C_RED));
  docPdf.roundedRect(14, 140, 182, 14, 3, 3, 'F');
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(10);
  
  const statusMsg = totalNok === 0 
    ? (enableEq ? 'BILAN CONTRÔLE : PRESTATION CONFORME — 0 NOK' : 'BILAN CONSTAT : CONFORME — 0 NOK')
    : (enableEq ? `BILAN CONTRÔLE : ${totalNok} NOK dont ${totalEcarts} écart(s)` : `BILAN CONSTAT : ${totalNok} NOK`);
  
  docPdf.text(statusMsg, 18, 149);

  docPdf.save(`Rapport_Global_${date}.pdf`);
}

async function generateGlobalPDF(){
  await generatePDFForDate(todayISO());
}

async function renderHistory(){
  clearRealtimeListeners();
  resetInactivityTimer();
  const userLang = (session && session.lang) ? session.lang : 'fr';
  const config = await getGlobalConfig();
  const enableEq = config.enableEquipe;

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(t('Historique des Prestations'), t('Consultation Archives'), config.appName)}
      <div class="back-link" id="backBtn">${t('← Retour aux zones')}</div>
      <div class="section" style="padding:16px;">
        <div class="field" style="margin-bottom:15px;">
          <label style="font-weight:600;font-size:13px;color:#211E1A;display:block;margin-bottom:6px;">${t('Sélectionner une date d\'archive :')}</label>
          <div style="display:flex;gap:8px;">
            <input type="date" id="histDateSelect" value="${todayISO()}" style="flex:1;padding:10px;border-radius:8px;border:1px solid #E7E1D6;font-size:14px;background:#fff;">
            <button class="btn amber small" id="generateHistPdfBtn" style="padding:8px 12px;white-space:nowrap;">${t('📄 Rapport PDF')}</button>
          </div>
        </div>
        <div id="histSummary" style="margin-bottom:20px;"></div>
        <div id="histContent">
          <div style="text-align:center;padding:30px;">
            <div class="loading-spinner"></div>
            <div style="font-size:12px;color:#6B655C;margin-top:10px;">${t('Chargement des données...')}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;
  const dateInput = document.getElementById('histDateSelect');
  const pdfBtn = document.getElementById('generateHistPdfBtn');

  pdfBtn.onclick = () => {
    generatePDFForDate(dateInput.value);
  };
  
  const loadHistoryDate = async (selectedDate) => {
    const summaryEl = document.getElementById('histSummary');
    const content = document.getElementById('histContent');
    content.innerHTML = `
      <div style="text-align:center;padding:30px;">
        <div class="loading-spinner"></div>
        <div style="font-size:12px;color:#6B655C;margin-top:10px;">${t('Chargement des données...')}</div>
      </div>
    `;
    summaryEl.innerHTML = '';
    
    let htmlContent = '';
    let summaryHtml = `
      <div style="background:#FAF8F3;border:1px solid #E7E1D6;border-radius:10px;padding:12px;margin-bottom:15px;">
        <div style="font-weight:700;font-size:12px;color:#C7791B;text-transform:uppercase;margin-bottom:8px;">${t('Sommaire par Zone')} (${fmtDate(selectedDate)})</div>
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
        
        let cvOk = (rCv.conforme === false) ? false : true;

        if(rEq.conforme !== undefined || rCv.conforme !== undefined) zoneChecked++;
        if(!cvOk) zoneNokCount++;
      });

      if(c) hasDataForDate = true;

      const translatedZoneName = await translateDynamicText(z.nom, userLang);

      summaryHtml += `
        <a href="#hist_zone_${z.id}" style="text-decoration:none;display:flex;justify-content:space-between;align-items:center;background:#fff;padding:8px 10px;border-radius:6px;border:1px solid #E7E1D6;color:#211E1A;font-size:12px;font-weight:600;">
          <span>• ${translatedZoneName}</span>
          <span style="font-size:10px;padding:2px 6px;border-radius:4px;color:#fff;background:${zoneNokCount > 0 ? '#B23A34' : (zoneChecked > 0 ? '#2B6E68' : '#6B655C')};">
            ${zoneNokCount > 0 ? `${zoneNokCount} NOK` : (zoneChecked > 0 ? t('Conforme') : t('Non saisi'))}
          </span>
        </a>
      `;

      if(c){
        htmlContent += `
          <div id="hist_zone_${z.id}" style="border:1px solid #E7E1D6;border-radius:12px;margin-bottom:20px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <div style="background:#211E1A;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-weight:700;font-size:14px;color:#F3E2C6;">${t('ZONE').toUpperCase()} : ${translatedZoneName.toUpperCase()}</div>
              <a href="#histSummary" style="color:#C7791B;font-size:11px;text-decoration:none;">↑ ${t('Sommaire')}</a>
            </div>

            <div style="padding:12px;">
        `;

        for(const p of activePoints){
          const rEq = (eq.reponses && eq.reponses[p.id]) || {};
          const rCv = (cv.reponses && cv.reponses[p.id]) || {};
          
          const eqPhotosIds = rEq.photos || [];
          const cvPhotosIds = rCv.photos || [];
          
          const eqPhotos = [];
          for(const pid of eqPhotosIds) {
              const b64 = await getPhotoBase64(pid);
              if(b64) eqPhotos.push(b64);
          }
          
          const cvPhotos = [];
          for(const pid of cvPhotosIds) {
              const b64 = await getPhotoBase64(pid);
              if(b64) cvPhotos.push(b64);
          }

          const eqOk = (!config.reqPhotoEq || eqPhotosIds.length > 0) ? (rEq.conforme !== false) : false;
          const cvOk = (rCv.conforme === false) ? false : true;

          const isFinalOk = (cvOk === true);
          const isRealEcart = enableEq ? (eqOk === true && cvOk === false) : false;

          const eqAgent = rEq.agentNom || eq.agentNom || t('Équipe');
          const eqTime = rEq.heure || eq.heure || '--:--';
          const cvCtrl = rCv.controleurNom || cv.controleurNom || (enableEq ? t('Contrôleur') : t('Constat'));
          const cvTime = rCv.heure || cv.heure || '--:--';

          const translatedLabel = await translateDynamicText(p.label, userLang);

          htmlContent += `
            <div style="border:1px solid ${isFinalOk ? '#2B6E68' : '#B23A34'};background:${isFinalOk ? '#DCEEEC' : '#FEF2F2'};padding:12px;border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;">
                <div style="font-weight:600;font-size:13.5px;color:#211E1A;flex:1;">${translatedLabel}</div>
                ${enableEq && isRealEcart ? `<span style="background:#B23A34;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;white-space:nowrap;">ÉCART / NOK</span>` : ''}
              </div>

              <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                ${enableEq ? `
                  <div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600;background:${eqOk?'#2B6E68':'#B23A34'};color:#fff;">
                    <span>${t('Équipe')} (${eqAgent} ${eqTime}) :</span>
                    <strong>${eqOk?'✓ OK':'✕ NOK'}</strong>
                  </div>
                  <div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600;background:${cvOk?'#2B6E68':'#B23A34'};color:#fff;">
                    <span>${t('Contrôleur')} (${cvCtrl} ${cvTime}) :</span>
                    <strong>${cvOk?'✓ OK':'✕ NOK'}</strong>
                  </div>
                ` : `
                  <div style="display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600;background:${cvOk?'#2B6E68':'#B23A34'};color:#fff;">
                    <span>${t('Constat')} (${cvCtrl} ${cvTime}) :</span>
                    <strong>${cvOk?'✓ OK':'✕ NOK'}</strong>
                  </div>
                `}
              </div>

              ${enableEq && rEq.commentaire ? `<div style="font-size:11px;color:#4A453E;margin-top:4px;">💬 <em>Obs. ${t('Équipe')} [${eqAgent} à ${eqTime}] :</em> "${rEq.commentaire}"</div>` : ''}
              ${rCv.commentaire ? `<div style="font-size:11px;color:#C7791B;margin-top:4px;">💬 <em>Obs. ${enableEq ? t('Contrôleur') : t('Constat')} [${cvCtrl} à ${cvTime}] :</em> "${rCv.commentaire}"</div>` : ''}

              ${((enableEq && eqPhotos.length) || cvPhotos.length) ? `
                <div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">
                  ${enableEq ? eqPhotos.map(pSrc => `
                    <div style="position:relative;flex-shrink:0;">
                      <img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo Équipe (${eqAgent} ${eqTime}) - ${translatedLabel}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">
                      <span style="position:absolute;bottom:0;left:0;right:0;background:#2B6E68;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">${eqAgent} (${eqTime})</span>
                    </div>
                  `).join('') : ''}

                  ${cvPhotos.map(pSrc => `
                    <div style="position:relative;flex-shrink:0;">
                      <img class="photo-thumb click-zoom" src="${pSrc}" data-title="Photo ${enableEq?'Contrôleur':'Constat'} (${cvCtrl} ${cvTime}) - ${translatedLabel}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #C7791B;cursor:pointer;">
                      <span style="position:absolute;bottom:0;left:0;right:0;background:#C7791B;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">${enableEq?'CTRL':'CONST'}: ${cvCtrl} (${cvTime})</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }
        
        // --- AFFICHAGE HISTORIQUE DU BILAN DE ZONE ---
        const zsId = 'zone_summary';
        const zsEq = eq.reponses ? eq.reponses[zsId] : null;
        const zsCv = cv.reponses ? cv.reponses[zsId] : null;

        if ((zsEq && (zsEq.commentaire || (zsEq.photos && zsEq.photos.length > 0))) || 
            (zsCv && (zsCv.commentaire || (zsCv.photos && zsCv.photos.length > 0)))) {
            
            htmlContent += `
              <div style="border:2px solid #C7791B;background:#FAF8F3;padding:12px;border-radius:8px;margin-bottom:10px;margin-top:20px;">
                <div style="font-weight:800;font-size:13.5px;color:#C7791B;margin-bottom:8px;text-transform:uppercase;">📝 ${t('Bilan de la zone')}</div>
                ${zsEq && zsEq.commentaire ? `<div style="font-size:11px;color:#2B6E68;margin-bottom:4px;font-style:italic;">💬 Obs. Équipe : "${zsEq.commentaire}"</div>` : ''}
                ${zsCv && zsCv.commentaire ? `<div style="font-size:11px;color:#C7791B;margin-bottom:4px;font-style:italic;">💬 Obs. ${enableEq?'Contrôleur':'Constat'} : "${zsCv.commentaire}"</div>` : ''}
            `;

            let hasPhotos = false;
            let photosHtml = '<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">';
            if(zsEq && zsEq.photos) {
                for(const pid of zsEq.photos) {
                    const b64 = await getPhotoBase64(pid);
                    if(b64) {
                        hasPhotos = true;
                        photosHtml += `
                          <div style="position:relative;flex-shrink:0;">
                            <img class="photo-thumb click-zoom" src="${b64}" data-title="Bilan Zone - Équipe" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">
                            <span style="position:absolute;bottom:0;left:0;right:0;background:#2B6E68;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">ÉQUIPE</span>
                          </div>
                        `;
                    }
                }
            }
            if(zsCv && zsCv.photos) {
                for(const pid of zsCv.photos) {
                    const b64 = await getPhotoBase64(pid);
                    if(b64) {
                        hasPhotos = true;
                        photosHtml += `
                          <div style="position:relative;flex-shrink:0;">
                            <img class="photo-thumb click-zoom" src="${b64}" data-title="Bilan Zone - Contrôleur" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #C7791B;cursor:pointer;">
                            <span style="position:absolute;bottom:0;left:0;right:0;background:#C7791B;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">${enableEq?'CTRL':'CONST'}</span>
                          </div>
                        `;
                    }
                }
            }
            photosHtml += '</div>';
            if(hasPhotos) htmlContent += photosHtml;
            htmlContent += `</div>`;
        }

        htmlContent += `</div></div>`;
      }
    }

    // --- AFFICHAGE HISTORIQUE DU BILAN GÉNÉRAL ---
    const globalId = `${selectedDate}__global`;
    let globalC = await idbGet('controles', globalId);
    if(navigator.onLine && !globalC){
        try {
            const doc = await db.collection('controles').doc(globalId).get();
            if(doc.exists) globalC = doc.data();
        } catch(e){}
    }

    if(globalC) {
        const gEq = globalC.passageEquipe || {};
        const gCv = globalC.contreVisite || {};
        const gZsEq = gEq.reponses ? gEq.reponses['zone_summary'] : null;
        const gZsCv = gCv.reponses ? gCv.reponses['zone_summary'] : null;

        if ((gZsEq && (gZsEq.commentaire || (gZsEq.photos && gZsEq.photos.length > 0))) || 
            (gZsCv && (gZsCv.commentaire || (gZsCv.photos && gZsCv.photos.length > 0)))) {
            
            htmlContent += `
              <div style="border:1px solid #E7E1D6;border-radius:12px;margin-bottom:20px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <div style="background:#211E1A;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
                  <div style="font-weight:700;font-size:14px;color:#F3E2C6;">📝 ${t('BILAN GÉNÉRAL DU JOUR')}</div>
                  <a href="#histSummary" style="color:#C7791B;font-size:11px;text-decoration:none;">↑ ${t('Sommaire')}</a>
                </div>
                <div style="padding:12px;">
            `;

            if(gZsEq && gZsEq.commentaire) htmlContent += `<div style="font-size:11px;color:#2B6E68;margin-bottom:4px;font-style:italic;">💬 Obs. Équipe : "${gZsEq.commentaire}"</div>`;
            if(gZsCv && gZsCv.commentaire) htmlContent += `<div style="font-size:11px;color:#C7791B;margin-bottom:4px;font-style:italic;">💬 Obs. ${enableEq?'Contrôleur':'Constat'} : "${gZsCv.commentaire}"</div>`;

            let hasPhotos = false;
            let photosHtml = '<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">';
            if(gZsEq && gZsEq.photos) {
                for(const pid of gZsEq.photos) {
                    const b64 = await getPhotoBase64(pid);
                    if(b64) {
                        hasPhotos = true;
                        photosHtml += `
                          <div style="position:relative;flex-shrink:0;">
                            <img class="photo-thumb click-zoom" src="${b64}" data-title="Bilan Général - Équipe" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #2B6E68;cursor:pointer;">
                            <span style="position:absolute;bottom:0;left:0;right:0;background:#2B6E68;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">ÉQUIPE</span>
                          </div>
                        `;
                    }
                }
            }
            if(gZsCv && gZsCv.photos) {
                for(const pid of gZsCv.photos) {
                    const b64 = await getPhotoBase64(pid);
                    if(b64) {
                        hasPhotos = true;
                        photosHtml += `
                          <div style="position:relative;flex-shrink:0;">
                            <img class="photo-thumb click-zoom" src="${b64}" data-title="Bilan Général - Contrôleur" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #C7791B;cursor:pointer;">
                            <span style="position:absolute;bottom:0;left:0;right:0;background:#C7791B;color:#fff;font-size:6.5px;padding:1px 2px;text-align:center;font-weight:bold;white-space:nowrap;overflow:hidden;border-bottom-left-radius:4px;border-bottom-right-radius:4px;">${enableEq?'CTRL':'CONST'}</span>
                          </div>
                        `;
                    }
                }
            }
            photosHtml += '</div>';
            if(hasPhotos) htmlContent += photosHtml;

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
  await loadHistoryDate(todayISO());
}

/* =========================================================================
   ÉCRAN STATISTIQUES
   ========================================================================= */
async function renderStats(){
  clearRealtimeListeners();
  resetInactivityTimer();
  const userLang = (session && session.lang) ? session.lang : 'fr';
  const config = await getGlobalConfig();
  const enableEq = config.enableEquipe;

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(t('Suivi des Anomalies (NOK)'), t('Tableau de Bord'), config.appName)}
      <div class="back-link" id="backBtn">${t('← Retour aux zones')}</div>
      <div class="section" style="padding:16px;">
        <div class="field" style="margin-bottom:15px;">
          <label style="font-weight:600;font-size:13px;color:#211E1A;display:block;margin-bottom:6px;">${t('Contexte de comparaison :')}</label>
          <select id="statsContextSelect" style="width:100%;padding:10px;border-radius:8px;border:1px solid #E7E1D6;font-size:14px;background:#fff;">
            <option value="prev_week">${t('7 derniers jours vs 7 jours précédents')}</option>
            <option value="target">${t('7 derniers jours vs Seuil Cible (Max 5% NOK)')}</option>
          </select>
        </div>
        <div id="statsDashboard">
          <div style="text-align:center;padding:30px;">
            <div class="loading-spinner"></div>
            <div style="font-size:12px;color:#6B655C;margin-top:10px;">${t('Chargement…')}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;
  const contextSelect = document.getElementById('statsContextSelect');

  let allControles = await idbGetAll('controles') || [];
  let dynamicTasks = await idbGetAll('task_schedule') || [];

  if(navigator.onLine){
    try {
      const snap = await db.collection('controles').get();
      allControles = snap.docs.map(d=>d.data());
    } catch(e){}
  }

  const computePeriodStats = (startDateIso, endDateIso) => {
    let totalChecked = 0, nokCount = 0, ecartsCount = 0;
    let zoneBreakdown = {};
    let itemStatsMap = {};

    ZONES.forEach(z => { zoneBreakdown[z.id] = { total:0, nok:0, nom:z.nom }; });

    (allControles || []).filter(c => c && c.date >= startDateIso && c.date <= endDateIso).forEach(c => {
      const eq = (c.passageEquipe && c.passageEquipe.reponses) || {};
      const cv = (c.contreVisite && c.contreVisite.reponses) || {};

      const allKeys = new Set([...Object.keys(eq), ...Object.keys(cv)]);

      allKeys.forEach(pId => {
        if(pId === 'zone_summary') return; 

        const rEq = eq[pId];
        const rCv = cv[pId];

        const eqAnswered = rEq && typeof rEq === 'object' && typeof rEq.conforme === 'boolean';
        const cvAnswered = rCv && typeof rCv === 'object' && typeof rCv.conforme === 'boolean';

        if(eqAnswered || cvAnswered){
          totalChecked++;
          if(zoneBreakdown[c.zoneId]) zoneBreakdown[c.zoneId].total++;
          if(!itemStatsMap[pId]) itemStatsMap[pId] = { checked: 0, nok: 0 };
          itemStatsMap[pId].checked++;

          const eqOk = (eqAnswered && rEq.conforme !== false && (!config.reqPhotoEq || (rEq.photos && rEq.photos.length > 0)));
          const cvOk = (cvAnswered ? rCv.conforme !== false : true);

          let isNok = false;
          let isEcart = false;

          if (enableEq) {
              if (cvAnswered) {
                  isNok = !cvOk;
                  if (eqAnswered && eqOk && !cvOk) {
                      isEcart = true; // Le contrôleur contredit l'équipe
                  }
              } else if (eqAnswered) {
                  isNok = !eqOk; // Si le contrôleur n'a pas répondu, la note de l'équipe fait foi
              }
          } else {
              // Mode "Constat" simple
              if (cvAnswered) {
                  isNok = !cvOk;
              }
          }

          if(isNok){
            nokCount++;
            if(zoneBreakdown[c.zoneId]) zoneBreakdown[c.zoneId].nok++;
            itemStatsMap[pId].nok++;
          }

          if(isEcart){
            ecartsCount++;
          }
        }
      });
    });

    const nokRate = totalChecked ? Math.round((nokCount / totalChecked) * 100) : 0;

    return { totalChecked, nokCount, ecartsCount, nokRate, zoneBreakdown, itemStatsMap };
  };

  const updateStatsUI = async () => {
    try {
      const today = new Date();
      const d7 = new Date(today); d7.setDate(d7.getDate() - 6);
      const d14 = new Date(today); d14.setDate(d14.getDate() - 13);

      const currentStats = computePeriodStats(d7.toISOString().slice(0,10), todayISO());
      const prevStats = computePeriodStats(d14.toISOString().slice(0,10), d7.toISOString().slice(0,10));

      const mode = contextSelect.value;
      const refNokRate = mode === 'target' ? 5 : prevStats.nokRate;
      const refLabel = mode === 'target' ? t('vs Cible Max (5%)') : t('vs Semaine précédente');

      const deltaNok = currentStats.nokRate - refNokRate;

      let rawTopItems = Object.keys(currentStats.itemStatsMap).map(id => {
        let label = id;
        
        if(LEGACY_TASKS_MAP[id]){
          label = LEGACY_TASKS_MAP[id];
        } else {
          Object.keys(DEFAULT_POINTS).forEach(zk => {
            if (DEFAULT_POINTS[zk]) {
                const found = DEFAULT_POINTS[zk].find(pt => pt && pt.id === id);
                if(found && found.label) label = found.label;
            }
          });

          if (Array.isArray(dynamicTasks)) {
              const dynFound = dynamicTasks.find(dt => dt && (dt.taskId === id || dt.id === id));
              if(dynFound && dynFound.label) label = dynFound.label;
          }
        }

        const stat = currentStats.itemStatsMap[id];
        const rate = stat.checked ? Math.round((stat.nok / stat.checked) * 100) : 0;

        return { id, label, checked: stat.checked, nok: stat.nok, rate };
      }).filter(item => item.nok > 0).sort((a,b) => b.nok - a.nok);

      let topNokItems = [];
      for(const item of rawTopItems){
        const transLabel = await translateDynamicText(item.label, userLang);
        topNokItems.push({ id: item.id, label: transLabel, checked: item.checked, nok: item.nok, rate: item.rate });
      }

      let html = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
          <div style="background:#FAF8F3;padding:14px;border-radius:10px;border:1px solid #E7E1D6;text-align:center;">
            <div style="font-size:10px;color:#6B655C;text-transform:uppercase;font-weight:700;">${t('Taux d\'Anomalies (NOK)')}</div>
            <div style="font-size:26px;font-weight:800;color:#B23A34;margin-top:2px;">${currentStats.nokRate}%</div>
            <div style="font-size:11px;font-weight:600;margin-top:2px;color:${deltaNok<=0?'#2B6E68':'#B23A34'};">
              ${deltaNok<=0?'▼ ':'▲ +'}${deltaNok}% ${refLabel}
            </div>
          </div>

          <div style="background:#FAF8F3;padding:14px;border-radius:10px;border:1px solid #E7E1D6;text-align:center;">
            <div style="font-size:10px;color:#6B655C;text-transform:uppercase;font-weight:700;">${t('Anomalies Relevées')}</div>
            <div style="font-size:20px;font-weight:800;color:#B23A34;margin-top:4px;">${currentStats.nokCount} NOK</div>
            ${enableEq ? `<div style="font-size:12px;color:#6B655C;margin-top:2px;font-weight:600;">${t('dont')} ${currentStats.ecartsCount} ${t('écart(s)')}</div>` : ''}
          </div>
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;border-radius:10px;padding:14px;margin-bottom:15px;">
          <div class="dash-chart-title" style="font-weight:700;font-size:13px;color:#211E1A;">📊 ${t('Analyse Comparative des Défauts (NOK)')}</div>
          <div style="display:flex;align-items:flex-end;justify-style:space-around;height:120px;border-bottom:2px solid #E7E1D6;padding-bottom:5px;">
            <div style="display:flex;flex-direction:column;align-items:center;width:40%;">
              <span style="font-size:11px;font-weight:700;color:#B23A34;margin-bottom:4px;">${currentStats.nokRate}% NOK</span>
              <div style="width:100%;max-width:50px;background:#B23A34;height:${Math.min(80, Math.max(10, currentStats.nokRate * 0.8))}px;border-top-left-radius:6px;border-top-right-radius:6px;"></div>
              <span style="font-size:10px;color:#6B655C;margin-top:6px;font-weight:600;">${t('7j Actuels')}</span>
            </div>

            <div style="display:flex;flex-direction:column;align-items:center;width:40%;">
              <span style="font-size:11px;font-weight:700;color:#C7791B;margin-bottom:4px;">${refNokRate}% NOK</span>
              <div style="width:100%;max-width:50px;background:#C7791B;height:${Math.min(80, Math.max(10, refNokRate * 0.8))}px;border-top-left-radius:6px;border-top-right-radius:6px;"></div>
              <span style="font-size:10px;color:#6B655C;margin-top:6px;font-weight:600;">${mode==='target'?t('Seuil Cible'):t('7j Précédents')}</span>
            </div>
          </div>
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;border-radius:10px;padding:14px;margin-bottom:15px;">
          <div style="font-weight:700;font-size:13px;color:#211E1A;margin-bottom:10px;">${t('Répartition des NOK par Zone (7 derniers jours)')}</div>
      `;

      for(const z of ZONES){
        const zb = currentStats.zoneBreakdown[z.id];
        const zNokRate = zb.total ? Math.round((zb.nok / zb.total) * 100) : 0;
        const translatedZoneName = await translateDynamicText(z.nom, userLang);

        html += `
          <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
              <span style="font-weight:600;color:#211E1A;">${translatedZoneName}</span>
              <strong style="color:${zNokRate===0?'#2B6E68':'#B23A34'};">${zNokRate}% NOK (${zb.nok}/${zb.total})</strong>
            </div>
            <div style="background:#E7E1D6;height:8px;border-radius:4px;overflow:hidden;">
              <div style="background:${zNokRate===0?'#2B6E68':'#B23A34'};width:${zNokRate}%;height:100%;"></div>
            </div>
          </div>
        `;
      }

      html += `
        </div>

        <div style="background:#fff;border:1px solid #E7E1D6;border-radius:10px;padding:14px;">
          <div style="font-weight:700;font-size:13px;color:#B23A34;margin-bottom:14px;">⚠️ ${t('Analyse par Tâche (Tâches posant problème)')}</div>
          ${topNokItems.length > 0 ? topNokItems.map(te => `
            <div style="margin-bottom: 12px;">
               <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:11px; margin-bottom:4px;">
                   <span style="font-weight:600; color:#211E1A; line-height:1.2; flex:1; padding-right:10px;">${te.label}</span>
                   <span style="font-weight:700; color:#B23A34; white-space:nowrap;">${te.rate}% (${te.nok}/${te.checked})</span>
               </div>
               <div style="background:#FEF2F2; height:6px; border-radius:3px; overflow:hidden;">
                   <div style="background:#B23A34; width:${te.rate}%; height:100%; border-radius:3px;"></div>
               </div>
            </div>
          `).join('') : `<div style="font-size:12px;color:#2B6E68;font-weight:600;">${t('Aucune anomalie NOK relevée sur cette période ! 🎉')}</div>`}
        </div>
      `;

      document.getElementById('statsDashboard').innerHTML = html;
    } catch (err) {
      console.error("Dashboard error:", err);
      document.getElementById('statsDashboard').innerHTML = `<div style="color:#B23A34; text-align:center; padding:20px;">Impossible de charger les statistiques. Données anciennes ou corrompues.</div>`;
    }
  };

  contextSelect.onchange = updateStatsUI;
  await updateStatsUI();
}

/* =========================================================================
   ADMINISTRATION DU PLANNING & DE L'ÉDITION DES TÂCHES
   ========================================================================= */
async function renderTaskAdmin(){
  clearRealtimeListeners();
  resetInactivityTimer();
  const allMap = await getAllTasksMap(true);
  const config = await getGlobalConfig();

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
      zonePoints.forEach((p, index) => {
        const currentFreq = p.freq || 'J';
        const currentVal = p.targetValue || 1;
        const isFirst = index === 0;
        const isLast = index === zonePoints.length - 1;

        tasksHtml += `
          <div class="task-admin-card" data-task-id="${p.id}" data-zone-id="${z.id}" data-order="${p.order}" style="background:#fff;border:1px solid #E7E1D6;padding:12px;border-radius:8px;margin-top:10px;">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
              <div style="display:flex;flex-direction:column;gap:2px;">
                <button class="btn ghost small move-up-btn" data-task-id="${p.id}" data-zone-id="${z.id}" style="padding:0 4px;font-size:12px;height:16px;line-height:1;min-width:auto;opacity:${isFirst?'0.2':'1'}" ${isFirst?'disabled':''}>▲</button>
                <button class="btn ghost small move-down-btn" data-task-id="${p.id}" data-zone-id="${z.id}" style="padding:0 4px;font-size:12px;height:16px;line-height:1;min-width:auto;opacity:${isLast?'0.2':'1'}" ${isLast?'disabled':''}>▼</button>
              </div>
              <input type="text" class="task-label-input" value="${p.label.replace(/"/g, '&quot;')}" style="flex:1;padding:8px;border-radius:6px;border:1px solid #E7E1D6;font-size:13px;font-weight:600;color:#211E1A;">
              <button class="btn danger small delete-task-btn" data-task-id="${p.id}" data-zone-id="${z.id}" style="padding:6px 10px;">Suppr.</button>
            </div>
            
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-left:24px;">
              <div style="flex:1;min-width:130px;">
                <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:2px;">Fréquence :</label>
                <select class="freq-select" data-task="${p.id}" style="width:100%;padding:6px;border-radius:6px;border:1px solid #E7E1D6;font-size:12px;">
                  <option value="J" ${currentFreq==='J'?'selected':''}>Quotidien</option>
                  <option value="H" ${currentFreq==='H'?'selected':''}>Hebdomadaire</option>
                  <option value="M" ${currentFreq==='M'?'selected':''}>Mensuel</option>
                </select>
              </div>

              <div class="target-val-box" id="target_box_${p.id}" style="flex:1;min-width:140px;display:${currentFreq==='J'?'none':'block'};">
                <label style="font-size:11px;color:#6B655C;display:block;margin-bottom:2px;">Jour :</label>
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
      ${topbarHtml('Planning & Référentiel', 'Gestion des Tâches', config.appName)}
      <div class="back-link" id="backBtn">${t('← Retour aux zones')}</div>
      <div class="section" style="padding:16px;">
        <div class="section-note">Réordonnez les tâches avec les flèches, modifiez-les, ajoutez ou supprimez-les.<br><strong style="color:#2B6E68;">✓ Sauvegarde automatique intégrée.</strong></div>
        ${tasksHtml}
        <button class="btn amber block" id="saveTasksBtn" style="margin-top:20px;margin-bottom:20px;">Terminer et Retourner aux Zones</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').onclick = goToZones;

  // --- 1. SAUVEGARDE SILENCIEUSE ---
  const saveSingleCard = async (card) => {
    const taskId = card.dataset.taskId;
    const zoneId = card.dataset.zoneId;
    const order = parseInt(card.dataset.order) || 0;
    const label = card.querySelector('.task-label-input').value.trim();
    const freq = card.querySelector('.freq-select').value;
    let targetValue = 1;

    if(freq === 'H'){
      targetValue = parseInt(card.querySelector('.val-select-hebdo').value);
    } else if(freq === 'M'){
      targetValue = parseInt(card.querySelector('.val-input-mensuel').value) || 1;
    }

    const data = { taskId, zoneId, label: label || 'Tâche sans nom', freq, targetValue, order, deleted: false };
    await pushToCloud('task_schedule', taskId, data);
  };

  const saveAllCards = async () => {
    for(const card of document.querySelectorAll('.task-admin-card')){
      await saveSingleCard(card);
    }
  };

  // --- 2. LOGIQUE DE RÉARRANGEMENT (HAUT / BAS) ---
  const reorderTasks = async (taskId, zoneId, direction) => {
    await saveAllCards();
    const currentMap = await getAllTasksMap();
    let zoneTasks = currentMap[zoneId];
    const idx = zoneTasks.findIndex(t => t.id === taskId);
    
    if (direction === 'up' && idx > 0) {
      [zoneTasks[idx], zoneTasks[idx - 1]] = [zoneTasks[idx - 1], zoneTasks[idx]];
    } else if (direction === 'down' && idx < zoneTasks.length - 1) {
      [zoneTasks[idx], zoneTasks[idx + 1]] = [zoneTasks[idx + 1], zoneTasks[idx]];
    } else {
      return;
    }

    for (let i = 0; i < zoneTasks.length; i++) {
      const t = zoneTasks[i];
      let existing = await idbGet('task_schedule', t.id) || { taskId: t.id, zoneId: zoneId, label: t.label, freq: t.freq, targetValue: t.targetValue, deleted: false };
      existing.order = i;
      await pushToCloud('task_schedule', t.id, existing);
    }
    
    renderTaskAdmin();
  };

  document.querySelectorAll('.move-up-btn').forEach(btn => {
    btn.onclick = () => reorderTasks(btn.dataset.taskId, btn.dataset.zoneId, 'up');
  });
  document.querySelectorAll('.move-down-btn').forEach(btn => {
    btn.onclick = () => reorderTasks(btn.dataset.taskId, btn.dataset.zoneId, 'down');
  });

  // --- 3. DÉCLENCHEURS AUTO-SAVE ---
  document.querySelectorAll('.task-admin-card').forEach(card => {
    const labelInput = card.querySelector('.task-label-input');
    const freqSelect = card.querySelector('.freq-select');
    const hebdoSelect = card.querySelector('.val-select-hebdo');
    const mensuelInput = card.querySelector('.val-input-mensuel');

    let debounceTimer;
    const triggerSave = () => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => saveSingleCard(card), 600); };

    labelInput.addEventListener('input', triggerSave);
    mensuelInput.addEventListener('input', triggerSave);
    freqSelect.addEventListener('change', () => saveSingleCard(card));
    hebdoSelect.addEventListener('change', () => saveSingleCard(card));
  });

  // --- 4. AFFICHAGE CONDITIONNEL DES FRÉQUENCES ---
  document.querySelectorAll('.freq-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const taskId = sel.dataset.task;
      const targetBox = document.getElementById(`target_box_${taskId}`);
      if(sel.value === 'J'){
        targetBox.style.display = 'none';
      } else if(sel.value === 'H'){
        targetBox.style.display = 'block';
        targetBox.querySelector('.val-select-hebdo').style.display = 'block';
        targetBox.querySelector('.val-input-mensuel-wrap').style.display = 'none';
      } else if(sel.value === 'M'){
        targetBox.style.display = 'block';
        targetBox.querySelector('.val-select-hebdo').style.display = 'none';
        targetBox.querySelector('.val-input-mensuel-wrap').style.display = 'flex';
      }
    });
  });

  // --- 5. AJOUT / SUPPRESSION ---
  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.onclick = async () => {
      await saveAllCards();
      const zoneId = btn.dataset.zone;
      const label = prompt("Nom de la nouvelle tâche :");
      if(!label || !label.trim()) return;

      const newTaskId = uid(`task_${zoneId}`);
      const newOrder = allMap[zoneId] ? allMap[zoneId].length : 0;
      
      await pushToCloud('task_schedule', newTaskId, {
        taskId: newTaskId, zoneId: zoneId, label: label.trim(),
        freq: 'J', targetValue: 1, order: newOrder, deleted: false
      });
      toast('Tâche ajoutée !');
      renderTaskAdmin();
    };
  });

  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.onclick = async () => {
      if(!confirm("Supprimer définitivement cette tâche ?")) return;
      await saveAllCards();

      await pushToCloud('task_schedule', btn.dataset.taskId, {
        taskId: btn.dataset.taskId, zoneId: btn.dataset.zoneId, deleted: true
      });
      toast('Tâche supprimée !');
      renderTaskAdmin();
    };
  });

  // --- 6. BOUTON DE FIN ---
  document.getElementById('saveTasksBtn').onclick = async () => {
    await saveAllCards();
    goToZones();
  };
}

/* =========================================================================
   ADMINISTRATION UTILISATEURS
   ========================================================================= */
async function renderAgentsAdmin(){
  clearRealtimeListeners();
  resetInactivityTimer();
  const config = await getGlobalConfig();
  
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Gestion Utilisateurs', 'Cloud & Local', config.appName)}
      <div class="back-link" id="backBtn">${t('← Retour aux zones')}</div>
      <div class="section">
        <div id="agentsList">
          <div style="text-align:center;padding:30px;">
            <div class="loading-spinner"></div>
            <div style="font-size:12px;color:#6B655C;margin-top:10px;">${t('Chargement…')}</div>
          </div>
        </div>
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

  const controleurs = agents.filter(a => a.role === 'controleur');
  const equipe = agents.filter(a => a.role === 'agent');

  const renderRow = (a) => `
    <div class="agent-row" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #E7E1D6;">
      <div>
        <div class="agent-name" style="font-weight:600;display:flex;align-items:center;gap:6px;">
          ${a.nom} 
          ${a.isAdmin ? '<span style="background:#211E1A;color:#F3E2C6;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold;text-transform:uppercase;">Admin</span>' : ''}
        </div>
        <div class="agent-meta" style="font-size:12px;color:#6B655C;margin-top:2px;">PIN : <strong>${a.pin}</strong> · Langue : <strong>${SUPPORTED_LANGUAGES[a.lang||'fr']||'🇫🇷 Français'}</strong></div>
      </div>
      <div class="agent-actions" style="display:flex;gap:6px;">
        <button class="btn ghost small" data-edit="${a.id}">Modifier</button>
        <button class="btn danger small" data-del="${a.id}">Suppr.</button>
      </div>
    </div>
  `;

  let html = '';
  
  if(controleurs.length > 0) {
    html += `<div style="font-weight:800;font-size:11px;color:#C7791B;margin-top:10px;margin-bottom:5px;border-bottom:2px solid #C7791B;padding-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Contrôleurs</div>`;
    html += controleurs.map(renderRow).join('');
  }

  if(equipe.length > 0) {
    html += `<div style="font-weight:800;font-size:11px;color:#2B6E68;margin-top:20px;margin-bottom:5px;border-bottom:2px solid #2B6E68;padding-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Équipe Nettoyage</div>`;
    html += equipe.map(renderRow).join('');
  }

  el.innerHTML = html;

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

async function openAgentModal(existing){
  const allAgents = await idbGetAll('agents');
  const hasAdmin = allAgents.some(a => a.isAdmin === true);
  
  const canAssignAdmin = (session && session.isAdmin) || (session && session.agentId === 'admin_temp') || !hasAdmin;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const langOptions = Object.keys(SUPPORTED_LANGUAGES).map(code => `
    <option value="${code}" ${(!existing && code==='fr') || (existing && existing.lang===code) ? 'selected' : ''}>${SUPPORTED_LANGUAGES[code]}</option>
  `).join('');

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
      <div class="field" style="margin-top:10px;"><label>Langue de l'interface</label>
        <select id="am_lang">
          ${langOptions}
        </select>
      </div>
      ${canAssignAdmin ? `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; padding-top:10px; border-top:1px dashed #E7E1D6;">
        <label style="font-size:12px; font-weight:600; color:#211E1A; margin:0;">Accès Super-Administrateur</label>
        <input type="checkbox" id="am_isAdmin" ${existing && existing.isAdmin ? 'checked' : ''} style="width:18px;height:18px;accent-color:#C7791B;cursor:pointer;">
      </div>
      ` : ''}
      <div style="display:flex;gap:10px;margin-top:20px;">
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
    const lang = document.getElementById('am_lang').value;
    
    const isAdminCheckbox = document.getElementById('am_isAdmin');
    const isAdmin = isAdminCheckbox ? isAdminCheckbox.checked : (existing ? existing.isAdmin : false);

    if(!nom || !/^\d{4}$/.test(pin)){ toast('Saisissez un nom et un PIN à 4 chiffres'); return; }
    
    const id = existing ? existing.id : uid('agent');
    const agentData = { id, nom, pin, role, lang, isAdmin, actif:true };
    
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
  try {
    renderLogin();
  } catch(e) {
    document.getElementById('app-root').innerHTML = '<div style="padding:20px;text-align:center;">Démarrage... Veuillez patienter.</div>';
    setTimeout(renderLogin, 1000);
  }
})();

})();
