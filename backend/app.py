from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
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
    db.init_app(app)
        CORS(app, resources={
        r"/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    JWTManager(app)
    Bcrypt(app)
    
    # Registrar blueprints
    from routes.auth import auth_bp
    from routes.pontuacao import pontuacao_bp
    from routes.plantoes import plantao_bp
    from routes.logs import logs_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(pontuacao_bp)
    app.register_blueprint(plantao_bp)
    app.register_blueprint(logs_bp)
    
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
    
    return app


if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'development')
    app = create_app(env)
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print(f"""
    ╔════════════════════════════════════════════════════╗
    ║   Sistema de Gestão de Plantões - Veloce          ║
    ║   Backend API rodando em: http://localhost:{port}   ║
    ║   Ambiente: {env}                          ║
    ╚════════════════════════════════════════════════════╝
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
