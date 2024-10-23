"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const sessionRoutes_1 = __importDefault(require("./routes/sessionRoutes"));
const socket_io_1 = require("socket.io");
const socketController_1 = require("./controllers/socketController");
const helpers_1 = require("./utils/helpers");
dotenv_1.default.config({ path: __dirname + "/../../.env" });
// Create Express app
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Apply middlewares
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
// Use session routes
app.use(sessionRoutes_1.default);
// Setup Socket.IO
const io = new socket_io_1.Server(server, {
    cors: { origin: "*" },
});
io.on("connection", (socket) => (0, socketController_1.handleSocketConnection)(io, socket));
// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Schedule to check inactive sessions every 30 minutes
setInterval(helpers_1.checkInactiveSessions, 30 * 60 * 1000);
