"""
Testes para endpoints de autenticação
"""
import pytest
from models import Usuario, db


class TestAuth:
    
    def test_login_success(self, client):
        """Teste de login com credenciais válidas"""
        response = client.post('/api/auth/login', json={
            'email': 'plantonista@test.com',
            'password': '123456'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert 'user' in data
        assert data['user']['email'] == 'plantonista@test.com'
    
    def test_login_invalid_credentials(self, client):
        """Teste de login com credenciais inválidas"""
        response = client.post('/api/auth/login', json={
            'email': 'plantonista@test.com',
            'password': 'senha_errada'
        })
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_login_user_not_found(self, client):
        """Teste de login com usuário inexistente"""
        response = client.post('/api/auth/login', json={
            'email': 'inexistente@test.com',
            'password': '123456'
        })
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
    
    def test_protected_endpoint_without_token(self, client):
        """Teste de endpoint protegido sem token"""
        response = client.get('/api/plantoes')
        assert response.status_code == 401
    
    def test_protected_endpoint_with_token(self, client, auth_headers):
        """Teste de endpoint protegido com token válido"""
        response = client.get('/api/plantoes', headers=auth_headers)
        assert response.status_code == 200