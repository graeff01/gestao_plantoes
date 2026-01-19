"""
Utilitários para eventos em tempo real via WebSocket
"""
from flask import current_app
from flask_socketio import emit


def notify_plantao_update(plantao_data, event_type='plantao_updated'):
    """
    Notifica todos os clientes sobre atualizações de plantões
    
    Args:
        plantao_data (dict): Dados do plantão
        event_type (str): Tipo do evento ('plantao_updated', 'plantao_created', etc.)
    """
    try:
        if hasattr(current_app, 'socketio'):
            current_app.socketio.emit(event_type, {
                'plantao': plantao_data,
                'timestamp': plantao_data.get('updated_at') or plantao_data.get('created_at')
            }, room='plantonistas')
            print(f"✅ WebSocket: {event_type} enviado para sala 'plantonistas'")
        else:
            print("⚠️ WebSocket: SocketIO não configurado")
    except Exception as e:
        print(f"❌ Erro no WebSocket: {e}")


def notify_alocacao_update(alocacao_data, event_type='alocacao_updated'):
    """
    Notifica sobre atualizações de alocações de plantões
    
    Args:
        alocacao_data (dict): Dados da alocação
        event_type (str): Tipo do evento
    """
    try:
        if hasattr(current_app, 'socketio'):
            current_app.socketio.emit(event_type, {
                'alocacao': alocacao_data,
                'timestamp': alocacao_data.get('confirmado_em')
            }, room='plantonistas')
            print(f"✅ WebSocket: {event_type} enviado")
        else:
            print("⚠️ WebSocket: SocketIO não configurado")
    except Exception as e:
        print(f"❌ Erro no WebSocket: {e}")


def notify_ranking_update(ranking_data):
    """
    Notifica sobre atualizações de ranking
    """
    try:
        if hasattr(current_app, 'socketio'):
            current_app.socketio.emit('ranking_updated', {
                'rankings': ranking_data,
                'timestamp': None
            }, room='plantonistas')
            print(f"✅ WebSocket: ranking_updated enviado")
        else:
            print("⚠️ WebSocket: SocketIO não configurado")
    except Exception as e:
        print(f"❌ Erro no WebSocket: {e}")


def notify_user(user_id, message, event_type='notification'):
    """
    Notifica um usuário específico
    """
    try:
        if hasattr(current_app, 'socketio'):
            current_app.socketio.emit(event_type, {
                'message': message,
                'user_id': user_id,
                'timestamp': None
            }, room=f'user_{user_id}')
            print(f"✅ WebSocket: {event_type} enviado para user_{user_id}")
        else:
            print("⚠️ WebSocket: SocketIO não configurado")
    except Exception as e:
        print(f"❌ Erro no WebSocket: {e}")