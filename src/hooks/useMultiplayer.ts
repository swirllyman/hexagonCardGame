import { useState, useEffect, useCallback } from 'react';
import type {
  MultiplayerRole,
  MultiplayerSeat,
  ConnectedPeer,
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
  const [localPlayerName, setLocalPlayerName] = useState<string>('Commander Duelist');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [seats, setSeats] = useState<MultiplayerSeat[]>([
    { id: 'player1', name: 'Commander Valerius', isAi: false, aiDifficulty: 'medium', teamId: 1, avatarUrl: 'sprites/portrait_valerius.svg' },
    { id: 'player2', name: 'Bot Kaelen', isAi: true, aiDifficulty: 'medium', teamId: 2, avatarUrl: 'sprites/portrait_kaelen.svg' },
    { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium', teamId: 3, avatarUrl: 'sprites/portrait_seraphina.svg' },
    { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium', teamId: 4, avatarUrl: 'sprites/portrait_ignis.svg' },
  ]);

  const [connectedPeers, setConnectedPeers] = useState<ConnectedPeer[]>([]);
  const [activeEmotes, setActiveEmotes] = useState<EmotePayload[]>([]);

  // Auto-cleanup expired tactical shouts / emotes after 4 seconds
  useEffect(() => {
    if (activeEmotes.length === 0) return;
    const now = Date.now();
    const oldestTimestamp = Math.min(...activeEmotes.map((e) => e.timestamp));
    const timeUntilExpiry = Math.max(50, 4000 - (now - oldestTimestamp));

    const timer = setTimeout(() => {
      setActiveEmotes((prev) => prev.filter((e) => Date.now() - e.timestamp < 4000));
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [activeEmotes]);

  // Auto-sync localPlayerId whenever seats or localPeerId changes
  useEffect(() => {
    if (!localPeerId) return;
    const assignedSeat = seats.find((s) => s.peerId === localPeerId);
    if (assignedSeat) {
      setLocalPlayerId(assignedSeat.id);
    }
  }, [seats, localPeerId]);

  // Host broadcasts lobby state to all connected peers
  const broadcastLobbyState = useCallback(
    (currentSeats: MultiplayerSeat[], peers: ConnectedPeer[]) => {
      if (multiplayerService.isHost) {
        multiplayerService.sendMessage({
          type: 'LOBBY_STATE',
          senderPeerId: multiplayerService.peerId || '',
          payload: {
            seats: currentSeats,
            connectedPeers: peers,
          },
        });
      }
    },
    []
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    multiplayerService.disconnect();
    setRole('single');
    setRoomCode(null);
    setLocalPeerId(null);
    setLocalPlayerId('player1');
    setConnectedPeers([]);
  }, []);

  // Kick all players (Host only)
  const kickAllPeers = useCallback(() => {
    if (multiplayerService.isHost) {
      multiplayerService.disconnectAllPeers();
      setSeats((prevSeats) =>
        prevSeats.map((seat) => {
          if (seat.peerId && seat.peerId !== localPeerId) {
            return {
              ...seat,
              peerId: undefined,
              isAi: true,
              name: `Bot ${seat.id.replace('player', 'P')}`,
            };
          }
          return seat;
        })
      );
      setConnectedPeers((prevPeers) => prevPeers.filter((p) => p.peerId === localPeerId));
    }
  }, [localPeerId]);

  // Listen for peer network messages
  useEffect(() => {
    const unsubscribeMessage = multiplayerService.onMessage((msg: NetworkMessage) => {
      switch (msg.type) {
        case 'LOBBY_STATE': {
          if (msg.payload?.seats) {
            setSeats(msg.payload.seats);
          }
          if (msg.payload?.connectedPeers) {
            setConnectedPeers(msg.payload.connectedPeers);
          }
          break;
        }

        case 'CLAIM_SEAT': {
          if (multiplayerService.isHost && msg.senderPeerId && msg.payload?.seatId) {
            const targetSeatId: PlayerId = msg.payload.seatId;
            const requestedName: string = msg.payload.playerName || `Duelist ${msg.senderPeerId.slice(-4)}`;

            setSeats((prevSeats) => {
              const updatedSeats = prevSeats.map((seat) => {
                // If this seat was previously held by sender, vacate it
                if (seat.peerId === msg.senderPeerId && seat.id !== targetSeatId) {
                  return {
                    ...seat,
                    peerId: undefined,
                    isAi: true,
                    name: `Bot ${seat.id.replace('player', 'P')}`,
                  };
                }
                // Claim target seat
                if (seat.id === targetSeatId) {
                  return {
                    ...seat,
                    peerId: msg.senderPeerId,
                    isAi: false,
                    name: requestedName,
                  };
                }
                return seat;
              });

              setConnectedPeers((prevPeers) => {
                const updatedPeers = prevPeers.map((p) =>
                  p.peerId === msg.senderPeerId
                    ? { ...p, assignedSeatId: targetSeatId, name: requestedName }
                    : p
                );
                broadcastLobbyState(updatedSeats, updatedPeers);
                return updatedPeers;
              });

              return updatedSeats;
            });
          }
          break;
        }

        case 'RELEASE_SEAT': {
          if (multiplayerService.isHost && msg.senderPeerId && msg.payload?.seatId) {
            const seatToRelease: PlayerId = msg.payload.seatId;
            setSeats((prevSeats) => {
              const updatedSeats = prevSeats.map((seat) => {
                if (seat.id === seatToRelease && seat.peerId === msg.senderPeerId) {
                  return {
                    ...seat,
                    peerId: undefined,
                    isAi: true,
                    name: `Bot ${seat.id.replace('player', 'P')}`,
                  };
                }
                return seat;
              });

              setConnectedPeers((prevPeers) => {
                const updatedPeers = prevPeers.map((p) =>
                  p.peerId === msg.senderPeerId ? { ...p, assignedSeatId: null } : p
                );
                broadcastLobbyState(updatedSeats, updatedPeers);
                return updatedPeers;
              });

              return updatedSeats;
            });
          }
          break;
        }

        case 'UPDATE_PLAYER_INFO': {
          if (msg.senderPeerId && msg.payload?.name) {
            const newName = msg.payload.name;
            if (multiplayerService.isHost) {
              setSeats((prevSeats) => {
                const updatedSeats = prevSeats.map((seat) =>
                  seat.peerId === msg.senderPeerId ? { ...seat, name: newName } : seat
                );
                setConnectedPeers((prevPeers) => {
                  const updatedPeers = prevPeers.map((p) =>
                    p.peerId === msg.senderPeerId ? { ...p, name: newName } : p
                  );
                  broadcastLobbyState(updatedSeats, updatedPeers);
                  return updatedPeers;
                });
                return updatedSeats;
              });
            }
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

    // Handle incoming peer connections on Host
    const unsubscribeConnect = multiplayerService.onPeerConnect((peerId) => {
      console.log('[useMultiplayer] Peer connected:', peerId);
      if (multiplayerService.isHost) {
        setSeats((prevSeats) => {
          // Find first available AI seat
          const availSeat = prevSeats.find((s) => s.isAi && !s.peerId);
          const assignedSeatId = availSeat ? availSeat.id : null;
          const peerName = `Duelist ${peerId.slice(-4)}`;

          const updatedSeats = prevSeats.map((seat) => {
            if (availSeat && seat.id === availSeat.id) {
              return {
                ...seat,
                peerId,
                isAi: false,
                name: peerName,
              };
            }
            return seat;
          });

          setConnectedPeers((prevPeers) => {
            if (prevPeers.some((p) => p.peerId === peerId)) return prevPeers;
            const newPeer: ConnectedPeer = {
              peerId,
              name: peerName,
              isHost: false,
              isOnline: true,
              assignedSeatId,
            };
            const updatedPeers = [...prevPeers, newPeer];
            broadcastLobbyState(updatedSeats, updatedPeers);
            return updatedPeers;
          });

          return updatedSeats;
        });
      }
    });

    // Handle peer disconnects on Host
    const unsubscribeDisconnect = multiplayerService.onPeerDisconnect((peerId) => {
      console.log('[useMultiplayer] Peer disconnected:', peerId);
      if (multiplayerService.isHost) {
        setConnectedPeers((prevPeers) => {
          const updatedPeers = prevPeers.filter((p) => p.peerId !== peerId);
          setSeats((prevSeats) => {
            const updatedSeats = prevSeats.map((seat) => {
              if (seat.peerId === peerId) {
                return {
                  ...seat,
                  peerId: undefined,
                  isAi: true,
                  name: `Bot ${seat.id.replace('player', 'P')}`,
                };
              }
              return seat;
            });
            broadcastLobbyState(updatedSeats, updatedPeers);
            return updatedSeats;
          });
          return updatedPeers;
        });
      } else {
        leaveRoom();
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, [seats, broadcastLobbyState, leaveRoom]);

  // Host a room
  const hostRoom = useCallback(
    async (customCode?: string, preferredName?: string) => {
      setIsConnecting(true);
      setConnectError(null);
      try {
        const code = multiplayerService.generateRoomCode();
        const peerId = await multiplayerService.hostRoom(customCode || code);
        setRole('host');
        setRoomCode(multiplayerService.roomCode);
        setLocalPeerId(peerId);
        setLocalPlayerId('player1');

        const initialHostName = preferredName?.trim() || 'Commander Host';
        setLocalPlayerName(initialHostName);

        const initialSeats: MultiplayerSeat[] = [
          { id: 'player1', name: initialHostName, isAi: false, peerId, aiDifficulty: 'medium', teamId: 1, avatarUrl: 'sprites/portrait_valerius.svg' },
          { id: 'player2', name: 'Bot Kaelen', isAi: true, aiDifficulty: 'medium', teamId: 2, avatarUrl: 'sprites/portrait_kaelen.svg' },
          { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium', teamId: 3, avatarUrl: 'sprites/portrait_seraphina.svg' },
          { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium', teamId: 4, avatarUrl: 'sprites/portrait_ignis.svg' },
        ];

        const initialConnectedPeers: ConnectedPeer[] = [
          {
            peerId,
            name: initialHostName,
            isHost: true,
            isOnline: true,
            assignedSeatId: 'player1',
          },
        ];

        setSeats(initialSeats);
        setConnectedPeers(initialConnectedPeers);
      } catch (err: any) {
        setConnectError(err?.message || 'Failed to host room');
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  // Join a room
  const joinRoom = useCallback(async (codeToJoin: string, preferredName?: string) => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const peerId = await multiplayerService.joinRoom(codeToJoin);
      setRole('client');
      setRoomCode(codeToJoin.toUpperCase());
      setLocalPeerId(peerId);
      const chosenName = preferredName?.trim() || `Commander Duelist ${peerId.slice(-4)}`;
      setLocalPlayerName(chosenName);

      // Notify host of info
      multiplayerService.sendMessage({
        type: 'UPDATE_PLAYER_INFO',
        senderPeerId: peerId,
        payload: { name: chosenName },
      });
    } catch {
      setConnectError('Room not found or host unavailable.');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Claim a seat
  const claimSeat = useCallback(
    (seatId: PlayerId) => {
      if (!localPeerId) return;

      if (multiplayerService.isHost) {
        // Host directly claims seat
        setSeats((prevSeats) => {
          const updatedSeats = prevSeats.map((seat) => {
            if (seat.peerId === localPeerId && seat.id !== seatId) {
              return {
                ...seat,
                peerId: undefined,
                isAi: true,
                name: `Bot ${seat.id.replace('player', 'P')}`,
              };
            }
            if (seat.id === seatId) {
              return {
                ...seat,
                peerId: localPeerId,
                isAi: false,
                name: localPlayerName,
              };
            }
            return seat;
          });

          setConnectedPeers((prevPeers) => {
            const updatedPeers = prevPeers.map((p) =>
              p.peerId === localPeerId
                ? { ...p, assignedSeatId: seatId, name: localPlayerName }
                : p
            );
            broadcastLobbyState(updatedSeats, updatedPeers);
            return updatedPeers;
          });

          return updatedSeats;
        });
        setLocalPlayerId(seatId);
      } else {
        // Client sends CLAIM_SEAT to Host
        multiplayerService.sendMessage({
          type: 'CLAIM_SEAT',
          senderPeerId: localPeerId,
          payload: { seatId, playerName: localPlayerName },
        });
      }
    },
    [localPeerId, localPlayerName, broadcastLobbyState]
  );

  // Release current seat
  const releaseSeat = useCallback(
    (seatId: PlayerId) => {
      if (!localPeerId) return;

      if (multiplayerService.isHost) {
        setSeats((prevSeats) => {
          const updatedSeats = prevSeats.map((seat) => {
            if (seat.id === seatId && seat.peerId === localPeerId) {
              return {
                ...seat,
                peerId: undefined,
                isAi: true,
                name: `Bot ${seat.id.replace('player', 'P')}`,
              };
            }
            return seat;
          });

          setConnectedPeers((prevPeers) => {
            const updatedPeers = prevPeers.map((p) =>
              p.peerId === localPeerId ? { ...p, assignedSeatId: null } : p
            );
            broadcastLobbyState(updatedSeats, updatedPeers);
            return updatedPeers;
          });

          return updatedSeats;
        });
      } else {
        multiplayerService.sendMessage({
          type: 'RELEASE_SEAT',
          senderPeerId: localPeerId,
          payload: { seatId },
        });
      }
    },
    [localPeerId, broadcastLobbyState]
  );

  // Update Player Name
  const updatePlayerName = useCallback(
    (newName: string) => {
      setLocalPlayerName(newName);
      if (!localPeerId) return;

      if (multiplayerService.isHost) {
        setSeats((prevSeats) => {
          const updatedSeats = prevSeats.map((seat) =>
            seat.peerId === localPeerId ? { ...seat, name: newName } : seat
          );
          setConnectedPeers((prevPeers) => {
            const updatedPeers = prevPeers.map((p) =>
              p.peerId === localPeerId ? { ...p, name: newName } : p
            );
            broadcastLobbyState(updatedSeats, updatedPeers);
            return updatedPeers;
          });
          return updatedSeats;
        });
      } else {
        multiplayerService.sendMessage({
          type: 'UPDATE_PLAYER_INFO',
          senderPeerId: localPeerId,
          payload: { name: newName },
        });
      }
    },
    [localPeerId, broadcastLobbyState]
  );

  // Host operations to configure seats directly (e.g. AI toggle, bot difficulty)
  const updateSeats = useCallback(
    (newSeats: MultiplayerSeat[]) => {
      setSeats(newSeats);
      if (multiplayerService.isHost) {
        broadcastLobbyState(newSeats, connectedPeers);
      }
    },
    [connectedPeers, broadcastLobbyState]
  );

  // Send Emote
  const sendEmote = useCallback(
    (senderId: PlayerId, senderName: string, emote: EmoteType, text: string) => {
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
    },
    []
  );

  // Send Lock-In Queue to Network
  const sendLockInQueue = useCallback((playerId: PlayerId, programmedQueue: (Card | null)[]) => {
    multiplayerService.sendMessage({
      type: 'LOCK_IN_QUEUE',
      senderPeerId: multiplayerService.peerId || '',
      senderPlayerId: playerId,
      payload: { playerId, programmedQueue },
    });
  }, []);



  return {
    role,
    roomCode,
    localPeerId,
    localPlayerId,
    localPlayerName,
    setLocalPlayerId,
    seats,
    connectedPeers,
    isConnecting,
    connectError,
    activeEmotes,
    hostRoom,
    joinRoom,
    claimSeat,
    releaseSeat,
    updatePlayerName,
    updateSeats,
    sendEmote,
    sendLockInQueue,
    kickAllPeers,
    leaveRoom,
  };
}
