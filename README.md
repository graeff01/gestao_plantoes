# 🏢 Sistema de Gestão de Plantões - Veloce Imobiliária

Sistema completo para gerenciamento de plantões de vendedores em imobiliárias, com sistema de pontuação, ranking e escolha automatizada de plantões.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Fluxo do Sistema](#fluxo-do-sistema)

## 🎯 Visão Geral

O Sistema de Gestão de Plantões foi desenvolvido para automatizar e otimizar o processo de distribuição de plantões em imobiliárias, substituindo planilhas manuais por um sistema inteligente que:

- Calcula automaticamente o ranking baseado em meritocracia
- Permite que plantonistas escolham seus horários de forma autônoma
- Integra com Google Calendar para lembretes
- Gera relatórios e estatísticas em tempo real

## ✨ Funcionalidades

### Para Plantonistas
- ✅ Visualização de plantões disponíveis em calendário
- ✅ Escolha de plantões respeitando ordem de ranking
- ✅ Visualização dos próprios plantões
- ✅ Cancelamento de plantões (com restrições)
- ✅ Visualização do ranking e pontuação pessoal

### Para Gestores
- ✅ Geração automática de plantões mensais
- ✅ Cadastro e gestão de pontuações
- ✅ Cálculo automático de ranking
- ✅ Importação de dados de planilhas
- ✅ Relatórios e estatísticas
- ✅ Gestão de plantonistas

### Para Administradores
- ✅ Todas as funcionalidades de gestor
- ✅ Gestão de usuários e permissões
- ✅ Configurações do sistema
- ✅ Logs de auditoria

## 🚀 Tecnologias

### Backend
- **Python 3.11** - Linguagem principal
- **Flask 3.0** - Framework web
- **PostgreSQL 15** - Banco de dados
- **SQLAlchemy** - ORM
- **Flask-JWT-Extended** - Autenticação JWT
- **Bcrypt** - Criptografia de senhas
- **Google Calendar API** - Integração de calendário

### Frontend
- **React 18** - Biblioteca UI
- **Vite** - Build tool
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Zustand** - Gerenciamento de estado
- **Tailwind CSS** - Estilização
- **date-fns** - Manipulação de datas
- **React Icons** - Ícones
- **React Toastify** - Notificações

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração

## 📦 Instalação

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento frontend local)
- Python 3.11+ (para desenvolvimento backend local)

### Instalação com Docker (Recomendado)

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd plantao-system
```

2. **Configure as variáveis de ambiente**
```bash
cp backend/.env.example backend/.env
# Edite o arquivo .env com suas configurações
```

3. **Inicie os containers**
```bash
docker-compose up -d
```

4. **Acesse o sistema**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Instalação Local (Desenvolvimento)

#### Backend

1. **Crie um ambiente virtual**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```

3. **Configure o banco de dados**
```bash
# Certifique-se que o PostgreSQL está rodando
createdb plantao_db
psql plantao_db < ../database/init.sql
```

4. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite conforme necessário
```

5. **Inicie o servidor**
```bash
python app.py
```

#### Frontend

1. **Instale as dependências**
```bash
cd frontend
npm install
```

2. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env na raiz do frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

3. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

#### Backend (.env)
```env
# Flask
FLASK_ENV=development
DEBUG=True
SECRET_KEY=sua-chave-secreta
PORT=5000

# Database
DATABASE_URL=postgresql://plantao_user:plantao_pass@localhost:5432/plantao_db

