import Peer, { DataConnection } from 'peerjs';
import type { NetworkMessage } from '../types/game';

type MessageHandler = (msg: NetworkMessage) => void;
type ConnectionHandler = (peerId: string) => void;

class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  
  private messageListeners: Set<MessageHandler> = new Set();
  private connectListeners: Set<ConnectionHandler> = new Set();
  private disconnectListeners: Set<ConnectionHandler> = new Set();

  public peerId: string | null = null;
  public roomCode: string | null = null;
  public isHost: boolean = false;

  constructor() {
    // Setup local BroadcastChannel for zero-latency multi-tab testing
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.localBroadcastChannel = new BroadcastChannel('hex_clash_local_multiplayer');
      this.localBroadcastChannel.onmessage = (event) => {
        if (event.data && event.data.senderPeerId !== this.peerId) {
          this.notifyMessageListeners(event.data as NetworkMessage);
        }
      };
    }
  }

  // Generate 4-character random room code
  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HEX-${result}`;
  }

  // Host a new room
  public hostRoom(customCode?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = true;
      const code = (customCode || this.generateRoomCode()).toUpperCase();
      this.roomCode = code;

      try {
        // Create Peer with Room Code as Peer ID
        const peer = new Peer(code, {
          debug: 1,
        });

        this.peer = peer;

        peer.on('open', (id) => {
          this.peerId = id;
          resolve(id);
        });

        peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        peer.on('error', (err) => {
          console.warn('[Multiplayer] Peer error:', err);
          if (err.type === 'unavailable-id' && !customCode) {
            this.hostRoom().then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Join an existing room
  public joinRoom(roomCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = false;
      const cleanCode = roomCode.trim().toUpperCase();
      this.roomCode = cleanCode;

      try {
        const peer = new Peer({
          debug: 1,
        });
        this.peer = peer;

        peer.on('open', (id) => {
          this.peerId = id;
          const conn = peer.connect(cleanCode, { reliable: true });
          this.hostConnection = conn;
          this.setupConnection(conn);

          conn.on('open', () => {
            resolve(id);
          });

          conn.on('error', (err) => {
            reject(err);
          });
        });

        peer.on('error', (err) => {
          console.warn('[Multiplayer] Client Peer error:', err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private setupConnection(conn: DataConnection) {
    const peerId = conn.peer;

    conn.on('open', () => {
      this.connections.set(peerId, conn);
      this.notifyConnectListeners(peerId);
    });

    conn.on('data', (data) => {
      if (data && typeof data === 'object') {
        const msg = data as NetworkMessage;
        this.notifyMessageListeners(msg);

        // Host re-broadcasts messages to all other connected peers
        if (this.isHost) {
          this.broadcast(msg, peerId);
        }
      }
    });

    conn.on('close', () => {
      this.connections.delete(peerId);
      if (this.hostConnection?.peer === peerId) {
        this.hostConnection = null;
      }
      this.notifyDisconnectListeners(peerId);
    });

    conn.on('error', (err) => {
      console.warn(`[Multiplayer] Connection error with ${peerId}:`, err);
    });
  }

  // Send message to Host or Broadcast to all
  public sendMessage(msg: NetworkMessage) {
    if (!this.peerId) return;

    msg.senderPeerId = this.peerId;

    if (this.isHost) {
      this.broadcast(msg);
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }

    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage(msg);
      } catch {
        // Ignore serialization errors
      }
    }
  }

  // Broadcast message to all connected peers except excludePeerId
  public broadcast(msg: NetworkMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(msg);
      }
    });
  }

  // Event listener subscriptions
  public onMessage(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => { this.messageListeners.delete(handler); };
  }

  public onPeerConnect(handler: ConnectionHandler): () => void {
    this.connectListeners.add(handler);
    return () => { this.connectListeners.delete(handler); };
  }

  public onPeerDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectListeners.add(handler);
    return () => { this.disconnectListeners.delete(handler); };
  }

  private notifyMessageListeners(msg: NetworkMessage) {
    this.messageListeners.forEach((fn) => fn(msg));
  }

  private notifyConnectListeners(peerId: string) {
    this.connectListeners.forEach((fn) => fn(peerId));
  }

  private notifyDisconnectListeners(peerId: string) {
    this.disconnectListeners.forEach((fn) => fn(peerId));
  }

  // Disconnect & cleanup
  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.peerId = null;
    this.roomCode = null;
    this.isHost = false;
  }
}

export const multiplayerService = new MultiplayerService();
