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
exports.checkInactiveSessions = exports.getRootDomain = void 0;
const dbService_1 = require("../services/dbService");
// Get the root domain from origin URL
const getRootDomain = (hostname) => {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname === "localhost") {
        return "Localhost";
    }
    const parts = hostname.split(".");
    if (parts.length > 2) {
        return parts.slice(-2).join(".");
    }
    return hostname;
};
exports.getRootDomain = getRootDomain;
// Check inactive sessions and set active to false if inactive for 30 minutes
const checkInactiveSessions = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const inactivityPeriod = 30 * 60 * 1000; // 30 minutes
    try {
        const [result] = yield dbService_1.db.execute(`UPDATE sessions SET active = false WHERE active = true AND lastActive < ?`, [new Date(now.getTime() - inactivityPeriod)]);
        console.log(`${result.affectedRows} inactive sessions updated.`);
    }
    catch (error) {
        console.error("Error updating inactive sessions:", error);
    }
});
exports.checkInactiveSessions = checkInactiveSessions;
