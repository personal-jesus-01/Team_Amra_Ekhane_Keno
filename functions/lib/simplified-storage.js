"use strict";
/**
 * Simplified storage implementation for Firebase Functions deployment
 * Uses in-memory storage with session support
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
// Create memory store for sessions
const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
// Simple in-memory storage implementation
class MemStorage {
    constructor() {
        this.users = new Map();
        // Initialize with demo user
        this.users.set(1, {
            id: 1,
            username: "demo",
            email: "demo@example.com",
            password: "password-hash.salt",
            name: "Demo User",
            role: "user",
            credits: 100,
            subscription: "free",
            subscriptionExpiry: null,
            firebaseUid: "firebase-demo-uid",
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Initialize session store
        this.sessionStore = new MemoryStore({
            checkPeriod: 86400000 // Prune expired entries every 24 hours
        });
    }
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find(user => user.username.toLowerCase() === username.toLowerCase());
    }
    async getUserByEmail(email) {
        return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
    }
    async getUserByFirebaseUid(firebaseUid) {
        return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
    }
}
exports.MemStorage = MemStorage;
// Export singleton instance
exports.storage = new MemStorage();
//# sourceMappingURL=simplified-storage.js.map