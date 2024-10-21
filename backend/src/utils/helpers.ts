import { db } from "../services/dbService"
import { ResultSetHeader } from "mysql2"

// Get the root domain from origin URL
export const getRootDomain = (hostname: string) => {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname === "localhost") {
    return "Localhost"
  }

  const parts = hostname.split(".")
  if (parts.length > 2) {
    return parts.slice(-2).join(".")
  }
  return hostname
}

// Check inactive sessions and set active to false if inactive for 30 minutes
export const checkInactiveSessions = async (): Promise<void> => {
  const now = new Date()
  const inactivityPeriod = 30 * 60 * 1000 // 30 minutes

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE sessions SET active = false WHERE active = true AND lastActive < ?`,
      [new Date(now.getTime() - inactivityPeriod)]
    )

    console.log(`${result.affectedRows} inactive sessions updated.`)
  } catch (error) {
    console.error("Error updating inactive sessions:", error)
  }
}
