import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseAccount: any;

const secretPath = '/etc/secrets/credentials.json';
const localPath = path.resolve(__dirname, './credentials.json');

if (fs.existsSync(secretPath)) {
  // 👉 Environnement Render
  firebaseAccount = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
} else if (fs.existsSync(localPath)) {
  // 👉 Environnement local
  firebaseAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
} else {
  throw new Error('❌ credentials.json introuvable dans aucun environnement.');
}

const firebaseParams = {
  type: firebaseAccount.type,
  projectId: firebaseAccount.project_id,
  privateKeyId: firebaseAccount.private_key_id,
  privateKey: firebaseAccount.private_key,
  clientEmail: firebaseAccount.client_email,
  clientId: firebaseAccount.client_id,
  authUri: firebaseAccount.auth_uri,
  tokenUri: firebaseAccount.token_uri,
  authProviderX509CertUrl: firebaseAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: firebaseAccount.client_x509_cert_url,
};

const firebase = admin.initializeApp({
  credential: admin.credential.cert(firebaseParams),
});

export default firebase;
