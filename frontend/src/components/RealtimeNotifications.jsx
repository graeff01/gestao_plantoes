import React, { useEffect, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';

const RealtimeNotifications = () => {
  const { isConnected, lastMessage } = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      const newNotification = {
        id: Date.now(),
        type: lastMessage.type,
        message: getNotificationMessage(lastMessage),
        timestamp: lastMessage.timestamp,
        data: lastMessage.data
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Manter apenas 5 notificações
      setShowNotification(true);

      // Auto-hide após 5 segundos
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [lastMessage]);

  const getNotificationMessage = (message) => {
    switch (message.type) {
      case 'plantao_updated':
        return `Plantão atualizado: ${message.data.plantao?.data || 'Data não disponível'}`;
      case 'alocacao_created':
        return `Novo plantonista alocado!`;
      case 'ranking_updated':
        return 'Ranking atualizado!';
      default:
        return 'Nova atualização disponível';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'plantao_updated':
        return '📅';
      case 'alocacao_created':
        return '👤';
      case 'ranking_updated':
        return '🏆';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'plantao_updated':
        return 'bg-blue-500';
      case 'alocacao_created':
        return 'bg-green-500';
      case 'ranking_updated':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Status de conexão - removido para evitar duplicação com "Sistema Operacional" */}
      {false && (
      <div className="fixed top-16 right-4 z-40">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>
      )}

      {/* Notificação flutuante */}
      {showNotification && notifications.length > 0 && (
        <div className="fixed top-16 right-4 z-50 animate-slide-in-right">
          <div className={`${getNotificationColor(notifications[0].type)} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{getNotificationIcon(notifications[0].type)}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{notifications[0].message}</p>
                <p className="text-xs opacity-90 mt-1">
                  {notifications[0].timestamp?.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de notificações (opcional - para mostrar histórico) */}
      <div className="hidden">
        {notifications.map(notification => (
          <div key={notification.id} className="notification-item">
            {notification.message}
          </div>
        ))}
      </div>
    </>
  );
};

export default RealtimeNotifications;