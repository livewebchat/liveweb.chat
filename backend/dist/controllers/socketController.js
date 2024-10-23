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
exports.handleSocketConnection = void 0;
const dbService_1 = require("../services/dbService");
// Handle the connection and events
const handleSocketConnection = (io, socket) => {
    console.log("A user connected:", socket.id);
    // Fetch active sessions from the database
    socket.on("fetchSessions", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const [sessions] = yield dbService_1.db.execute(`SELECT * FROM sessions WHERE active = true`);
            socket.emit("sessionsData", sessions);
        }
        catch (error) {
            console.error("Error fetching sessions:", error);
            socket.emit("error", { error: "Internal Server Error" });
        }
    }));
    // Connect to a session and update its 'remote.connected' field
    socket.on("connectToSession", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionId, agentName }) {
        try {
            const response = yield fetch(`/sessions/${sessionId}/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: agentName }),
            });
            const data = (yield response.json());
            if (response.ok) {
                console.log(data.message);
                socket.emit("sessionConnected", { sessionId });
            }
            else {
                console.error(data.error);
                socket.emit("error", { error: data.error });
            }
        }
        catch (error) {
            console.error("Error connecting to session:", error);
            socket.emit("error", { error: "Internal Server Error" });
        }
    }));
    // Disconnect from a session
    socket.on("disconnectFromSession", (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield fetch(`/sessions/${sessionId}/disconnect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = (yield response.json());
            if (response.ok) {
                console.log(data.message);
                socket.emit("sessionDisconnected", { sessionId });
            }
            else {
                console.error(data.error);
                socket.emit("error", { error: data.error });
            }
        }
        catch (error) {
            console.error("Error disconnecting from session:", error);
            socket.emit("error", { error: "Internal Server Error" });
        }
    }));
    // Join a session's room
    socket.on("joinSession", (sessionId) => {
        socket.join(sessionId);
        console.log(`User joined session: ${sessionId}`);
    });
    // Handle chat messages
    socket.on("sendMessage", (_a) => __awaiter(void 0, [_a], void 0, function* ({ sessionId, sender, text }) {
        if (!sessionId || !sender || !text) {
            return socket.emit("error", { error: "Invalid input parameters" });
        }
        try {
            const newMessage = {
                id: Date.now().toString(),
                sender,
                text,
            };
            // Fetch the session from the database
            const [rows] = yield dbService_1.db.execute(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
            if (rows.length === 0) {
                return socket.emit("error", { error: "Session not found" });
            }
            const sessionData = rows[0];
            // Initialize messages array if it doesn't exist
            if (!sessionData.messages) {
                sessionData.messages = [];
            }
            // Add the new message to the session's messages array
            sessionData.messages.push(newMessage);
            // Update the session in the database
            yield dbService_1.db.execute(`UPDATE sessions SET messages = ? WHERE id = ?`, [JSON.stringify(sessionData.messages), sessionId]);
            // Emit the new message to the session
            io.to(sessionId).emit("newMessage", newMessage);
            // Emit the sessionUpdated event
            io.to(sessionId).emit("sessionUpdated");
        }
        catch (error) {
            console.error("Error sending message:", error);
            socket.emit("error", { error: "Internal Server Error" });
        }
    }));
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
};
exports.handleSocketConnection = handleSocketConnection;
