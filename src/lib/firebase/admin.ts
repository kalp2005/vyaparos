import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK (Server-Side Only)
 */
export function getFirebaseAdminApp(): admin.app.App {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey && projectId) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Fallback for development/testing without service account cert
  return admin.initializeApp({
    projectId: projectId || 'vyaparos-dev',
  });
}

export const adminAuth = getFirebaseAdminApp().auth();
