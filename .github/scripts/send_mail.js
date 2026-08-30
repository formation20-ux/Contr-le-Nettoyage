const https = require('https');

// Fonction pour lire Firebase
function fetchFirestore(docPath) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/controle-nettoyage/databases/(default)/documents/${docPath}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Fonction pour envoyer via l'API EmailJS
function sendEmailJS(toEmail, statusSummary, dateIso) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      service_id: "service_oxp40jn",
      template_id: "template_w9x0ucj",
      user_id: "WaGLuQh-wIKia0dGl",
      template_params: {
        to_email: toEmail,
        date: dateIso,
        bilan: statusSummary,
        message: `Rapport automatique quotidien généré par le serveur. Bilan : ${statusSummary}. Ouvrez l'application web pour consulter les archives en détail.`
      }
    });

    const options = {
      hostname: 'api.emailjs.com',
      path: '/api/v1.0/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // CORRECTION ICI : On calcule la taille en octets pour supporter les accents
        'Content-Length': Buffer.byteLength(payload) 
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Erreur EmailJS (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log("Lecture des paramètres Firestore...");
    const configDoc = await fetchFirestore('mail_schedule/global_config');
    
    if (!configDoc || !configDoc.fields) {
      console.log("Aucune configuration ou envoi désactivé.");
      return;
    }

    const fields = configDoc.fields;
    const active = fields.active ? fields.active.booleanValue : false;
    const time1 = fields.time1 ? fields.time1.stringValue : "18:00";
    
    let emails = [];
    if (fields.emails && fields.emails.arrayValue && fields.emails.arrayValue.values) {
      emails = fields.emails.arrayValue.values.map(v => v.stringValue);
    }

    if (!active || emails.length === 0) {
      console.log("Envoi automatique désactivé ou aucun destinataire.");
      return;
    }

    const now = new Date();
    const parisTime = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    console.log(`Heure actuelle (Paris) : ${parisTime} | Heure programmée : ${time1}`);

    const [currentHour, currentMin] = parisTime.split(':').map(Number);
    const [targetHour, targetMin] = time1.split(':').map(Number);

    const currentTotalMin = currentHour * 60 + currentMin;
    const targetTotalMin = targetHour * 60 + targetMin;
    const diff = currentTotalMin - targetTotalMin;

    const isManualTest = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

    if ((diff >= 0 && diff < 30) || isManualTest) {
      console.log("Déclenchement validé !");

      const todayISO = now.toISOString().slice(0, 10);
      const reportDoc = await fetchFirestore(`pdf_reports/report_${todayISO}`);
      
      let statusSummary = "Prestation enregistrée.";
      if (reportDoc && reportDoc.fields && reportDoc.fields.statusSummary) {
        statusSummary = reportDoc.fields.statusSummary.stringValue;
      }

      console.log(`Bilan du jour : ${statusSummary}`);

      // Envoi réel à chaque destinataire via EmailJS
      for (const email of emails) {
        try {
          await sendEmailJS(email, statusSummary, todayISO);
          console.log(`✓ E-mail envoyé avec succès à ${email}`);
        } catch (error) {
          console.error(`✕ Échec de l'envoi pour ${email} :`, error.message);
        }
      }
    } else {
      console.log("Ce n'est pas encore l'heure programmée.");
    }
  } catch (err) {
    console.error("Erreur globale :", err);
    process.exit(1);
  }
}

run();
