import express, { Request, Response } from "express"
import http from "http"
import { Server } from "socket.io"
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config({ path: "./.env" })

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
)
app.use(express.json())

// MySQL Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
})

// Helper function to get the root domain
const getRootDomain = (hostname: string) => {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname === "localhost") {
    return "Localhost"
  }

  const parts = hostname.split(".")
  if (parts.length > 2) {
    return parts.slice(-2).join(".")
  }
  return hostname
}

// Create a new chat session
app.post("/sessions", async (req: Request, res: Response): Promise<void> => {
  const { userIPaddress } = req.body

  try {
    const referer = req.get("Referer") || "Unknown"
    let domain = "Unknown"
    const url = new URL(referer)
    domain = getRootDomain(url.hostname)

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO sessions (userIPaddress, active, createdAt, lastActive, domain) VALUES (?, ?, NOW(), NOW(), ?)`,
      [userIPaddress, true, domain]
    )

    const sessionId = result.insertId

    res.status(201).send({
      message: "Session created successfully",
      id: sessionId,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    res.status(500).send({ error: "Internal Server Error" })
  }
})

// Get session by userIPaddress
app.get("/sessions", async (req: Request, res: Response): Promise<void> => {
  const userIPaddress = req.query.userIPaddress as string // Cast to string for clarity

  if (!userIPaddress) {
    res.status(400).send({ error: "User IP address is required" })
    return
  }

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM sessions WHERE userIPaddress = ? AND active = ? LIMIT 1`,
      [userIPaddress, true]
    )

    if (rows.length === 0) {
      res.status(404).send({ message: "No session found for this IP" })
      return
    }

    const sessionData = rows[0]
    res.status(200).send(sessionData)
  } catch (error) {
    console.error("Error fetching session:", error)
    res.status(500).send({ error: "Internal Server Error" })
  }
})

// Update session's remote.connected to true by session ID
app.post(
  "/sessions/:sessionId/connect",
  async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params
    const { name } = req.body

    if (!sessionId) {
      res.status(400).send({ error: "Session ID is required" })
      return
    }

    try {
      const [result] = await db.execute<ResultSetHeader>(
        `UPDATE sessions SET remote = JSON_SET(remote, '$.connected', true, '$.name', ?) WHERE id = ?`,
        [name || null, sessionId]
      )

      if (result.affectedRows === 0) {
        res.status(404).send({ message: "Session not found" })
        return
      }

      res.status(200).send({
        message: `Session ${sessionId} updated: remote.connected set to true`,
      })
    } catch (error) {
      console.error("Error updating session remote connection:", error)
      res.status(500).send({ error: "Internal Server Error" })
    }
  }
)

// Update session's remote.connected to false by session ID
app.post(
  "/sessions/:sessionId/disconnect",
  async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params

    if (!sessionId) {
      res.status(400).send({ error: "Session ID is required" })
      return
    }

    try {
      const [result] = await db.execute<ResultSetHeader>(
        `UPDATE sessions SET remote = JSON_SET(remote, '$.connected', false) WHERE id = ?`,
        [sessionId]
      )

      if (result.affectedRows === 0) {
        res.status(404).send({ message: "Session not found" })
        return
      }

      res.status(200).send({
        message: `Session ${sessionId} updated: remote.connected set to false`,
      })
    } catch (error) {
      console.error("Error updating session remote disconnection:", error)
      res.status(500).send({ error: "Internal Server Error" })
    }
  }
)

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id)

  socket.on("fetchSessions", async () => {
    try {
      const [sessions] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM sessions WHERE active = true`
      )

      // Always emit, even if the result is an empty array
      socket.emit("sessionsData", sessions)
    } catch (error) {
      console.error("Error fetching sessions:", error)
      socket.emit("error", { error: "Internal Server Error" })
    }
  })

  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId)
    console.log(`User joined session: ${sessionId}`)
  })

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
})

// Check inactive sessions (you might want to run this periodically)
const checkInactiveSessions = async (): Promise<void> => {
  const now = new Date()
  const inactivityPeriod = 30 * 60 * 1000 // 30 minutes

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE sessions SET active = false WHERE active = true AND lastActive < ?`,
      [new Date(now.getTime() - inactivityPeriod)]
    )

    const affectedRows = result.affectedRows
    console.log(`${affectedRows} inactive sessions updated.`)
  } catch (error) {
    console.error("Error updating inactive sessions:", error)
  }
}

// Schedule to check inactive sessions every 30 minutes
setInterval(checkInactiveSessions, 30 * 60 * 1000)

// Start server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
