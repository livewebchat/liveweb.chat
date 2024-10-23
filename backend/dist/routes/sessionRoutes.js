"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionController_1 = require("../controllers/sessionController");
const router = (0, express_1.Router)();
// Create a new session
router.post("/sessions", sessionController_1.createSession);
// Get session by user IP address
router.get("/sessions", sessionController_1.getSession);
// Connect to a session (mark remote.connected as true)
router.post("/sessions/:sessionId/connect", sessionController_1.connectToSession);
// Disconnect from a session (mark remote.connected as false)
router.post("/sessions/:sessionId/disconnect", sessionController_1.disconnectFromSession);
exports.default = router;
