# 🚀 Guia Rápido de Início

## Instalação em 3 Passos

### 1. Baixe o projeto
```bash
# Se você tem Git
git clone <url-do-repositorio>
cd plantao-system

# Ou extraia o ZIP e navegue até a pasta
```

### 2. Inicie o sistema
```bash
# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
docker-compose up -d
```

### 3. Acesse o sistema
Abra seu navegador em: **http://localhost:3000**

**Login padrão:**
- Email: `admin@veloce.com`
- Senha: `admin123`

---

## 📋 Primeiros Passos Após Login

### Para Administradores/Gestores:

#### 1. Cadastrar Plantonistas
1. Crie novos usuários do tipo "plantonista"
2. Configure preferências e limites

#### 2. Gerar Plantões do Mês
Use a API para gerar plantões:
```bash
curl -X POST http://localhost:5000/api/plantoes/gerar-mes \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ano": 2026, "mes": 1}'
```

#### 3. Cadastrar Pontuações
1. Acesse **Pontuação** no menu
2. Selecione o mês
3. Cadastre as pontuações de cada plantonista
4. Clique em **Calcular Ranking**

#### 4. Publicar Plantões
Os plantonistas já podem começar a escolher!

### Para Plantonistas:

#### 1. Ver Ranking
Acesse **Ranking** para ver sua posição

#### 2. Escolher Plantões
1. Vá em **Plantões Disponíveis**
2. Selecione um dia no calendário
3. Escolha um turno disponível
4. Confirme

#### 3. Ver Seus Plantões
Acesse **Meus Plantões** para ver todos os plantões escolhidos

---

## ⚙️ Configurações Importantes

### Variáveis de Ambiente
Edite `backend/.env` para configurar:
- Senha do banco de dados
- Chaves secretas
- Google Calendar (opcional)

### Banco de Dados
O sistema usa PostgreSQL. Dados são persistidos mesmo após restart.

### Backup
Para fazer backup do banco:
```bash
docker exec plantao_db pg_dump -U plantao_user plantao_db > backup.sql
```

---

## 🆘 Resolução de Problemas

### Porta já em uso
Se a porta 5000 ou 3000 estiver em uso:
```bash
# Parar o sistema
docker-compose down

# Editar docker-compose.yml e mudar as portas
# Ex: "5001:5000" e "3001:3000"

# Reiniciar
docker-compose up -d
```

### Erro de conexão com banco
```bash
# Reiniciar apenas o banco
docker-compose restart db

# Aguardar 10 segundos
# Reiniciar backend
docker-compose restart backend
```

### Limpar tudo e recomeçar
```bash
# Parar e remover tudo
docker-compose down -v

# Reiniciar do zero
./start.sh
```

---

## 📞 Suporte

- **Email:** suporte@veloce.com.br
- **Documentação completa:** Veja README.md
- **Logs:** `docker-compose logs -f`

---

## 🎯 Próximos Passos

1. ✅ Alterar senha padrão
2. ✅ Cadastrar todos os plantonistas
3. ✅ Configurar pontuações
4. ✅ Gerar plantões
5. ✅ Treinar equipe no uso
6. ✅ Monitorar primeiras escolhas

**Bom uso! 🚀**
