import mysql from "mysql2/promise"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: __dirname + "/../../.env" })
console.log(__dirname)

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
})
