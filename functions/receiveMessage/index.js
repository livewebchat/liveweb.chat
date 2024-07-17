const fs = require("fs")
const path = require("path")

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET",
  }

  if (event.httpMethod === "GET") {
    try {
      const { sessionId } = event.queryStringParameters
      const sessionFilePath = path.join(
        __dirname,
        `../chatSessions/session${sessionId}.json`
      )

      if (fs.existsSync(sessionFilePath)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"))

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(sessionData),
        }
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Session not found" }),
        }
      }
    } catch (error) {
      console.error("Error retrieving messages:", error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to retrieve messages" }),
      }
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  }
}
