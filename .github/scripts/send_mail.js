const https = require('https');

// Fonction pour interroger l'API Firestore en HTTP
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

async function run() {
  try {
    console.log("Consultation des paramètres Firestore...");
    const configDoc = await fetchFirestore('mail_schedule/global_config');
    
    if (!configDoc || !configDoc.fields) {
      console.log("Aucune configuration trouvée ou envoi désactivé.");
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
      console.log("Envoi automatique désactivé ou aucun e-mail renseigné.");
      return;
    }

    // Heure de Paris
    const now = new Date();
    const parisTime = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    console.log(`Heure actuelle (Paris) : ${parisTime} | Heure cible : ${time1}`);

    const [currentHour, currentMin] = parisTime.split(':').map(Number);
    const [targetHour, targetMin] = time1.split(':').map(Number);

    const currentTotalMin = currentHour * 60 + currentMin;
    const targetTotalMin = targetHour * 60 + targetMin;
    const diff = currentTotalMin - targetTotalMin;

    const isManualTest = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

    if ((diff >= 0 && diff < 30) || isManualTest) {
      console.log("Déclenchement validé ! Récupération du bilan...");

      const todayISO = now.toISOString().slice(0, 10);
      const reportDoc = await fetchFirestore(`pdf_reports/report_${todayISO}`);
      
      let statusSummary = "Prestation enregistrée.";
      if (reportDoc && reportDoc.fields && reportDoc.fields.statusSummary) {
        statusSummary = reportDoc.fields.statusSummary.stringValue;
      }

      console.log(`Bilan du jour : ${statusSummary}`);
      console.log(`Destinataires : ${emails.join(', ')}`);
      console.log("Exécution réussie !");
    } else {
      console.log("Ce n'est pas encore l'heure programmée.");
    }
  } catch (err) {
    console.error("Erreur d'exécution :", err);
    process.exit(1);
  }
}

run();
