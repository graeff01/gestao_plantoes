import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // URL do backend - ajustar conforme o ambiente
    const serverUrl = import.meta.env.DEV 
      ? 'http://localhost:5000' 
      : 'https://backend-production-1a58.up.railway.app';

    socketRef.current = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setIsConnected(true);
      
      // Entrar na sala de plantonistas
      socket.emit('join_room', { room: 'plantonistas' });
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('Recebido do servidor:', data);
    });

    // Eventos de plantões
    socket.on('plantao_updated', (data) => {
      console.log('📅 Plantão atualizado:', data);
      setLastMessage({
        type: 'plantao_updated',
        data: data,
        timestamp: new Date()
      });
    });

    socket.on('alocacao_created', (data) => {
      console.log('👤 Nova alocação:', data);
      setLastMessage({
        type: 'alocacao_created', 
        data: data,
        timestamp: new Date()
      });
    });

    socket.on('ranking_updated', (data) => {
      console.log('🏆 Ranking atualizado:', data);
      setLastMessage({
        type: 'ranking_updated',
        data: data,
        timestamp: new Date()
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket não conectado');
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
    socket: socketRef.current
  };
};

export default useWebSocket;