import { useState, useEffect, useCallback } from 'react';
import type {
  MultiplayerRole,
  MultiplayerSeat,
  EmotePayload,
  EmoteType,
  PlayerId,
  NetworkMessage,
  Card,
} from '../types/game';
import { multiplayerService } from '../services/multiplayerService';

export function useMultiplayer() {
  const [role, setRole] = useState<MultiplayerRole>('single');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [localPeerId, setLocalPeerId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>('player1');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [seats, setSeats] = useState<MultiplayerSeat[]>([
    { id: 'player1', name: 'Commander Valerius', isAi: false, aiDifficulty: 'medium' },
    { id: 'player2', name: 'Bot Kaelen', isAi: true, aiDifficulty: 'medium' },
    { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium' },
    { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium' },
  ]);

  const [activeEmotes, setActiveEmotes] = useState<EmotePayload[]>([]);

  // Listen for peer network messages
  useEffect(() => {
    const unsubscribe = multiplayerService.onMessage((msg: NetworkMessage) => {
      switch (msg.type) {
        case 'LOBBY_STATE': {
          if (msg.payload?.seats) {
            setSeats(msg.payload.seats);
          }
          break;
        }
        case 'EMOTE': {
          if (msg.payload) {
            const emotePayload = msg.payload as EmotePayload;
            setActiveEmotes((prev) => [...prev.slice(-9), emotePayload]);
          }
          break;
        }
      }
    });

    const unsubscribeConnect = multiplayerService.onPeerConnect((peerId) => {
      console.log('[useMultiplayer] Peer connected:', peerId);
      // If host, sync lobby seats to new peer
      if (multiplayerService.isHost) {
        multiplayerService.sendMessage({
          type: 'LOBBY_STATE',
          senderPeerId: multiplayerService.peerId || '',
          payload: { seats },
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeConnect();
    };
  }, [seats]);

  // Host a room
  const hostRoom = useCallback(async (customCode?: string) => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const code = multiplayerService.generateRoomCode();
      const peerId = await multiplayerService.hostRoom(customCode || code);
      setRole('host');
      setRoomCode(multiplayerService.roomCode);
      setLocalPeerId(peerId);
      setLocalPlayerId('player1');

      // Update seats so Host is P1
      setSeats((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], isAi: false, peerId, name: 'Commander Host (P1)' };
        return updated;
      });
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to host room');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Join a room
  const joinRoom = useCallback(async (codeToJoin: string) => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const peerId = await multiplayerService.joinRoom(codeToJoin);
      setRole('client');
      setRoomCode(codeToJoin.toUpperCase());
      setLocalPeerId(peerId);
    } catch {
      setConnectError('Room not found or host unavailable.');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Update Seats (Host operation)
  const updateSeats = useCallback((newSeats: MultiplayerSeat[]) => {
    setSeats(newSeats);
    if (multiplayerService.isHost) {
      multiplayerService.sendMessage({
        type: 'LOBBY_STATE',
        senderPeerId: multiplayerService.peerId || '',
        payload: { seats: newSeats },
      });
    }
  }, []);

  // Send Emote
  const sendEmote = useCallback((senderId: PlayerId, senderName: string, emote: EmoteType, text: string) => {
    const payload: EmotePayload = {
      id: Math.random().toString(36).substring(2, 9),
      senderId,
      senderName,
      emote,
      text,
      timestamp: Date.now(),
    };

    setActiveEmotes((prev) => [...prev.slice(-9), payload]);

    multiplayerService.sendMessage({
      type: 'EMOTE',
      senderPeerId: multiplayerService.peerId || '',
      senderPlayerId: senderId,
      payload,
    });
  }, []);

  // Send Lock-In Queue to Network
  const sendLockInQueue = useCallback((playerId: PlayerId, programmedQueue: (Card | null)[]) => {
    multiplayerService.sendMessage({
      type: 'LOCK_IN_QUEUE',
      senderPeerId: multiplayerService.peerId || '',
      senderPlayerId: playerId,
      payload: { playerId, programmedQueue },
    });
  }, []);

  // Leave room
  const leaveRoom = useCallback(() => {
    multiplayerService.disconnect();
    setRole('single');
    setRoomCode(null);
    setLocalPeerId(null);
    setLocalPlayerId('player1');
  }, []);

  return {
    role,
    roomCode,
    localPeerId,
    localPlayerId,
    setLocalPlayerId,
    seats,
    isConnecting,
    connectError,
    activeEmotes,
    hostRoom,
    joinRoom,
    updateSeats,
    sendEmote,
    sendLockInQueue,
    leaveRoom,
  };
}
