import express from "express"
import http from "http"
import cors from "cors"
import dotenv from "dotenv"

import sessionRoutes from "./routes/sessionRoutes"

import { Server } from "socket.io"
import { handleSocketConnection } from "./controllers/socketController"

import { checkInactiveSessions } from "./utils/helpers"

dotenv.config({ path: __dirname + "/../../.env" })

// Create Express app
const app = express()
const server = http.createServer(app)

// Apply middlewares
app.use(cors({ origin: "*" }))
app.use(express.json())

// Use session routes
app.use(sessionRoutes)

// Setup Socket.IO
const io = new Server(server, {
  cors: { origin: "*" },
})

io.on("connection", (socket) => handleSocketConnection(io, socket))

// Start server
const PORT = process.env.PORT
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Schedule to check inactive sessions every 30 minutes
setInterval(checkInactiveSessions, 30 * 60 * 1000)
