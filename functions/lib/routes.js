"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const index_1 = require("./routes/index");
/**
 * Register all routes and create the server
 * Main entry point from server/index.ts
 *
 * @param app Express application
 * @returns HTTP server with WebSocket support
 */
async function registerRoutes(app) {
    // Use our centralized route registration
    return (0, index_1.registerAllRoutes)(app);
}
exports.registerRoutes = registerRoutes;
//# sourceMappingURL=routes.js.map