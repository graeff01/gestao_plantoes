from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import Usuario, db
import re


def token_required(fn):
    """Decorator para verificar token JWT"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    """Decorator para verificar se usuário é admin"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = Usuario.query.get(user_id)
        
        if not user or user.tipo != 'admin':
            return jsonify({'error': 'Acesso negado. Apenas administradores.'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


def gestor_required(fn):
    """Decorator para verificar se usuário é gestor ou admin"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = Usuario.query.get(user_id)
        
        if not user or user.tipo not in ['admin', 'gestor']:
            return jsonify({'error': 'Acesso negado. Apenas gestores e administradores.'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


def get_current_user():
    """Retorna o usuário atual baseado no JWT"""
    user_id = get_jwt_identity()
    return Usuario.query.get(user_id)


def validar_email(email):
    """Valida formato de email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validar_senha(senha):
    """Valida força da senha (mínimo 6 caracteres)"""
    return len(senha) >= 6


def criar_resposta(sucesso=True, mensagem='', dados=None, codigo=200):
    """Padroniza respostas da API"""
    resposta = {
        'sucesso': sucesso,
        'mensagem': mensagem
    }
    
    if dados is not None:
        resposta['dados'] = dados
    
    return jsonify(resposta), codigo


def criar_erro(mensagem, codigo=400):
    """Cria resposta de erro padronizada"""
    return criar_resposta(sucesso=False, mensagem=mensagem, codigo=codigo)


def log_acao(usuario_id, acao, tabela=None, registro_id=None, detalhes=None, ip_address=None):
    """Registra ação no log de auditoria"""
    from models import Log
    
    log = Log(
        usuario_id=usuario_id,
        acao=acao,
        tabela=tabela,
        registro_id=registro_id,
        detalhes=detalhes,
        ip_address=ip_address or request.remote_addr
    )
    
    db.session.add(log)
    db.session.commit()
