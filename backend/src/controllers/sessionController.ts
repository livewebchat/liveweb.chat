import { Request, Response } from "express"
import { db } from "../services/dbService"
import { getRootDomain } from "../utils/helpers"
import { ResultSetHeader, RowDataPacket } from "mysql2"

// Create a new chat session
export const createSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userIPaddress } = req.body
  try {
    const referer = req.get("Referer") || "Unknown"
    const domain = getRootDomain(new URL(referer).hostname)

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO sessions (userIPaddress, active, createdAt, lastActive, domain) VALUES (?, ?, NOW(), NOW(), ?)`,
      [userIPaddress, true, domain]
    )

    res
      .status(201)
      .send({ message: "Session created successfully", id: result.insertId })
  } catch (error) {
    console.error("Error creating session:", error)
    res.status(500).send({ error: "Internal Server Error" })
  }
}

// Get session by userIPaddress
export const getSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userIPaddress = req.query.userIPaddress as string
  if (!userIPaddress) {
    res.status(400).send({ error: "User IP address is required" })
    return
  }

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM sessions WHERE userIPaddress = ? AND active = ? LIMIT 1`,
      [userIPaddress, true]
    )

    res
      .status(200)
      .send(rows.length ? rows[0] : { message: "No session found" })
  } catch (error) {
    console.error("Error fetching session:", error)
    res.status(500).send({ error: "Internal Server Error" })
  }
}

export const connectToSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sessionId = req.params.sessionId
  const remoteName = req.body.name

  if (!sessionId || isNaN(Number(sessionId))) {
    res.status(400).send({ error: "Valid session ID is required" })
    return
  }

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE sessions SET remote = JSON_SET(remote, '$.connected', true, '$.name', ?) WHERE id = ?`,
      [remoteName, sessionId]
    )

    if (result.affectedRows === 0) {
      res.status(404).send({ message: "Session not found" })
      return
    }

    res.status(200).send({ message: "Connected to session" })
  } catch (error) {
    console.error("Error connecting to session:", error)
    res.status(500).send({ error: "Internal Server Error" })
  }
}

// Disconnect from a session (set remote.connected to false)
export const disconnectFromSession = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    console.error("Error disconnecting from session:", error)
    res.status(500).send({ error: "Internal Server Error" })
  }
}
