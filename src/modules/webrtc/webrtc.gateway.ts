import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebRtcService } from './webrtc.service';

interface RTCSessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

interface RTCIceCandidate {
  candidate: string;
  sdpMLineIndex: number | null;
  sdpMid: string | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/webrtc',
  transports: ['websocket', 'polling'],
})
export class WebRtcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebRtcGateway.name);

  constructor(private webRtcService: WebRtcService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up any sessions this client was part of
    // This will be handled by the session management
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string },
  ) {
    try {
      const { sessionId, userId } = data;

      // Join the session room
      await client.join(sessionId);

      // Create or get session
      let session = this.webRtcService.getSession(sessionId);
      if (!session) {
        this.webRtcService.createSession(sessionId, userId);
        session = this.webRtcService.getSession(sessionId);
      }

      // Add peer to session
      this.webRtcService.addPeerToSession(sessionId, client.id);

      // Send STUN servers to client
      client.emit('session-joined', {
        sessionId,
        stunServers: this.webRtcService.getStunServers(),
      });

      // Notify other peers in the session
      client.to(sessionId).emit('peer-joined', {
        peerId: client.id,
        userId,
      });

      this.logger.log(`Client ${client.id} joined session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error joining session: ${error.message}`);
      client.emit('error', { message: 'Failed to join session' });
    }
  }

  @SubscribeMessage('leave-session')
  async handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      const { sessionId } = data;

      // Leave the session room
      await client.leave(sessionId);

      // Remove peer from session
      this.webRtcService.removePeerFromSession(sessionId, client.id);

      // Notify other peers
      client.to(sessionId).emit('peer-left', {
        peerId: client.id,
      });

      this.logger.log(`Client ${client.id} left session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error leaving session: ${error.message}`);
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; offer: RTCSessionDescription; targetPeerId: string },
  ) {
    try {
      const { sessionId, offer, targetPeerId } = data;

      // Forward offer to target peer
      this.server.to(targetPeerId).emit('offer', {
        offer,
        fromPeerId: client.id,
        sessionId,
      });

      this.logger.log(`Offer forwarded from ${client.id} to ${targetPeerId}`);
    } catch (error: any) {
      this.logger.error(`Error handling offer: ${error.message}`);
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; answer: RTCSessionDescription; targetPeerId: string },
  ) {
    try {
      const { sessionId, answer, targetPeerId } = data;

      // Forward answer to target peer
      this.server.to(targetPeerId).emit('answer', {
        answer,
        fromPeerId: client.id,
        sessionId,
      });

      this.logger.log(`Answer forwarded from ${client.id} to ${targetPeerId}`);
    } catch (error: any) {
      this.logger.error(`Error handling answer: ${error.message}`);
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; candidate: RTCIceCandidate; targetPeerId: string },
  ) {
    try {
      const { sessionId, candidate, targetPeerId } = data;

      // Forward ICE candidate to target peer
      this.server.to(targetPeerId).emit('ice-candidate', {
        candidate,
        fromPeerId: client.id,
        sessionId,
      });
    } catch (error: any) {
      this.logger.error(`Error handling ICE candidate: ${error.message}`);
    }
  }

  @SubscribeMessage('cheating-detection')
  handleCheatingDetection(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; detectionData: any },
  ) {
    try {
      const { sessionId, detectionData } = data;

      // Broadcast cheating detection data to session (for monitoring)
      // In production, this would be sent to a separate monitoring service
      this.server.to(sessionId).emit('cheating-detection-update', {
        peerId: client.id,
        detectionData,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(
        `Cheating detection data received from ${client.id} in session ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(`Error handling cheating detection: ${error.message}`);
    }
  }
}
