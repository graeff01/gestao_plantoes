from flask import Blueprint, jsonify, current_app
from models import db
from datetime import datetime
import os
import psutil

health_bp = Blueprint('health', __name__, url_prefix='/api/health')


@health_bp.route('/', methods=['GET'])
def health_check():
    """Health check básico da API"""
    try:
        # Verificar conexão com banco
        db.session.execute('SELECT 1')
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return jsonify({
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'environment': os.getenv('FLASK_ENV', 'unknown')
    })


@health_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Métricas básicas do sistema"""
    try:
        # CPU e Memória
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        
        # Estatísticas do banco
        try:
            # Pool de conexões (se configurado)
            pool_info = {}
            if hasattr(db.engine, 'pool'):
                pool = db.engine.pool
                pool_info = {
                    'pool_size': pool.size(),
                    'checked_out': pool.checkedout(),
                    'overflow': pool.overflow(),
                    'checked_in': pool.checkedin()
                }
            
            # Query simples para testar latência
            start_time = datetime.utcnow()
            db.session.execute('SELECT 1')
            db_latency = (datetime.utcnow() - start_time).total_seconds() * 1000
            
        except Exception as e:
            db_latency = None
            pool_info = {'error': str(e)}
        
        return jsonify({
            'timestamp': datetime.utcnow().isoformat(),
            'system': {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available_gb': round(memory.available / (1024**3), 2)
            },
            'database': {
                'latency_ms': round(db_latency, 2) if db_latency else None,
                'pool': pool_info
            },
            'application': {
                'environment': os.getenv('FLASK_ENV'),
                'debug': current_app.debug
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Erro ao coletar métricas: {str(e)}',
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Verifica se a aplicação está pronta para receber tráfego"""
    try:
        # Verificar dependências críticas
        checks = {}
        
        # Banco de dados
        try:
            db.session.execute('SELECT COUNT(*) FROM usuarios LIMIT 1')
            checks['database'] = True
        except Exception:
            checks['database'] = False
        
        # Verificar se há usuários no sistema (seed executado)
        try:
            from models import Usuario
            admin_exists = Usuario.query.filter_by(tipo='admin').first() is not None
            checks['seed_data'] = admin_exists
        except Exception:
            checks['seed_data'] = False
        
        all_ready = all(checks.values())
        
        return jsonify({
            'ready': all_ready,
            'checks': checks,
            'timestamp': datetime.utcnow().isoformat()
        }), 200 if all_ready else 503
        
    except Exception as e:
        return jsonify({
            'ready': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503


@health_bp.route('/live', methods=['GET'])
def liveness_check():
    """Verifica se a aplicação está viva (para restart automático)"""
    try:
        # Check básico - se chegou até aqui, está vivo
        return jsonify({
            'alive': True,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception:
        return jsonify({
            'alive': False,
            'timestamp': datetime.utcnow().isoformat()
        }), 500