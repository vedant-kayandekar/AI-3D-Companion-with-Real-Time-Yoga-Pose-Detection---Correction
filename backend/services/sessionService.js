import { config } from "../config/index.js";

class SessionService {
  constructor() {
    this.guestSessions = new Map();
  }

  getOrCreateSession(guestId) {
    if (!guestId) return null;
    let session = this.guestSessions.get(guestId);
    if (!session) {
      session = {
        guestId,
        messageCount: 0,
        createdAt: Date.now(),
        lastActive: Date.now(),
      };
      this.guestSessions.set(guestId, session);
    } else {
      session.lastActive = Date.now();
    }
    return session;
  }

  canChat(guestId) {
    const session = this.getOrCreateSession(guestId);
    if (!session) return false;
    return session.messageCount < config.maxGuestChats;
  }

  incrementChat(guestId) {
    const session = this.getOrCreateSession(guestId);
    if (session) {
      session.messageCount += 1;
      return session.messageCount;
    }
    return 0;
  }

  getRemainingChats(guestId) {
    const session = this.getOrCreateSession(guestId);
    if (!session) return 0;
    return Math.max(0, config.maxGuestChats - session.messageCount);
  }

  // Soft purge sessions older than 24h to avoid memory leaks
  cleanupStaleSessions() {
    const maxAge = 24 * 60 * 60 * 1000;
    const now = Date.now();
    for (const [id, session] of this.guestSessions.entries()) {
      if (now - session.lastActive > maxAge) {
        this.guestSessions.delete(id);
      }
    }
  }
}

export const sessionService = new SessionService();
