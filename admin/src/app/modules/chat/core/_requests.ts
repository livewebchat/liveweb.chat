/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, Session } from "./_models"

const API_URL =
  "http://" +
  import.meta.env.VITE_APP_LWC_API_URL +
  ":" +
  import.meta.env.VITE_APP_LWC_API_URL

// Fetch active session by user IP
export const getActiveSessionByUserIP = async (
  userIP: string
): Promise<Session | undefined> => {
  try {
    const response = await fetch(
      `${API_URL}/sessions?userIPaddress=${userIP}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (response.ok) {
      const session: Session = await response.json()
      return session
    }
  } catch (error) {
    console.error("Error fetching active session by user IP:", error)
  }
  return undefined
}

// Set remote connection to true by session ID (this endpoint does not exist in the backend)
export const setRemoteConnectedBySessionId = async (
  sessionId: string,
  name: string
): Promise<void> => {
  console.warn(
    "setRemoteConnectedBySessionId is not implemented in the backend"
  )
  // Assuming you will implement this endpoint in the backend.
}

// Set remote connection to false by session ID (this endpoint does not exist in the backend)
export const setRemoteDisonnectedBySessionId = async (
  sessionId: string
): Promise<void> => {
  console.warn(
    "setRemoteDisonnectedBySessionId is not implemented in the backend"
  )
  // Assuming you will implement this endpoint in the backend.
}

// Send a message via Socket.IO instead of HTTP API
export const sendMessage = async (
  socket: any, // Pass the Socket.IO instance from the frontend
  sessionId: string,
  sender: string,
  text: string
): Promise<Message | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      socket.emit(
        "sendMessage",
        { sessionId, sender, text },
        (response: any) => {
          if (response.error) {
            reject(response.error)
          } else {
            const message: Message = {
              id: response.id,
              sender: response.sender || sender,
              text: response.text || text,
              sending: false,
              read: false,
            }
            resolve(message)
          }
        }
      )
    })
  } catch (error) {
    console.error("Error sending message via Socket.IO:", error)
  }

  return undefined
}
