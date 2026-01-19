"""
Fixtures e configurações para testes
"""
import pytest
import tempfile
import os
from app import create_app
from models import db, Usuario, Plantonista, Plantao, Alocacao
from flask_bcrypt import Bcrypt
from datetime import date, datetime


@pytest.fixture(scope='function')
def app():
    """Fixture para criar app de teste"""
    
    # Criar banco temporário
    db_fd, db_path = tempfile.mkstemp()
    
    # Configuração de teste
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'JWT_SECRET_KEY': 'test-jwt-secret',
        'SECRET_KEY': 'test-secret-key',
        'CACHE_TYPE': 'simple',  # Usar SimpleCache nos testes
        'CORS_ORIGINS': ['http://localhost:3000']
    }
    
    # Criar app de teste
    app = create_app('development')
    app.config.update(test_config)
    
    # Configurar contexto
    with app.app_context():
        db.create_all()
        
        # Criar usuários de teste
        bcrypt = Bcrypt()
        
        # Admin
        admin = Usuario(
            nome='Admin Teste',
            email='admin@test.com', 
            senha=bcrypt.generate_password_hash('123456').decode('utf-8'),
            tipo='admin'
        )
        db.session.add(admin)
        
        # Gestor
        gestor = Usuario(
            nome='Gestor Teste',
            email='gestor@test.com',
            senha=bcrypt.generate_password_hash('123456').decode('utf-8'),
            tipo='gestor'
        )
        db.session.add(gestor)
        
        # Plantonista
        plantonista_user = Usuario(
            nome='Plantonista Teste',
            email='plantonista@test.com',
            senha=bcrypt.generate_password_hash('123456').decode('utf-8'),
            tipo='plantonista'
        )
        db.session.add(plantonista_user)
        db.session.flush()  # Para pegar os IDs
        
        # Registro de plantonista
        plantonista = Plantonista(
            usuario_id=plantonista_user.id,
            ranking=1,
            max_plantoes_mes=15
        )
        db.session.add(plantonista)
        
        # Plantão de teste
        plantao = Plantao(
            data=date.today(),
            turno='manha',
            tipo='vendas',
            local='Loja Centro',
            max_plantonistas=2,
            status='disponivel'
        )
        db.session.add(plantao)
        
        db.session.commit()
    
    yield app
    
    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Fixture para cliente de teste"""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Fixture para headers de autenticação"""
    # Login como plantonista
    response = client.post('/api/auth/login', json={
        'email': 'plantonista@test.com',
        'password': '123456'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    token = data['token']
    
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture  
def gestor_headers(client):
    """Fixture para headers de gestor"""
    # Login como gestor
    response = client.post('/api/auth/login', json={
        'email': 'gestor@test.com',
        'password': '123456'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    token = data['token']
    
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def admin_headers(client):
    """Fixture para headers de admin"""
    # Login como admin
    response = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': '123456'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    token = data['token']
    
    return {'Authorization': f'Bearer {token}'}