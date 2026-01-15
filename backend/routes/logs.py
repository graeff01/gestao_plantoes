from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import db, Log, Usuario
from utils.auth import gestor_required, criar_resposta, criar_erro
from datetime import datetime

logs_bp = Blueprint('logs', __name__, url_prefix='/api/logs')

@logs_bp.route('', methods=['GET'])
@gestor_required
def get_logs():
    """Retorna lista de logs administrativos"""
    try:
        # Paginação
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # Filtros básicos
        usuario_id = request.args.get('usuario_id')
        acao = request.args.get('acao')
        tabela = request.args.get('tabela')
        
        query = Log.query.order_by(Log.created_at.desc())
        
        if usuario_id:
            query = query.filter_by(usuario_id=usuario_id)
        if acao:
            query = query.filter(Log.acao.ilike(f'%{acao}%'))
        if tabela:
            query = query.filter_by(tabela=tabela)
            
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        logs = pagination.items
        
        return criar_resposta(dados={
            'logs': [l.to_dict() for l in logs],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page
        })
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar logs: {str(e)}', 500)
