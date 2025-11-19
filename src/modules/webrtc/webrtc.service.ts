import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebRtcService {
  private readonly logger = new Logger(WebRtcService.name);
  private readonly stunServers: Array<{ urls: string }>;
  private activeSessions: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {
    const stunConfig =
      this.configService.get<string>('WEBRTC_STUN_SERVERS') ??
      'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302';

    this.stunServers = stunConfig.split(',').map((url) => ({
      urls: url.trim(),
    }));

    this.logger.log(`WebRTC service initialized with ${this.stunServers.length} STUN servers`);
  }

  getStunServers(): Array<{ urls: string }> {
    return this.stunServers;
  }

  createSession(sessionId: string, userId: string): void {
    this.activeSessions.set(sessionId, {
      sessionId,
      userId,
      createdAt: new Date(),
      peers: new Set(),
    });
    this.logger.log(`WebRTC session created: ${sessionId}`);
  }

  addPeerToSession(sessionId: string, peerId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.peers.add(peerId);
      this.logger.log(`Peer ${peerId} added to session ${sessionId}`);
    }
  }

  removePeerFromSession(sessionId: string, peerId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.peers.delete(peerId);
      if (session.peers.size === 0) {
        this.activeSessions.delete(sessionId);
        this.logger.log(`Session ${sessionId} closed (no peers)`);
      }
    }
  }

  getSession(sessionId: string): any {
    return this.activeSessions.get(sessionId);
  }

  getAllSessions(): Array<any> {
    return Array.from(this.activeSessions.values());
  }
}