# JWT
JWT_SECRET_KEY=sua-jwt-secret-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Google Calendar (Opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Usuário Padrão

O sistema vem com um usuário administrador padrão:

**Email:** admin@veloce.com  
**Senha:** admin123

**⚠️ IMPORTANTE:** Altere essa senha em produção!

## 📖 Uso

### 1. Login
Acesse a aplicação e faça login com as credenciais fornecidas.

### 2. Para Gestores: Configurar Pontuação

1. Acesse **Pontuação** no menu
2. Selecione o mês de referência
3. Cadastre as pontuações dos plantonistas
4. Clique em **Calcular Ranking**

### 3. Para Gestores: Gerar Plantões

Os plantões são gerados automaticamente via API. Você pode usar o endpoint:

```bash
POST /api/plantoes/gerar-mes
{
  "ano": 2026,
  "mes": 1
}
```

Ou implementar um botão no frontend para isso.

### 4. Para Plantonistas: Escolher Plantões

1. Acesse **Plantões Disponíveis**
2. Selecione um dia no calendário
3. Visualize os turnos disponíveis
4. Clique em **Escolher Plantão**
5. Confirme a escolha

### 5. Visualizar Ranking

Acesse **Ranking** para ver a classificação atualizada de todos os plantonistas.

## 📁 Estrutura do Projeto

```
plantao-system/
├── backend/
│   ├── app.py                 # Aplicação Flask principal
│   ├── config.py              # Configurações
│   ├── models.py              # Modelos do banco de dados
│   ├── requirements.txt       # Dependências Python
│   ├── Dockerfile            # Container do backend
│   ├── routes/               # Rotas da API
│   │   ├── auth.py          # Autenticação
│   │   ├── plantoes.py      # Plantões
│   │   └── pontuacao.py     # Pontuação/Ranking
│   └── utils/                # Utilitários
│       ├── auth.py          # Helpers de autenticação
│       ├── pontuacao.py     # Cálculo de pontuação
│       └── google_calendar.py # Integração Google
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   └── Layout.jsx   # Layout principal
│   │   ├── pages/           # Páginas
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PlantoesPage.jsx
│   │   │   ├── MeusPlantoesPage.jsx
│   │   │   ├── RankingPage.jsx
│   │   │   └── PontuacaoPage.jsx
│   │   ├── services/        # Serviços
│   │   │   └── api.js       # Cliente Axios
│   │   ├── store/           # Estado global
│   │   │   └── authStore.js # Store de autenticação
│   │   ├── styles/          # Estilos
│   │   │   └── index.css
│   │   ├── App.jsx          # Componente raiz
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── database/
│   └── init.sql             # Schema inicial do banco
│
├── docker-compose.yml       # Orquestração de containers
└── README.md               # Este arquivo
```

## 🔌 API Endpoints

### Autenticação

```
POST   /api/auth/login           # Login
POST   /api/auth/register        # Registro
POST   /api/auth/refresh         # Renovar token
GET    /api/auth/me              # Dados do usuário logado
POST   /api/auth/change-password # Alterar senha
```

### Plantões

```
GET    /api/plantoes/mes/:ano/:mes      # Plantões do mês
POST   /api/plantoes/gerar-mes          # Gerar plantões
POST   /api/plantoes/escolher           # Escolher plantão
DELETE /api/plantoes/cancelar/:id       # Cancelar alocação
GET    /api/plantoes/meus-plantoes      # Plantões do usuário
GET    /api/plantoes/disponiveis        # Plantões disponíveis
PUT    /api/plantoes/:id                # Atualizar plantão
DELETE /api/plantoes/:id                # Deletar plantão
```

### Pontuação e Ranking

```
GET    /api/pontuacao/ranking                   # Ranking atual
POST   /api/pontuacao/calcular/:mes             # Calcular ranking
GET    /api/pontuacao/mes/:mes                  # Pontuações do mês
GET    /api/pontuacao/plantonista/:id           # Histórico de um plantonista
POST   /api/pontuacao/criar                     # Criar/atualizar pontuação
POST   /api/pontuacao/importar                  # Importar em lote
DELETE /api/pontuacao/:id                       # Deletar pontuação
GET    /api/pontuacao/estatisticas              # Estatísticas gerais
```

## 🔄 Fluxo do Sistema

### Fluxo Mensal Completo

1. **Dia 25-28 do mês anterior:**
   - Gestor cadastra pontuações do mês
   - Sistema calcula automaticamente o ranking
   - Plantões do próximo mês são gerados

2. **Dia 25 00:00 - Abertura:**
   - Sistema abre para escolha de plantões
   - Plantonistas podem começar a escolher

3. **Período de Escolha:**
   - Plantonistas escolhem na ordem do ranking
   - Sistema valida vagas e limites
   - Confirmação automática

4. **Dia 28 23:59 - Fechamento:**
   - Sistema fecha escolhas automáticas
   - Gestor pode fazer ajustes finais
   - Plantões são publicados

5. **Durante o Mês:**
   - Lembretes automáticos (Google Calendar)
   - Trocas entre plantonistas (com aprovação)
   - Registro de faltas

### Regras de Negócio

1. **Ranking:**
   - Baseado em pontuação dos últimos 3 meses
   - Recalculado mensalmente
   - Prioridade: 1º escolhe primeiro

2. **Plantões:**
   - Máximo 13 plantões/mês por plantonista
   - 2 plantonistas por turno
   - Não pode escolher plantões passados

3. **Pontuação:**
   - Vendas: 8 pontos cada
   - Agenciamentos: 1-3 pontos (conforme bairro)
   - Placas: 0.5-1.5 pontos (conforme bairro)

## 🛠️ Desenvolvimento

### Rodar Testes

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Build para Produção

```bash
# Frontend
cd frontend
npm run build

# Docker (tudo junto)
docker-compose -f docker-compose.prod.yml up --build
```

## 📝 TODO / Próximas Funcionalidades

- [ ] Sistema de trocas de plantões
- [ ] Notificações por WhatsApp
- [ ] Relatórios em PDF
- [ ] Dashboard com gráficos
- [ ] App mobile nativo
- [ ] Importação automática de vendas
- [ ] Histórico completo de plantões
- [ ] Sistema de penalidades por faltas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto foi desenvolvido especificamente para Veloce Imobiliária.

## 👨‍💻 Autor

Desenvolvido por Douglas - Veloce Digital Marketing

---

**⚠️ Notas Importantes:**

1. Sempre altere as senhas padrão em produção
2. Configure backups regulares do banco de dados
3. Use HTTPS em produção
4. Configure rate limiting na API
5. Monitore logs de erro

Para suporte, entre em contato: suporte@veloce.com.br
