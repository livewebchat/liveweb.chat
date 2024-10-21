import { Server, Socket } from "socket.io"

import { db } from "../services/dbService"
import { RowDataPacket, ResultSetHeader } from "mysql2/promise"

import { ConnectResponse } from "../models/models"

// Handle the connection and events
export const handleSocketConnection = (io: Server, socket: Socket) => {
  console.log("A user connected:", socket.id)

  // Fetch active sessions from the database
  socket.on("fetchSessions", async () => {
    try {
      const [sessions] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM sessions WHERE active = true`
      )
      socket.emit("sessionsData", sessions)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      socket.emit("error", { error: "Internal Server Error" })
    }
  })

  // Connect to a session and update its 'remote.connected' field
  socket.on("connectToSession", async ({ sessionId, agentName }) => {
    try {
      const response = await fetch(`/sessions/${sessionId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName }),
      })

      const data = (await response.json()) as ConnectResponse

      if (response.ok) {
        console.log(data.message)
        socket.emit("sessionConnected", { sessionId })
      } else {
        console.error(data.error)
        socket.emit("error", { error: data.error })
      }
    } catch (error) {
      console.error("Error connecting to session:", error)
      socket.emit("error", { error: "Internal Server Error" })
    }
  })

  // Disconnect from a session
  socket.on("disconnectFromSession", async (sessionId) => {
    try {
      const response = await fetch(`/sessions/${sessionId}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = (await response.json()) as ConnectResponse
      if (response.ok) {
        console.log(data.message)
        socket.emit("sessionDisconnected", { sessionId })
      } else {
        console.error(data.error)
        socket.emit("error", { error: data.error })
      }
    } catch (error) {
      console.error("Error disconnecting from session:", error)
      socket.emit("error", { error: "Internal Server Error" })
    }
  })

  // Join a session's room
  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId)
    console.log(`User joined session: ${sessionId}`)
  })

  // Handle chat messages
  socket.on("sendMessage", async ({ sessionId, sender, text }) => {
    if (!sessionId || !sender || !text) {
      return socket.emit("error", { error: "Invalid input parameters" })
    }

    try {
      const newMessage = {
        id: Date.now().toString(),
        sender,
        text,
      }

      // Fetch the session from the database
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM sessions WHERE id = ?`,
        [sessionId]
      )

      if (rows.length === 0) {
        return socket.emit("error", { error: "Session not found" })
      }

      const sessionData = rows[0]

      // Initialize messages array if it doesn't exist
      if (!sessionData.messages) {
        sessionData.messages = []
      }

      // Add the new message to the session's messages array
      sessionData.messages.push(newMessage)

      // Update the session in the database
      await db.execute<ResultSetHeader>(
        `UPDATE sessions SET messages = ? WHERE id = ?`,
        [JSON.stringify(sessionData.messages), sessionId]
      )

      // Emit the new message to the session
      io.to(sessionId).emit("newMessage", newMessage)

      // Emit the sessionUpdated event
      io.to(sessionId).emit("sessionUpdated")
    } catch (error) {
      console.error("Error sending message:", error)
      socket.emit("error", { error: "Internal Server Error" })
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
}
