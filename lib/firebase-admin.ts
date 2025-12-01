import * as admin from "firebase-admin";

// import serviceAccount from "@/firebase.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const firebaseAdmin = admin;
