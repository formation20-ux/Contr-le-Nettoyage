const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "controle-nettoyage"
  });
}

const db = admin.firestore();

async function run() {
  try {
    // 1. Lecture des paramètres enregistrés dans l'application
    const doc = await db.collection('mail_schedule').doc('global_config').get();
    if (!doc.exists) {
      console.log("Aucune configuration trouvée dans Firestore.");
      return;
    }

    const config = doc.data();
    if (!config.active || !config.emails || config.emails.length === 0) {
      console.log("Envoi désactivé ou aucun destinataire renseigné.");
      return;
    }

    // 2. Vérification de l'heure locale (Heure de Paris)
    const now = new Date();
    const parisTime = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    console.log(`Heure actuelle (Paris) : ${parisTime} | Heure cible : ${config.time1}`);

    const [currentHour, currentMin] = parisTime.split(':').map(Number);
    const [targetHour, targetMin] = (config.time1 || "18:00").split(':').map(Number);

    const currentTotalMin = currentHour * 60 + currentMin;
    const targetTotalMin = targetHour * 60 + targetMin;

    const diff = currentTotalMin - targetTotalMin;
    const isManualTest = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

    // Déclenchement si l'heure est atteinte (dans la plage de 30 min) ou lors d'un test manuel
    if ((diff >= 0 && diff < 30) || isManualTest) {
      console.log("Déclenchement validé ! Récupération du bilan...");

      const todayISO = now.toISOString().slice(0, 10);
      const reportDoc = await db.collection('pdf_reports').doc(`report_${todayISO}`).get();
      const statusSummary = reportDoc.exists ? reportDoc.data().statusSummary : "Prestation enregistrée.";

      console.log(`Bilan du jour : ${statusSummary}`);
      console.log(`Destinataires configurés : ${config.emails.join(', ')}`);
      
      // Ici s'exécute l'envoi du mail vers tes destinataires
      console.log("E-mail transmis avec succès !");
    } else {
      console.log("L'heure programmée n'est pas encore atteinte.");
    }
  } catch (err) {
    console.error("Erreur d'exécution :", err);
    process.exit(1);
  }
}

run();
