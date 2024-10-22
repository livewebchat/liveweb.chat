"use strict"

require("dotenv").config()

const http = require("http")
const { exec } = require("child_process")

// --- Configuration ---
const PORT = process.env.PORT
const REPO_PATH = process.env.REPO_PATH
// ---------------------

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/") {
    let body = ""

    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      console.log("Received push event, pulling changes...")

      exec("git pull origin main", { cwd: REPO_PATH }, (error, stdout) => {
        if (error) {
          console.error(`Error pulling changes: ${error}`)
          res.writeHead(500, { "Content-Type": "text/plain" })
          res.end("Error pulling changes")
        } else {
          console.log(`Changes pulled successfully:\n${stdout}`)
          res.writeHead(200, { "Content-Type": "text/plain" })
          res.end("Changes pulled successfully")

          exec("npm install && npm run build", {
            cwd: "/var/www/liveweb.chat/admin",
          })
          exec("npm install && npm run build", {
            cwd: "/var/www/liveweb.chat/backend",
          })
          exec("sudo systemctl restart apache2")
        }
      })
    })
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" })
    res.end("Not found")
  }
})

server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`)
})
