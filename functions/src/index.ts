import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({origin: true});

const getRootDomain = (hostname: string) => {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname === "localhost") {
    return "Localhost";
  }

  const parts = hostname.split(".");
  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
};

// Create a new chat session
exports.createSession = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {userIPaddress} = req.body;

      const referer = req.get("Referer") || "Unknown";
      let domain = "Unknown";
      const url = new URL(referer);
      domain = getRootDomain(url.hostname);

      const sessionRef = db.collection("chatSessions").doc();
      const sessionData = {
        userIPaddress,
        active: true,
        messages: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        domain,
      };

      await sessionRef.set(sessionData);
      res.status(200).send({
        message: "Session created successfully",
        sessionId: sessionRef.id,
      });
    } catch (error) {
      res.status(500).send({error: "Internal Server Error"});
    }
  });
});

// Get session by userIPaddress
exports.getSession = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const userIPaddress = req.query.userIPaddress;
      if (!userIPaddress) {
        res.status(400).send({error: "User IP address is required"});
        return;
      }

      const snapshot = await db.collection("chatSessions")
        .where("userIPaddress", "==", userIPaddress)
        .where("active", "==", true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).send({message: "No session found for this IP"});
        return;
      }

      const doc = snapshot.docs[0];
      const sessionData = {id: doc.id, ...doc.data()};

      res.status(200).send(sessionData);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).send({error: "Internal Server Error"});
    }
  });
});

// Send a message
exports.sendMessage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {sessionId, sender, text} = req.body;

      if (!sessionId || !sender || !text) {
        res.status(400).send({error: "Invalid input parameters"});
        return;
      }

      const sessionRef = db.collection("chatSessions").doc(sessionId);

      const sessionSnapshot = await sessionRef.get();
      if (!sessionSnapshot.exists) {
        res.status(404).send({
          error: "Session not found",
        });
        return;
      }

      const newMessage = {
        id: Date.now().toString(),
        sender,
        text,
      };

      await sessionRef.update({
        messages: admin.firestore.FieldValue.arrayUnion(newMessage),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).send({
        message: "Message sent successfully",
        newMessage,
      });
    } catch (error) {
      res.status(500).send({error});
    }
  });
});

// Receive new messages
exports.receiveMessages = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const sessionId = req.query.sessionId;
      if (!sessionId) {
        res.status(400).send({error: "Session ID is required"});
        return;
      }

      const sessionRef =
        db.collection("chatSessions").doc(sessionId.toString());
      const sessionSnapshot = await sessionRef.get();
      if (!sessionSnapshot.exists) {
        res.status(404).send({
          error: "Session not found",
        });
        return;
      }

      const sessionData = sessionSnapshot.data();

      if (!sessionData) {
        res.status(400).send({error: "Session Data doesn't exist"});
        return;
      }

      res.status(200).send(sessionData.messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send({error: "Internal Server Error"});
    }
  });
});

// Check inactive sessions
exports.checkInactiveSessions =
  functions.pubsub.schedule("every 30 minutes").onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const INACTIVITY_PERIOD = 30 * 60 * 1000;

    try {
      const sessionsRef = admin.firestore().collection("chatSessions");

      const snapshot = await sessionsRef
        .where("active", "==", true)
        .where("lastActive", "<", now.toMillis() - INACTIVITY_PERIOD)
        .get();

      if (snapshot.empty) {
        return;
      }

      const batch = admin.firestore().batch();

      snapshot.forEach((doc) => {
        const sessionRef = sessionsRef.doc(doc.id);
        batch.update(sessionRef, {active: false});
      });

      await batch.commit();
    } catch (error) {
      console.error("Error updating inactive sessions:", error);
    }
  });
