import { Router } from "express"
import {
  createSession,
  getSession,
  connectToSession,
  disconnectFromSession,
} from "../controllers/sessionController"

const router = Router()

// Create a new session
router.post("/sessions", createSession)

// Get session by user IP address
router.get("/sessions", getSession)

// Connect to a session (mark remote.connected as true)
router.post("/sessions/:sessionId/connect", connectToSession)

// Disconnect from a session (mark remote.connected as false)
router.post("/sessions/:sessionId/disconnect", disconnectFromSession)

export default router
