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

const EMAILJS_PUBLIC_KEY  = 'À_REMPLACER';
const EMAILJS_SERVICE_ID  = 'À_REMPLACER';
const EMAILJS_TEMPLATE_ID = 'À_REMPLACER';
const RAPPORT_DESTINATAIRE = 'toi@mcdcaen.com';

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================================================================
   RÉFÉRENTIEL CONTRAT SASU SOAN
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

const DB_NAME = 'controle-nettoyage';
const DB_VERSION = 3;
let dbPromise = null;

function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('controles')) db.createObjectStore('controles', { keyPath:'id' });
      if(!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath:'id' });
      if(!db.objectStoreNames.contains('agents')) db.createObjectStore('agents', { keyPath:'id' });
      if(!db.objectStoreNames.contains('config')) db.createObjectStore('config', { keyPath:'id' });
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

let session = null;
let currentPin = '';
let pendingRole = 'agent';
let activeZoneId = null;
let activeControleId = null;
let activeMode = 'equipe';

const root = document.getElementById('app-root');

function todayISO(){ return new Date().toISOString().slice(0,10); }
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
    <button class="pv-close">✕</button>
    <img class="pv-img" src="${src}">
  `;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop || e.target.classList.contains('pv-close')) backdrop.remove(); });
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
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function getConfigSchedule(){
  let cfg = await idbGet('config', 'schedule');
  if(!cfg){
    cfg = { id:'schedule', hebdoDay:1, mensuelDate:1 }; // Par défaut : Lundi et 1er du mois
    await idbPut('config', cfg);
  }
  return cfg;
}

async function getPointsForToday(zoneId, dateIso){
  const cfg = await getConfigSchedule();
  const d = new Date(dateIso);
  const currentDay = d.getDay(); // 0=Dim, 1=Lun...
  const currentDate = d.getDate();

  const allPoints = POINTS[zoneId] || [];
  return allPoints.filter(p=>{
    if(p.freq==='J') return true;
    if(p.freq==='H' && currentDay === Number(cfg.hebdoDay)) return true;
    if(p.freq==='M' && currentDate === Number(cfg.mensuelDate)) return true;
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
        <button class="btn ghost small block" id="bypassBtn" style="margin-top:15px;">🔓 Connexion Secours Admin</button>
      </div>
    </div>
  `;
  root.querySelectorAll('.role-btn').forEach(b=>{
    b.addEventListener('click', ()=>{ pendingRole=b.dataset.role; currentPin=''; renderLogin(); });
  });
  renderPinDots();
  renderPinPad();

  document.getElementById('bypassBtn').addEventListener('click', ()=>{
    session = { role: 'controleur', agentId: 'admin_temp', nom: 'Admin Secours' };
    goToZones();
  });
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
    btn.addEventListener('click', ()=>onPinKey(btn.dataset.key));
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
  const agents = await idbGetAll('agents');
  const match = agents.find(a=>a.pin===currentPin && a.role===pendingRole && a.actif!==false);
  if(match){
    session = { role:pendingRole, agentId:match.id, nom:match.nom };
    currentPin=''; goToZones();
  } else {
    const errEl = document.getElementById('pinError');
    if(errEl) errEl.textContent = 'Code incorrect'; currentPin=''; setTimeout(renderPinDots,150);
  }
}

