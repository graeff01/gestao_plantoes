import os
import sys
from datetime import date, timedelta, datetime
from models import db, Usuario, Plantonista, Pontuacao, Plantao, Configuracao
from utils.pontuacao import CalculadoraPontuacao
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def populate_db():
    print("🌱 Iniciando o povoamento do banco de dados...")
    
    # 1. Configurações Iniciais
    print("Configurando regras de negócio...")
    config_defaults = {
        'pontos_venda': 8,
        'pontos_bairro_foco': 2,
        'pontos_outros_bairros': 1,
        'pontos_placa_foco': 1.0,
        'pontos_placa_outros': 0.5
    }
    
    for chave, valor in config_defaults.items():
        if not Configuracao.query.filter_by(chave=chave).first():
            cfg = Configuracao(chave=chave, valor=valor)
            db.session.add(cfg)
    
    # 2. Usuários
    print("Criando usuários de teste...")
    
    # Admin
    if not Usuario.query.filter_by(email='admin@veloce.com').first():
        admin = Usuario(
            nome='Admin Veloce',
            email='admin@veloce.com',
            senha=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            tipo='admin'
        )
        db.session.add(admin)
    
    # Gestor
    if not Usuario.query.filter_by(email='gestor@veloce.com').first():
        gestor = Usuario(
            nome='Gestor Comercial',
            email='gestor@veloce.com',
            senha=bcrypt.generate_password_hash('gestor123').decode('utf-8'),
            tipo='gestor'
        )
        db.session.add(gestor)
    
    # Plantonistas
    dados_plantonistas = [
        {'nome': 'João Silva', 'email': 'joao@veloce.com', 'vendas': 3, 'placas': 5},
        {'nome': 'Maria Santos', 'email': 'maria@veloce.com', 'vendas': 1, 'placas': 10},
        {'nome': 'Carlos Oliveira', 'email': 'carlos@veloce.com', 'vendas': 0, 'placas': 2},
        {'nome': 'Ana Costa', 'email': 'ana@veloce.com', 'vendas': 5, 'placas': 1},
    ]
    
    plantonistas_objs = []
    for p in dados_plantonistas:
        u = Usuario.query.filter_by(email=p['email']).first()
        if not u:
            u = Usuario(
                nome=p['nome'],
                email=p['email'],
                senha=bcrypt.generate_password_hash('123456').decode('utf-8'),
                tipo='plantonista'
            )
            db.session.add(u)
            db.session.flush()
            
            plantonista = Plantonista(usuario_id=u.id, max_plantoes_mes=13)
            db.session.add(plantonista)
            plantonistas_objs.append((plantonista, p))
        else:
            plantonista = Plantonista.query.filter_by(usuario_id=u.id).first()
            if plantonista:
                plantonistas_objs.append((plantonista, p))

    db.session.commit()

    # 3. Pontuações do Mês Atual (para testar ranking)
    print("Adicionando pontuações e calculando ranking...")
    mes_atual = date.today().replace(day=1)
    calc = CalculadoraPontuacao()
    
    for plantonista, p in plantonistas_objs:
        dados_pontos = {
            'vendas': p['vendas'],
            'placa_bairro_foco': p['placas'],
            'age_bairro_foco': p['vendas'] * 2 # Exemplo
        }
        calc.criar_pontuacao_mes(plantonista.id, mes_atual, dados_pontos)
    
    # Calcular o ranking baseado nesses pontos
    calc.calcular_ranking_mes(mes_atual)
    
    # 4. Gerar Plantões (Mês Atual e Próximo)
    print("Gerando escalas de plantão...")
    def mock_gerar_plantoes(ano, mes):
        from calendar import monthrange
        num_dias = monthrange(ano, mes)[1]
        for dia in range(1, num_dias + 1):
            data_p = date(ano, mes, dia)
            if data_p.weekday() == 6: continue # Pula domingo
            for turno in ['manha', 'tarde']:
                if not Plantao.query.filter_by(data=data_p, turno=turno).first():
                    pl = Plantao(data=data_p, turno=turno, status='disponivel', max_plantonistas=2)
                    db.session.add(pl)
    
    hoje = date.today()
    print(f"Gerando para {hoje.month}/{hoje.year}")
    mock_gerar_plantoes(hoje.year, hoje.month)
    
    proximo_mes_date = hoje.replace(day=28) + timedelta(days=4)
    print(f"Gerando para {proximo_mes_date.month}/{proximo_mes_date.year}")
    mock_gerar_plantoes(proximo_mes_date.year, proximo_mes_date.month)
    
    print("Finalizando commit...")
    db.session.commit()
    
    print("\n✅ Sistema populado com sucesso!")
    print(f"--- USUÁRIOS ---")
    print(f"Admin: admin@veloce.com / admin123")
    print(f"Gestor: gestor@veloce.com / gestor123")
    print(f"Plantonistas: email do plantonista / 123456")
    print(f"----------------")

def seed_data():
    from app import create_app
    app = create_app('development')
    with app.app_context():
        populate_db()

if __name__ == '__main__':
    seed_data()
