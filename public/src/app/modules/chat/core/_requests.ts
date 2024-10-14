import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { firestore, functions } from "../../../../firebaseconfig"
import { Session } from "./_models"

const API_URL = import.meta.env.VITE_APP_FIREBASE_API_URL

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const sessionCollectionRef = collection(firestore, "sessions")
    const sessionDocSnapshot = await getDocs(sessionCollectionRef)

    const sessions: Session[] = []

    sessionDocSnapshot.forEach((doc) => {
      const {
        active,
        domain,
        userIPaddress,
        messages,
        lastActive,
        createdAt,
        remote,
      } = doc.data()
      const sessionData: Session = {
        id: doc.id,
        active,
        domain,
        userIPaddress,
        messages,
        lastActive,
        createdAt,
        remote,
      }
      sessions.push(sessionData)
    })

    return sessions
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return []
  }
}

export const getActiveSessionByUserIP = async (
  userIP: string
): Promise<Session[]> => {
  try {
    const sessionCollectionRef = collection(firestore, "sessions")
    const activeSessionsQuery = query(
      sessionCollectionRef,
      where("userIPaddress", "==", userIP),
      where("active", "==", true)
    )
    const sessionDocSnapshot = await getDocs(activeSessionsQuery)

    const activeSessions: Session[] = []

    sessionDocSnapshot.forEach((doc) => {
      const {
        active,
        domain,
        userIPaddress,
        messages,
        lastActive,
        createdAt,
        remote,
      } = doc.data()
      const sessionData: Session = {
        id: doc.id,
        active,
        domain,
        userIPaddress,
        messages,
        lastActive,
        createdAt,
        remote,
      }
      activeSessions.push(sessionData)
    })

    return activeSessions
  } catch (error) {
    console.error("Error fetching active sessions by user IP:", error)
    return []
  }
}

export const setRemoteConnectedBySessionId = async (
  sessionId: string,
  name: string
): Promise<void> => {
  try {
    const sessionDocRef = doc(firestore, "sessions", sessionId)

    await updateDoc(sessionDocRef, {
      "remote.connected": true,
      "remote.name": name,
    })

    console.log(`Session ${sessionId} updated: remote.connected set to true`)
  } catch (error) {
    console.error("Error updating session remote connection:", error)
  }
}

export const setRemoteDisonnectedBySessionId = async (
  sessionId: string
): Promise<void> => {
  try {
    const sessionDocRef = doc(firestore, "sessions", sessionId)

    await updateDoc(sessionDocRef, {
      "remote.connected": false,
      "remote.name": "",
    })

    console.log(`Session ${sessionId} updated: remote.connected set to false`)
  } catch (error) {
    console.error("Error updating session remote connection:", error)
  }
}

export const sendMessage = async (
  sessionId: string,
  sender: string,
  text: string
) => {
  const response = await fetch(`${API_URL}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, sender, text }),
  })

  return await response.json()
}
