import os
from datetime import timedelta
from dotenv import load_dotenv

# IMPORTANTE: Carregar .env ANTES de tudo
load_dotenv()

class Config:
    """Configurações base da aplicação"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    
    # Database - usa .env ou padrão SQLite
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///plantao.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = DEBUG
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS
    # Adicionando a URL do frontend do usuário diretamente nos defaults para facilitar
    CORS_ORIGINS_RAW = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173,https://zoological-enchantment-production.up.railway.app,https://gestaoplantao.up.railway.app')
    # Separa por vírgula, remove espaços E remove barra no final (trailing slash) para evitar mismatch
    CORS_ORIGINS = [origin.strip().rstrip('/') for origin in CORS_ORIGINS_RAW.split(',') if origin.strip()]
    
    # Resto das configurações...
    TIMEZONE = 'America/Sao_Paulo'
    PONTOS_VENDA = 8
    PONTOS_BAIRRO_SUPER_FOCO = 3
    PONTOS_BAIRRO_FOCO = 2
    PONTOS_OUTROS_BAIRROS = 1
    PONTOS_PLACA_SUPER_FOCO = 1.5
    PONTOS_PLACA_FOCO = 1.0
    PONTOS_PLACA_OUTROS = 0.5
    MAX_PLANTONISTAS_POR_TURNO = 2


class DevelopmentConfig(Config):
    DEBUG = True
    
    # Pool de conexões para desenvolvimento
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_size': 5,
        'max_overflow': 10,
        'pool_timeout': 30
    }


class ProductionConfig(Config):
    DEBUG = False
    
    # Configurações específicas de produção
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_size': 10,
        'max_overflow': 20,
        'pool_timeout': 30
    }
    
    # Validações de segurança
    def __init__(self):
        super().__init__()
        if self.SECRET_KEY == 'dev-secret-key-change-in-production':
            raise ValueError("SECRET_KEY deve ser alterada em produção!")
        if self.JWT_SECRET_KEY == 'jwt-secret-key-change-in-production':
            raise ValueError("JWT_SECRET_KEY deve ser alterada em produção!")


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}