const fs = require("fs")
const path = require("path")

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST",
  }

  if (event.httpMethod === "POST") {
    try {
      const { createdBy } = JSON.parse(event.body)
      const sessionId = Date.now().toString()
      const sessionFilePath = path.join(
        __dirname,
        `../chatSessions/session${sessionId}.json`
      )
      const sessionData = {
        sessionID: sessionId,
        createdBy,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      }

      fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2))

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Session created successfully",
          sessionId,
        }),
      }
    } catch (error) {
      console.error("Error creating session:", error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to create session" }),
      }
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  }
}
