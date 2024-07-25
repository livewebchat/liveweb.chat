import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore, functions } from "../../../../firebaseconfig"
import { Session } from "./_models"

const API_URL = import.meta.env.VITE_APP_FIREBASE_API_URL

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const sessionCollectionRef = collection(firestore, "sessions")
    const sessionDocSnapshot = await getDocs(sessionCollectionRef)

    const sessions: Session[] = []

    sessionDocSnapshot.forEach((doc) => {
      const { active, domain, userIPaddress, messages, lastActive, createdAt } =
        doc.data()
      const sessionData: Session = {
        id: doc.id,
        active,
        domain,
        userIPaddress,
        messages,
        lastActive,
        createdAt,
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
      const { active, domain, userIPaddress, messages, lastActive, createdAt } =
        doc.data()
      const sessionData: Session = {
        id: doc.id,
        active,
        domain,
        userIPaddress,
        messages,
        lastActive,
        createdAt,
      }
      activeSessions.push(sessionData)
    })

    return activeSessions
  } catch (error) {
    console.error("Error fetching active sessions by user IP:", error)
    return []
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
