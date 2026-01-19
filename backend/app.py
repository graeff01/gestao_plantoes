from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit
from flask_caching import Cache
from config import config
from models import db
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def create_app(config_name='development'):
    """Factory function para criar a aplicação Flask"""
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Inicializar extensões
    import logging
    
    # Configurar logs baseado no ambiente
    if config_name == 'production':
        logging.getLogger('flask_cors').level = logging.WARNING
        logging.getLogger('werkzeug').level = logging.WARNING
    else:
        logging.getLogger('flask_cors').level = logging.DEBUG
    
    db.init_app(app)
    
    # Configurar Cache Redis
    cache = Cache()
    try:
        cache.init_app(app)
        print("✅ Redis cache configurado com sucesso")
    except Exception as e:
        print(f"⚠️ Erro ao configurar cache Redis: {e}")
        # Fallback para SimpleCache se Redis não estiver disponível
        app.config['CACHE_TYPE'] = 'simple'
        cache.init_app(app)
        print("📝 Usando SimpleCache como fallback")
    
    # Configurar CORS para Socket.IO
    CORS(app, resources={
        r"/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "supports_credentials": True
        }
    })
    
    # Log de requisições apenas em desenvolvimento
    @app.before_request
    def log_request_info():
        if app.debug and config_name != 'production':
            app.logger.debug(f"Handling {request.method} request from {request.remote_addr} to {request.path}")
            app.logger.debug(f"Origin: {request.headers.get('Origin')}")

    JWTManager(app)
    Bcrypt(app)
    
    # Configurar Socket.IO
    socketio = SocketIO(app, cors_allowed_origins=app.config['CORS_ORIGINS'], 
                       logger=False, engineio_logger=False)
    
    # Registrar blueprints
    from routes.auth import auth_bp
    from routes.pontuacao import pontuacao_bp
    from routes.plantoes import plantao_bp
    from routes.logs import logs_bp
    from routes.health import health_bp
    from routes.bi import bi_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(pontuacao_bp)
    app.register_blueprint(plantao_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(bi_bp)
    
    # Configurar eventos Socket.IO
    @socketio.on('connect')
    def handle_connect():
        print(f'Cliente conectado: {request.sid}')
        emit('connected', {'data': 'Conectado ao servidor de plantões'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Cliente desconectado: {request.sid}')
    
    @socketio.on('join_room')
    def handle_join_room(data):
        """Usuário entra em sala específica (ex: sala de plantonistas)"""
        room = data.get('room', 'general')
        socketio.join_room(room)
        print(f'Cliente {request.sid} entrou na sala {room}')
    
    # Adicionar SocketIO e Cache ao contexto da aplicação
    app.socketio = socketio
    app.cache = cache
    
    # Rotas de saúde e info
    @app.route('/')
    def index():
        return jsonify({
            'nome': 'Sistema de Gestão de Plantões',
            'versao': '1.0.0',
            'status': 'online'
        })
    
    @app.route('/api/health')
    def health():
        """Endpoint de health check"""
        try:
            # Testar conexão com banco
            db.session.execute(db.text('SELECT 1'))
            db_status = 'ok'
        except Exception as e:
            db_status = f'erro: {str(e)}'
        
        return jsonify({
            'status': 'ok' if db_status == 'ok' else 'degraded',
            'database': db_status,
            'timestamp': os.popen('date').read().strip()
        })
    
    # Handler de erros
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'sucesso': False,
            'mensagem': 'Endpoint não encontrado'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            'sucesso': False,
            'mensagem': 'Erro interno do servidor'
        }), 500
    
    # Criar tabelas se não existirem
    with app.app_context():
        db.create_all()
        
        # Auto-seed: Tenta criar usuário admin. Se não existir, popula tudo.
        try:
            from models import Usuario
            if not Usuario.query.filter_by(email='admin@veloce.com').first():
                print("⚠️ Banco vazio detectado. Iniciando auto-seed...")
                from seed_data import populate_db
                populate_db()
                print("✅ Auto-seed concluído com sucesso!")
        except Exception as e:
            print(f"❌ Erro no auto-seed: {e}")
    
    return app, socketio


if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'development')
    app, socketio = create_app(env)
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print(f"""
    ║   Sistema de Gestão de Plantões - Veloce          ║
    ║   Backend API rodando em: http://localhost:{port}   ║
    ║   Ambiente: {env}                          ║
    ║   CORS Origins: {app.config['CORS_ORIGINS']}   ║
    ║   SocketIO: Habilitado para real-time updates     ║
    ╚════════════════════════════════════════════════════╝
    """)
    
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=debug
    )
