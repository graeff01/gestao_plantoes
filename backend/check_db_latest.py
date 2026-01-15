import os
os.environ['SQLALCHEMY_ECHO'] = 'False'
from app import create_app
from models import db, Plantao, Alocacao, Plantonista, Usuario
from datetime import date
import logging

# Disable flask logging
logging.getLogger('sqlalchemy').setLevel(logging.ERROR)

app = create_app('development')
app.config['SQLALCHEMY_ECHO'] = False

with app.app_context():
    plantao_id = 'fb5c5404-61ce-45aa-9094-f3428e0083fe'
    plantao = Plantao.query.get(plantao_id)
    print("\n--- DATABASE CHECK ---")
    if plantao:
        print(f"Plantao found: {plantao.data} {plantao.turno} - Status: {plantao.status}")
        alocacoes = Alocacao.query.filter_by(plantao_id=plantao_id).all()
        print(f"Alocacoes: {[a.to_dict() for a in alocacoes]}")
    else:
        print(f"Plantao {plantao_id} NOT found")
    
    print("\n--- PLANTONISTAS ---")
    plantonistas = Plantonista.query.all()
    for p in plantonistas:
        u = Usuario.query.get(p.usuario_id)
        if u:
            print(f"User: {u.nome} | Type: {u.tipo} | ID: {p.id} | UserID: {u.id} | Ranking: {p.ranking}")
        else:
            print(f"Orphaned Plantonista ID {p.id} (UserID: {p.usuario_id})")
    print("----------------------")
