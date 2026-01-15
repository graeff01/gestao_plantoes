from app import create_app
from models import db, Usuario
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def init_database():
    app = create_app('development')
    
    with app.app_context():
        # Criar todas as tabelas
        print("Criando tabelas...")
        db.create_all()
        
        # Verificar se admin já existe
        admin = Usuario.query.filter_by(email='admin@veloce.com').first()
        
        if not admin:
            # Criar usuário admin
            print("Criando usuário administrador...")
            senha_hash = bcrypt.generate_password_hash('admin123').decode('utf-8')
            
            admin = Usuario(
                nome='Administrador',
                email='admin@veloce.com',
                senha=senha_hash,
                tipo='admin'
            )
            
            db.session.add(admin)
            db.session.commit()
            print("✅ Usuário admin criado!")
        else:
            print("✅ Usuário admin já existe!")
        
        print("✅ Banco de dados inicializado com sucesso!")

if __name__ == '__main__':
    init_database()