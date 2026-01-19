"""
Testes para endpoints de plantões
"""
import pytest
from models import Plantao, Alocacao, db
from datetime import date, timedelta


class TestPlantoes:
    
    def test_get_plantoes(self, client, auth_headers):
        """Teste para listar plantões"""
        response = client.get('/api/plantoes', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'dados' in data
        assert 'plantoes' in data['dados']
        assert isinstance(data['dados']['plantoes'], list)
    
    def test_get_plantoes_with_filter(self, client, auth_headers):
        """Teste para listar plantões com filtro de data"""
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        response = client.get(
            f'/api/plantoes?inicio={today}&fim={tomorrow}',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'dados' in data
    
    def test_escolher_plantao_success(self, client, auth_headers, app):
        """Teste para escolher plantão disponível"""
        with app.app_context():
            # Buscar um plantão disponível
            plantao = Plantao.query.filter_by(status='disponivel').first()
            assert plantao is not None
            
            response = client.post(
                f'/api/plantoes/{plantao.id}/escolher',
                headers=auth_headers
            )
            
            assert response.status_code == 201
            data = response.get_json()
            assert data['mensagem'] == 'Plantão escolhido com sucesso'
            assert 'alocacao' in data['dados']
    
    def test_escolher_plantao_twice_should_fail(self, client, auth_headers, app):
        """Teste para escolher o mesmo plantão duas vezes"""
        with app.app_context():
            plantao = Plantao.query.filter_by(status='disponivel').first()
            assert plantao is not None
            
            # Primeira escolha
            response1 = client.post(
                f'/api/plantoes/{plantao.id}/escolher',
                headers=auth_headers
            )
            assert response1.status_code == 201
            
            # Segunda escolha (deve falhar)
            response2 = client.post(
                f'/api/plantoes/{plantao.id}/escolher',
                headers=auth_headers
            )
            assert response2.status_code == 400
    
    def test_escolher_plantao_invalid_id(self, client, auth_headers):
        """Teste para escolher plantão com ID inválido"""
        response = client.post(
            '/api/plantoes/invalid-id/escolher',
            headers=auth_headers
        )
        
        assert response.status_code == 400
    
    def test_atribuir_plantonista_as_gestor(self, client, gestor_headers, app):
        """Teste para gestor atribuir plantonista"""
        with app.app_context():
            plantao = Plantao.query.filter_by(status='disponivel').first()
            from models import Plantonista
            plantonista = Plantonista.query.first()
            
            assert plantao is not None
            assert plantonista is not None
            
            response = client.post(
                f'/api/plantoes/{plantao.id}/atribuir',
                headers=gestor_headers,
                json={'plantonista_id': str(plantonista.usuario_id)}
            )
            
            # Deve funcionar agora com a correção do usuario_id
            assert response.status_code == 200
    
    def test_atribuir_plantonista_as_plantonista_should_fail(self, client, auth_headers, app):
        """Teste para plantonista tentar atribuir (deve falhar)"""
        with app.app_context():
            plantao = Plantao.query.filter_by(status='disponivel').first()
            from models import Plantonista
            plantonista = Plantonista.query.first()
            
            response = client.post(
                f'/api/plantoes/{plantao.id}/atribuir',
                headers=auth_headers,
                json={'plantonista_id': str(plantonista.id)}
            )
            
            assert response.status_code == 403  # Acesso negado