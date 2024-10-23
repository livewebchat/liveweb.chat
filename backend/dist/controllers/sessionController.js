"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromSession = exports.connectToSession = exports.getSession = exports.createSession = void 0;
const dbService_1 = require("../services/dbService");
const helpers_1 = require("../utils/helpers");
// Create a new chat session
const createSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIPaddress } = req.body;
    try {
        const referer = req.get("Referer") || "Unknown";
        const domain = (0, helpers_1.getRootDomain)(new URL(referer).hostname);
        const [result] = yield dbService_1.db.execute(`INSERT INTO sessions (userIPaddress, active, createdAt, lastActive, domain) VALUES (?, ?, NOW(), NOW(), ?)`, [userIPaddress, true, domain]);
        res
            .status(201)
            .send({ message: "Session created successfully", id: result.insertId });
    }
    catch (error) {
        console.error("Error creating session:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
exports.createSession = createSession;
// Get session by userIPaddress
const getSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userIPaddress = req.query.userIPaddress;
    if (!userIPaddress) {
        res.status(400).send({ error: "User IP address is required" });
        return;
    }
    try {
        const [rows] = yield dbService_1.db.execute(`SELECT * FROM sessions WHERE userIPaddress = ? AND active = ? LIMIT 1`, [userIPaddress, true]);
        res
            .status(200)
            .send(rows.length ? rows[0] : { message: "No session found" });
    }
    catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
exports.getSession = getSession;
const connectToSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.params.sessionId;
    const remoteName = req.body.name;
    if (!sessionId || isNaN(Number(sessionId))) {
        res.status(400).send({ error: "Valid session ID is required" });
        return;
    }
    try {
        const [result] = yield dbService_1.db.execute(`UPDATE sessions SET remote = JSON_SET(remote, '$.connected', true, '$.name', ?) WHERE id = ?`, [remoteName, sessionId]);
        if (result.affectedRows === 0) {
            res.status(404).send({ message: "Session not found" });
            return;
        }
        res.status(200).send({ message: "Connected to session" });
    }
    catch (error) {
        console.error("Error connecting to session:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
exports.connectToSession = connectToSession;
// Disconnect from a session (set remote.connected to false)
const disconnectFromSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId } = req.params;
    if (!sessionId) {
        res.status(400).send({ error: "Session ID is required" });
        return;
    }
    try {
        const [result] = yield dbService_1.db.execute(`UPDATE sessions SET remote = JSON_SET(remote, '$.connected', false) WHERE id = ?`, [sessionId]);
        if (result.affectedRows === 0) {
            res.status(404).send({ message: "Session not found" });
            return;
        }
        res.status(200).send({
            message: `Session ${sessionId} updated: remote.connected set to false`,
        });
    }
    catch (error) {
        console.error("Error disconnecting from session:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
exports.disconnectFromSession = disconnectFromSession;