async function goToZones(){ activeZoneId=null; await renderZones(); }

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
      ${session.role==='controleur' ? '<button class="btn ghost block" id="configBtn" style="margin-bottom:10px;">⚙️ Planning Tâches Hebdo/Mensuel</button>' : ''}
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
    card.addEventListener('click', ()=>{
      activeZoneId = card.dataset.zone;
      activeControleId = `${date}__${activeZoneId}`;
      activeMode = session.role==='agent' ? 'equipe' : 'contreVisite';
      renderControle();
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', ()=>{ session=null; currentPin=''; renderLogin(); });
  const cfgBtn = document.getElementById('configBtn');
  if(cfgBtn) cfgBtn.addEventListener('click', renderScheduleConfig);
}

async function renderControle(){
  const date = todayISO();
  let c = await idbGet('controles', activeControleId) || {
    id: activeControleId, zoneId: activeZoneId, date,
    passageEquipe: { agentNom:null, heure:null, reponses:{} },
    contreVisite:  { controleurNom:null, heure:null, reponses:{} }
  };

  const zone = ZONES.find(z=>z.id===activeZoneId);
  const activePoints = await getPointsForToday(activeZoneId, date);
  const isContreVisite = activeMode==='contreVisite';
  const branch = isContreVisite ? c.contreVisite : c.passageEquipe;

  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml(zone.nom, isContreVisite ? 'Contre-visite Contrôleur' : 'Réalisation Prestation')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div id="pointsList"></div>
        <button class="btn amber block" id="saveBtn" style="margin-top:12px;">Enregistrer le rapport</button>
        <button class="btn ghost block" id="pdfBtn" style="margin-top:8px;">📄 Générer Rapport de Prestation PDF</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', goToZones);
  document.getElementById('pdfBtn').addEventListener('click', ()=>generateControlePDF(c, activePoints));

  const listEl = document.getElementById('pointsList');
  listEl.innerHTML = activePoints.map(p=>{
    const r = branch.reponses[p.id] || { conforme:null, photos:[], commentaire:'' };
    const photos = r.photos || [];
    return `
      <div class="point-item" data-point="${p.id}">
        <div class="point-head">
          <div class="point-label">${p.label} <small>(${p.freq==='J'?'Jour':(p.freq==='H'?'Hebdo':'Mensuel')})</small></div>
          <div class="point-toggle">
            <button class="toggle-btn conforme ${r.conforme===true?'active':''}" data-val="true">✓ OK</button>
            <button class="toggle-btn non-conforme ${r.conforme===false?'active':''}" data-val="false">✕ NOK</button>
          </div>
        </div>
        <div class="point-photo-row" id="photos_${p.id}">
          ${photos.map(pSrc=>`<img class="photo-thumb" src="${pSrc}">`).join('')}
          <label class="photo-btn">
            📷 + Ajouter une photo
            <input type="file" accept="image/*" capture="environment" style="display:none;" data-photo-input>
          </label>
        </div>
        <textarea class="point-comment" placeholder="Remarques / Observations">${r.commentaire||''}</textarea>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.point-item').forEach(item=>{
    const pId = item.dataset.point;
    if(!branch.reponses[pId]) branch.reponses[pId] = { conforme:null, photos:[], commentaire:'' };
    const r = branch.reponses[pId];

    item.querySelectorAll('.toggle-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        r.conforme = btn.dataset.val==='true';
        item.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const fileInput = item.querySelector('[data-photo-input]');
    fileInput.addEventListener('change', async ()=>{
      if(!fileInput.files.length) return;
      const dataUrl = await fileToResizedBase64(fileInput.files[0], 800);
      r.photos = r.photos || [];
      r.photos.push(dataUrl);
      
      const newImg = document.createElement('img');
      newImg.className = 'photo-thumb';
      newImg.src = dataUrl;
      item.querySelector('.point-photo-row').insertBefore(newImg, item.querySelector('.photo-btn'));
    });

    item.querySelector('.point-comment').addEventListener('input', (e)=>{
      r.commentaire = e.target.value;
    });
  });

  document.getElementById('saveBtn').addEventListener('click', async ()=>{
    branch.heure = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
    if(isContreVisite) branch.controleurNom = session.nom;
    else branch.agentNom = session.nom;

    await idbPut('controles', c);
    toast('Prestation enregistrée avec succès !');
    goToZones();
  });
}

async function renderScheduleConfig(){
  const cfg = await getConfigSchedule();
  root.innerHTML = `
    <div class="wrap">
      ${topbarHtml('Planning Tâches', 'Configuration')}
      <div class="back-link" id="backBtn">← Retour aux zones</div>
      <div class="section">
        <div class="field">
          <label>Jour d'exécution des tâches HEBDOMADAIRES</label>
          <select id="cfg_hebdo">
            <option value="1" ${cfg.hebdoDay==1?'selected':''}>Lundi</option>
            <option value="2" ${cfg.hebdoDay==2?'selected':''}>Mardi</option>
            <option value="3" ${cfg.hebdoDay==3?'selected':''}>Mercredi</option>
            <option value="4" ${cfg.hebdoDay==4?'selected':''}>Jeudi</option>
            <option value="5" ${cfg.hebdoDay==5?'selected':''}>Vendredi</option>
            <option value="6" ${cfg.hebdoDay==6?'selected':''}>Samedi</option>
            <option value="0" ${cfg.hebdoDay==0?'selected':''}>Dimanche</option>
          </select>
        </div>
        <div class="field">
          <label>Jour du mois des tâches MENSUELLES (1 à 28)</label>
          <input type="number" id="cfg_mensuel" min="1" max="28" value="${cfg.mensuelDate}">
        </div>
        <button class="btn amber block" id="saveCfgBtn" style="margin-top:15px;">Enregistrer la planification</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', goToZones);
  document.getElementById('saveCfgBtn').addEventListener('click', async ()=>{
    const hebdoDay = parseInt(document.getElementById('cfg_hebdo').value);
    const mensuelDate = parseInt(document.getElementById('cfg_mensuel').value);
    await idbPut('config', { id:'schedule', hebdoDay, mensuelDate });
    toast('Planning mis à jour');
    goToZones();
  });
}

function generateControlePDF(c, points){
  if(typeof window.jspdf === 'undefined'){ toast('jsPDF non disponible'); return; }
  const { jsPDF } = window.jspdf;
  const zone = ZONES.find(z=>z.id===c.zoneId);
  const docPdf = new jsPDF();
  let y = 20;

  docPdf.setFont('helvetica','bold'); docPdf.setFontSize(16);
  docPdf.text('SASU SOAN — Rapport de Prestation Nettoyage', 14, y); y+=8;
  docPdf.setFontSize(11); docPdf.setFont('helvetica','normal');
  docPdf.text(`Zone : ${zone?zone.nom:c.zoneId} | Date : ${fmtDate(c.date)}`, 14, y); y+=10;

  const branch = c.passageEquipe.agentNom ? c.passageEquipe : c.contreVisite;
  docPdf.setFont('helvetica','bold');
  docPdf.text(`Intervenant : ${branch.agentNom || branch.controleurNom || 'N/A'} à ${branch.heure||'--:--'}`, 14, y); y+=8;

  docPdf.setFont('helvetica','normal'); docPdf.setFontSize(9);
  points.forEach(p=>{
    const r = branch.reponses ? branch.reponses[p.id] : null;
    if(y > 270){ docPdf.addPage(); y = 20; }
    const status = r && r.conforme===true ? '[OK]' : (r && r.conforme===false ? '[NON CONFORME]' : '[NON FAIT]');
    docPdf.text(`${status} ${p.label}`, 14, y); y+=5;
    if(r && r.commentaire){ docPdf.text(`   Obs: ${r.commentaire}`, 18, y); y+=5; }
  });

  docPdf.save(`Rapport_SOAN_${c.zoneId}_${c.date}.pdf`);
}

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); });
}

(function init(){
  renderLogin();
})();

})();
