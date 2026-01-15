#!/bin/bash

echo "======================================"
echo "Sistema de Gestão de Plantões - Veloce"
echo "======================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker encontrado!"
echo ""

# Criar arquivo .env se não existir
if [ ! -f "backend/.env" ]; then
    echo "📝 Criando arquivo de configuração..."
    cp backend/.env.example backend/.env
    echo "✅ Arquivo backend/.env criado. Você pode editá-lo conforme necessário."
    echo ""
fi

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose up -d

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "======================================"
echo "✅ Sistema iniciado com sucesso!"
echo "======================================"
echo ""
echo "🌐 URLs de acesso:"
echo "  - Backend API: http://localhost:5000"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "🔐 Credenciais padrão:"
echo "  Email: admin@veloce.com"
echo "  Senha: admin123"
echo ""
echo "📝 Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Parar: docker-compose down"
echo "  - Reiniciar: docker-compose restart"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!"
echo ""
