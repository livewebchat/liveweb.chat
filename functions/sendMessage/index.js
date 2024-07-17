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
      const { sessionId, sender, text } = JSON.parse(event.body)
      const sessionFilePath = path.join(
        __dirname,
        `../chatSessions/session${sessionId}.json`
      )

      if (!fs.existsSync(sessionFilePath)) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Session not found" }),
        }
      }

      const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"))
      const newMessage = { id: Date.now(), sender, text }
      sessionData.messages.push(newMessage)
      sessionData.lastActive = new Date().toISOString()

      fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2))

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Message sent successfully" }),
      }
    } catch (error) {
      console.error("Error sending message:", error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to send message" }),
      }
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  }
}
