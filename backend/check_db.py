from app import create_app
from models import db, Plantao, Alocacao, Plantonista, Usuario
from datetime import date

app = create_app('development')
with app.app_context():
    plantao_id = 'fb5c5404-61ce-45aa-9094-f3428e0083fe'
    plantao = Plantao.query.get(plantao_id)
    if plantao:
        print(f"Plantao found: {plantao.data} {plantao.turno} - Status: {plantao.status}")
        alocacoes = Alocacao.query.filter_by(plantao_id=plantao_id).all()
        print(f"Alocacoes: {[a.to_dict() for a in alocacoes]}")
    else:
        print("Plantao NOT found")
    
    # Check current plantonista users
    plantonistas = Plantonista.query.all()
    for p in plantonistas:
        u = Usuario.query.get(p.usuario_id)
        if u:
            print(f"Plantonista: {u.nome} (ID: {p.id}, UserID: {u.id}) - Ranking: {p.ranking}")
        else:
            print(f"Plantonista ID {p.id} has no associated user (UserID: {p.usuario_id})")
