from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, Usuario, Plantonista
from utils.auth import validar_email, validar_senha, criar_resposta, criar_erro, log_acao, gestor_required
import uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
bcrypt = Bcrypt()


@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint de login"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        senha = data.get('senha')
        
        if not email or not senha:
            return criar_erro('Email e senha são obrigatórios', 400)
        
        # Buscar usuário
        usuario = Usuario.query.filter_by(email=email).first()
        
        if not usuario or not bcrypt.check_password_hash(usuario.senha, senha):
            return criar_erro('Email ou senha inválidos', 401)
        
        if not usuario.ativo:
            return criar_erro('Usuário inativo', 403)
        
        # Criar tokens
        access_token = create_access_token(identity=str(usuario.id))
        refresh_token = create_refresh_token(identity=str(usuario.id))
        
        # Log da ação
        log_acao(usuario.id, 'login', ip_address=request.remote_addr)
        
        return criar_resposta(
            mensagem='Login realizado com sucesso',
            dados={
                'access_token': access_token,
                'refresh_token': refresh_token,
                'usuario': usuario.to_dict()
            }
        )
        
    except Exception as e:
        return criar_erro(f'Erro ao fazer login: {str(e)}', 500)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Endpoint de registro de novo usuário"""
    try:
        data = request.get_json()
        
        nome = data.get('nome')
        email = data.get('email')
        senha = data.get('senha')
        tipo = data.get('tipo', 'plantonista')
        
        # Validações
        if not nome or not email or not senha:
            return criar_erro('Nome, email e senha são obrigatórios', 400)
        
        if not validar_email(email):
            return criar_erro('Email inválido', 400)
        
        if not validar_senha(senha):
            return criar_erro('Senha deve ter no mínimo 6 caracteres', 400)
        
        if tipo not in ['admin', 'gestor', 'plantonista']:
            return criar_erro('Tipo de usuário inválido', 400)
        
        # Verificar se email já existe
        if Usuario.query.filter_by(email=email).first():
            return criar_erro('Email já cadastrado', 400)
        
        # Criar usuário
        senha_hash = bcrypt.generate_password_hash(senha).decode('utf-8')
        
        usuario = Usuario(
            nome=nome,
            email=email,
            senha=senha_hash,
            tipo=tipo
        )
        
        db.session.add(usuario)
        db.session.flush()
        
        # Se for plantonista, criar registro na tabela plantonistas
        if tipo == 'plantonista':
            plantonista = Plantonista(
                usuario_id=usuario.id
            )
            db.session.add(plantonista)
        
        db.session.commit()
        
        # Log da ação
        log_acao(usuario.id, 'registro', 'usuarios', usuario.id, ip_address=request.remote_addr)
        
        return criar_resposta(
            mensagem='Usuário cadastrado com sucesso',
            dados={'usuario': usuario.to_dict()},
            codigo=201
        )
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao cadastrar usuário: {str(e)}', 500)


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Endpoint para renovar access token"""
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)
        
        return criar_resposta(
            mensagem='Token renovado com sucesso',
            dados={'access_token': access_token}
        )
        
    except Exception as e:
        return criar_erro(f'Erro ao renovar token: {str(e)}', 500)


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Retorna dados do usuário logado"""
    try:
        user_id = get_jwt_identity()
        usuario = Usuario.query.get(user_id)
        
        if not usuario:
            return criar_erro('Usuário não encontrado', 404)
        
        dados = usuario.to_dict()
        
        # Se for plantonista, incluir dados adicionais
        if usuario.tipo == 'plantonista' and usuario.plantonista:
            dados['plantonista'] = usuario.plantonista.to_dict()
        
        return criar_resposta(dados=dados)
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar dados do usuário: {str(e)}', 500)


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Endpoint para alterar senha"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        senha_atual = data.get('senha_atual')
        senha_nova = data.get('senha_nova')
        
        if not senha_atual or not senha_nova:
            return criar_erro('Senha atual e nova senha são obrigatórias', 400)
        
        if not validar_senha(senha_nova):
            return criar_erro('Nova senha deve ter no mínimo 6 caracteres', 400)
        
        # Buscar usuário
        usuario = Usuario.query.get(user_id)
        
        if not usuario:
            return criar_erro('Usuário não encontrado', 404)
        
        # Verificar senha atual
        if not bcrypt.check_password_hash(usuario.senha, senha_atual):
            return criar_erro('Senha atual incorreta', 401)
        
        # Atualizar senha
        usuario.senha = bcrypt.generate_password_hash(senha_nova).decode('utf-8')
        db.session.commit()
        
        # Log da ação
        log_acao(usuario.id, 'alterar_senha', ip_address=request.remote_addr)
        
        return criar_resposta(mensagem='Senha alterada com sucesso')
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao alterar senha: {str(e)}', 500)

@auth_bp.route('/usuarios', methods=['GET'])
@gestor_required
def get_usuarios():
    """Retorna lista de todos os usuários"""
    try:
        usuarios = Usuario.query.all()
        return criar_resposta(dados={'usuarios': [u.to_dict() for u in usuarios]})
    except Exception as e:
        return criar_erro(f'Erro ao buscar usuários: {str(e)}', 500)
