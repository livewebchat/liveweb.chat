/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Create a new chat session
exports.createSession = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const {createdBy} = req.body;
  const sessionRef = db.collection("chatSessions").doc();
  const sessionData = {
    createdBy,
    messages: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActive: admin.firestore.FieldValue.serverTimestamp(),
  };

  await sessionRef.set(sessionData);
  res.status(200).send({
    message: "Session created successfully",
    sessionId: sessionRef.id,
  });
});

// Send a message
exports.sendMessage = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const {sessionId, sender, text} = req.body;
  const sessionRef = db.collection("chatSessions").doc(sessionId);

  const sessionSnapshot = await sessionRef.get();
  if (!sessionSnapshot.exists) {
    return res.status(404).send({
      error: "Session not found",
    });
  }

  const newMessage = {
    id: Date.now().toString(),
    sender,
    text,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  await sessionRef.update({
    messages: admin.firestore.FieldValue.arrayUnion(newMessage),
    lastActive: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.status(200).send({
    message: "Message sent successfully",
  });
});

// Receive messages
exports.receiveMessages = functions.https.onRequest(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const {sessionId} = req.query;
  const sessionRef = db.collection("chatSessions").doc(sessionId);

  const sessionSnapshot = await sessionRef.get();
  if (!sessionSnapshot.exists) {
    return res.status(404).send({
      error: "Session not found",
    });
  }

  res.status(200).send(sessionSnapshot.data());
});
