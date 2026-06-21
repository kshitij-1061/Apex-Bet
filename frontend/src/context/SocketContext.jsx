import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const BACKEND_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [matches, setMatches] = useState([]);
  const [betNotifications, setBetNotifications] = useState([]);

  useEffect(() => {
    // Connect to WebSocket Server
    const socketInstance = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    setSocket(socketInstance);

    // Initial matches list
    socketInstance.on('initial_matches', (initialMatches) => {
      setMatches(initialMatches);
    });

    // New match created
    socketInstance.on('new_match', (newMatch) => {
      setMatches((prevMatches) => [newMatch, ...prevMatches].filter(
        (match, index, self) => self.findIndex((m) => m._id === match._id) === index
      ));
    });

    // Match status changes (upcoming -> live)
    socketInstance.on('match_status_change', ({ matchId, status, timeline }) => {
      setMatches((prevMatches) =>
        prevMatches.map((m) =>
          m._id === matchId ? { ...m, status, timeline } : m
        )
      );
    });

    // Live tick update (time, score, odds, timeline)
    socketInstance.on('match_update', ({ matchId, score, odds, gameTime, timeline }) => {
      setMatches((prevMatches) =>
        prevMatches.map((m) => {
          if (m._id === matchId) {
            // Check if score changed to flash items
            const scoreChanged = m.score.home !== score.home || m.score.away !== score.away;
            const homeOddsChanged = m.odds.home !== odds.home;
            const awayOddsChanged = m.odds.away !== odds.away;

            return {
              ...m,
              score,
              odds,
              gameTime,
              timeline,
              flashScore: scoreChanged,
              flashHomeOdds: homeOddsChanged ? (odds.home > m.odds.home ? 'up' : 'down') : null,
              flashAwayOdds: awayOddsChanged ? (odds.away > m.odds.away ? 'up' : 'down') : null,
            };
          }
          return m;
        })
      );

      // Reset flashes after 1 second
      setTimeout(() => {
        setMatches((prevMatches) =>
          prevMatches.map((m) =>
            m._id === matchId
              ? { ...m, flashScore: false, flashHomeOdds: null, flashAwayOdds: null }
              : m
          )
        );
      }, 1000);
    });

    // Match finishes
    socketInstance.on('match_finished', (finishedMatch) => {
      setMatches((prevMatches) =>
        prevMatches.filter((m) => m._id !== finishedMatch._id)
      );
    });

    // Real-time Bet Settlement Notification
    socketInstance.on('bet_settled', (data) => {
      console.log('Bet settled notification received:', data);
      const newNotification = {
        id: Date.now() + Math.random().toString(),
        ...data,
        read: false
      };
      setBetNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const authenticateSocket = (userId) => {
    if (socket && userId) {
      socket.emit('authenticate', userId);
    }
  };

  const removeNotification = (id) => {
    setBetNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const value = {
    socket,
    matches,
    betNotifications,
    authenticateSocket,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
