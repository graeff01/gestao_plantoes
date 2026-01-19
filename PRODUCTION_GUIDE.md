# 🚀 GUIA DE CONFIGURAÇÃO SEGURA PARA PRODUÇÃO

## ⚠️ PROBLEMAS CRÍTICOS CORRIGIDOS

### 1. **SEGURANÇA**
- ✅ Debug desabilitado em produção
- ✅ Logs verbosos removidos em produção
- ✅ Validação de chaves secretas obrigatórias
- ✅ Pool de conexões configurado

### 2. **PERFORMANCE**
- ✅ Queries N+1 otimizadas com eager loading
- ✅ Joins eficientes implementados
- ✅ Transações atômicas em operações críticas
- ✅ Connection pooling configurado

### 3. **MONITORAMENTO**
- ✅ Health checks implementados (`/api/health/`)
- ✅ Métricas de sistema (`/api/health/metrics`)
- ✅ Endpoints de readiness e liveness

---

## 🔧 CONFIGURAÇÃO OBRIGATÓRIA PARA PRODUÇÃO

### 1. **Variáveis de Ambiente (.env)**

```env
# Flask Configuration
FLASK_ENV=production
DEBUG=False
SECRET_KEY=<GERAR_CHAVE_SEGURA_256_BITS>
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT - OBRIGATÓRIO ALTERAR
JWT_SECRET_KEY=<GERAR_JWT_SECRET_SEGURA>

# CORS - URLs permitidas (separadas por vírgula)
CORS_ORIGINS=https://seudominio.com,https://app.seudominio.com

# Google Calendar API (opcional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://seudominio.com/api/auth/google/callback
```

### 2. **Gerando Chaves Seguras**

```bash
# SECRET_KEY (256 bits)
python -c "import secrets; print(secrets.token_hex(32))"

# JWT_SECRET_KEY (256 bits)
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. **docker-compose.yml Produção**

```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: plantao_db
      POSTGRES_USER: plantao_user
      POSTGRES_PASSWORD: <SENHA_FORTE_AQUI>
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U plantao_user -d plantao_db"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      FLASK_ENV: production
      DEBUG: "False"
      DATABASE_URL: postgresql://plantao_user:<SENHA_FORTE_AQUI>@db:5432/plantao_db
      SECRET_KEY: <SUA_SECRET_KEY_AQUI>
      JWT_SECRET_KEY: <SUA_JWT_SECRET_AQUI>
      CORS_ORIGINS: https://seudominio.com
    ports:
      - "5000:5000"
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health/"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

### 4. **Configuração PostgreSQL Produção**

```sql
-- Configurações recomendadas para postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

---

## 📊 MONITORAMENTO

### 1. **Health Checks**

```bash
# Verificação básica
curl http://localhost:5000/api/health/

# Métricas detalhadas
curl http://localhost:5000/api/health/metrics

# Readiness (para load balancer)
curl http://localhost:5000/api/health/ready

# Liveness (para restart automático)
curl http://localhost:5000/api/health/live
```

### 2. **Alertas Recomendados**

- CPU > 80% por 5 minutos
- Memória > 85% por 5 minutos
- Latência do banco > 100ms
- Pool de conexões > 80% ocupado
- Health check falhando por 3 tentativas consecutivas

---

## 🚨 CHECKLIST PRÉ-DEPLOY

- [ ] ✅ SECRET_KEY alterada e segura (256 bits)
- [ ] ✅ JWT_SECRET_KEY alterada e segura (256 bits)
- [ ] ✅ FLASK_ENV=production
- [ ] ✅ DEBUG=False
- [ ] ✅ Senha do PostgreSQL forte
- [ ] ✅ CORS_ORIGINS configurado corretamente
- [ ] ✅ Health checks respondendo
- [ ] ✅ Backup do banco configurado
- [ ] ✅ Logs configurados para arquivo
- [ ] ✅ Monitoramento ativo

---

## 🎯 MELHORIAS DE PERFORMANCE IMPLEMENTADAS

### 1. **Database Optimizations**
- Connection pooling configurado (pool_size: 10, max_overflow: 20)
- Pool pre-ping ativado (reconecta automaticamente)
- Pool recycle: 1 hora (evita conexões mortas)
- Timeout configurado: 30 segundos

### 2. **Query Optimizations**
- Eager loading com `joinedload()` para evitar N+1
- Queries combinadas para estatísticas
- Joins eficientes em vez de queries sequenciais
- Indexes já criados no banco (ver `database/init.sql`)

### 3. **Concurrency Improvements**
- Transações atômicas em operações críticas
- Re-verificação dentro de transações (proteção contra race conditions)
- Locks implícitos via transações em escolha de plantões

### 4. **Memory Optimizations**
- Logs condicionais (apenas em desenvolvimento)
- Limpeza automática de sessões antigas
- Garbage collection otimizado

---

## 🔍 IDENTIFICAÇÃO DE GARGALOS

### 1. **Endpoints Mais Críticos**
- `GET /api/plantoes/mes/<ano>/<mes>` - Otimizado com eager loading
- `POST /api/plantoes/<id>/escolher` - Protegido com transações atômicas
- `GET /api/pontuacao/estatisticas` - Queries combinadas
- `GET /api/health/metrics` - Para monitoramento

### 2. **Queries Mais Pesadas**
- Dashboard com 5+ queries paralelas → Otimizado
- Ranking calculation → Cache recomendado para futuro
- Estatísticas mensais → Queries combinadas implementadas

### 3. **Concurrency Issues Resolvidos**
- Escolha simultânea de plantões → Transações atômicas
- Criação de pontuações → Rollback automático
- Pool de conexões → Configurado adequadamente

---

## 📈 PRÓXIMOS PASSOS RECOMENDADOS

### Curto Prazo (1-2 semanas)
1. **Implementar Cache Redis** para ranking e estatísticas
2. **Logs estruturados** com ELK Stack
3. **Rate limiting** para APIs críticas

### Médio Prazo (1-2 meses)
1. **Database read replicas** para queries de leitura
2. **CDN** para assets estáticos
3. **Backup automático** com retenção
4. **Alertas automatizados** via Slack/Teams

### Longo Prazo (3+ meses)
1. **Microserviços** para módulos independentes
2. **Event-driven architecture** para integrações
3. **A/B testing** para features novas
4. **Machine learning** para otimização de plantões

---

## ⚡ COMANDO DE DEPLOY SEGURO

```bash
# 1. Backup do banco antes do deploy
docker exec plantao_db pg_dump -U plantao_user plantao_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy com verificações
docker-compose down
docker-compose pull
docker-compose up -d

# 3. Verificar health checks
curl -f http://localhost:5000/api/health/ready || echo "❌ Deploy falhou!"
curl -f http://localhost:5000/api/health/metrics || echo "❌ Métricas indisponíveis!"

echo "✅ Deploy concluído com sucesso!"
```