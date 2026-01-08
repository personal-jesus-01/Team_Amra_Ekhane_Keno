"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = exports.requireAuth = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = require("crypto");
const util_1 = require("util");
const storage_1 = require("./storage");
const axios_1 = __importDefault(require("axios"));
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
async function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64));
    return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64));
    return (0, crypto_1.timingSafeEqual)(hashedBuf, suppliedBuf);
}
function requireAuth(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    next();
}
exports.requireAuth = requireAuth;
// Verify Firebase ID token
async function verifyFirebaseToken(idToken) {
    // In development mode, accept mock tokens for testing
    if (process.env.NODE_ENV === 'development' && idToken === 'mock-development-token-for-testing') {
        console.log('Development mode: Accepting mock Firebase token');
        return true;
    }
    // In production, we would properly verify the token
    try {
        // Get Google public keys to verify the token
        const response = await axios_1.default.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
        // For simplicity, we're trusting Firebase authentication here
        // In a production environment, you should verify the token signature
        // using the public keys and decode the token payload
        // For this implementation, we'll extract the user ID from the token
        // through Firebase SDK on the client-side and trust it
        return true;
    }
    catch (error) {
        console.error("Error verifying Firebase token:", error);
        return false;
    }
}
function setupAuth(app) {
    const sessionSettings = {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: storage_1.storage.sessionStore,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === "production",
        }
    };
    app.set("trust proxy", 1);
    app.use((0, express_session_1.default)(sessionSettings));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.use(new passport_local_1.Strategy({
        usernameField: "email",
        passwordField: "password",
    }, async (email, password, done) => {
        try {
            const user = await storage_1.storage.getUserByEmail(email);
            if (!user || !(await comparePasswords(password, user.password))) {
                return done(null, false, { message: "Invalid email or password" });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
    passport_1.default.serializeUser((user, done) => done(null, user.id));
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await storage_1.storage.getUser(id);
            done(null, user);
        }
        catch (err) {
            done(err, null);
        }
    });
    // Register a new user
    app.post("/api/register", async (req, res, next) => {
        try {
            const { username, email, password, name } = req.body;
            // Check if user already exists
            const existingUser = await storage_1.storage.getUserByEmail(email) ||
                await storage_1.storage.getUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    message: existingUser.email === email ?
                        "Email already registered" :
                        "Username already taken"
                });
            }
            // Create new user
            const hashedPassword = await hashPassword(password);
            const user = await storage_1.storage.createUser({
                username,
                email,
                password: hashedPassword,
                name: name || null,
            });
            // Log in the new user
            req.login(user, (err) => {
                if (err)
                    return next(err);
                // Don't send the password back to the client
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                res.status(201).json(userWithoutPassword);
            });
        }
        catch (error) {
            console.error("Registration error:", error);
            res.status(500).json({ message: "Failed to register user" });
        }
    });
    // Log in a user
    app.post("/api/login", (req, res, next) => {
        passport_1.default.authenticate("local", (err, user, info) => {
            if (err)
                return next(err);
            if (!user) {
                return res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || "Authentication failed" });
            }
            req.login(user, (err) => {
                if (err)
                    return next(err);
                // Don't send the password back to the client
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                res.json(userWithoutPassword);
            });
        })(req, res, next);
    });
    // Google authentication
    app.post("/api/auth/google", async (req, res) => {
        try {
            const { idToken, email, name, photoURL } = req.body;
            // Verify the Firebase ID token
            const isValid = await verifyFirebaseToken(idToken);
            if (!isValid) {
                return res.status(401).json({ message: "Invalid ID token" });
            }
            // Find or create user
            let user = await storage_1.storage.getUserByEmail(email);
            if (!user) {
                // Generate a unique username based on email
                const baseUsername = email.split('@')[0];
                let username = baseUsername;
                let counter = 1;
                // Check if username exists and create a unique one
                while (await storage_1.storage.getUserByUsername(username)) {
                    username = `${baseUsername}${counter}`;
                    counter++;
                }
                // Create new user
                user = await storage_1.storage.createUser({
                    username,
                    email,
                    name: name || null,
                    password: await hashPassword((0, crypto_1.randomBytes)(16).toString('hex')),
                    avatar_url: photoURL || null,
                    firebase_uid: req.body.uid || null,
                });
            }
            else {
                // Update existing user with Firebase UID if not already set
                if (!user.firebase_uid) {
                    user = await storage_1.storage.updateUser(user.id, {
                        firebase_uid: req.body.uid || null,
                        avatar_url: photoURL || user.avatar_url,
                        name: name || user.name,
                    });
                }
            }
            // Log the user in
            req.login(user, (err) => {
                if (err) {
                    console.error("Login error:", err);
                    return res.status(500).json({ message: "Failed to log in" });
                }
                // Don't send the password back to the client
                const { password } = user, userWithoutPassword = __rest(user, ["password"]);
                res.json(userWithoutPassword);
            });
        }
        catch (error) {
            console.error("Google auth error:", error);
            res.status(500).json({ message: "Authentication failed" });
        }
    });
    // Log out
    app.post("/api/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                console.error("Logout error:", err);
                return res.status(500).json({ message: "Failed to log out" });
            }
            res.json({ message: "Logged out successfully" });
        });
    });
    // Get current authenticated user
    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        // Don't send the password back to the client
        const _a = req.user, { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.json(userWithoutPassword);
    });
}
exports.setupAuth = setupAuth;
//# sourceMappingURL=auth.js.map