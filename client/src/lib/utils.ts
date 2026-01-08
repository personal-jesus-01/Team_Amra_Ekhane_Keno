import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the current environment is a Replit environment
 * @returns boolean indicating if we're in Replit
 */
export function isReplitEnvironment(): boolean {
  return window.location.hostname.includes('replit.dev') || 
         window.location.hostname.includes('repl.co') ||
         window.location.hostname.includes('replit.app');
}

/**
 * Get the base URL for the current environment
 * @returns The base URL for API requests
 */
export function getBaseUrl(): string {
  return window.location.origin;
}

/**
 * Create a WebSocket connection that works in Replit
 * @param path The WebSocket path (e.g., '/ws')
 * @returns A new WebSocket instance
 */
export function createWebSocket(path: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}${path}`;
  
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  return new WebSocket(wsUrl);
}
