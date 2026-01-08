"use strict";
/**
 * Simplified Firebase Functions authentication implementation
 * For SlideBanai production deployment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = exports.requireAuth = void 0;
const express_session_1 = __importDefault(require("express-session"));
const simplified_storage_1 = require("./simplified-storage");
/**
 * Simple middleware to check if user is authenticated
 */
function requireAuth(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    next();
    return;
}
exports.requireAuth = requireAuth;
/**
 * Setup authentication routes
 */
function setupAuth(app) {
    const sessionSettings = {
        secret: process.env.SESSION_SECRET || "dev-secret",
        resave: false,
        saveUninitialized: false,
        store: simplified_storage_1.storage.sessionStore,
    };
    app.use((0, express_session_1.default)(sessionSettings));
    // Basic user session endpoints
    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        res.json({
            id: 1,
            username: "firebase-user",
            email: "demo@example.com",
            name: "Firebase Demo User",
            role: "user"
        });
        return;
    });
    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err)
                return next(err);
            res.sendStatus(200);
            return;
        });
    });
}
exports.setupAuth = setupAuth;
//# sourceMappingURL=simplified-auth.js.map