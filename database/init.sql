-- Database: plantao_system
-- Criado para Sistema de Gestão de Plantões

-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('admin', 'gestor', 'plantonista')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Plantonistas (extensão de usuários)
CREATE TABLE plantonistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    pontuacao_total DECIMAL(10,2) DEFAULT 0,
    ranking INTEGER DEFAULT 999,
    max_plantoes_mes INTEGER DEFAULT 13,
    preferencias JSONB, -- {dias_semana: [], turnos: [], restricoes: ""}
    google_calendar_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pontuação Detalhada
CREATE TABLE pontuacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantonista_id UUID REFERENCES plantonistas(id) ON DELETE CASCADE,
    mes_referencia DATE NOT NULL,
    vendas INTEGER DEFAULT 0,
    agenciamentos_vendidos INTEGER DEFAULT 0,
    age_bairro_foco INTEGER DEFAULT 0,
    age_canoas_poa INTEGER DEFAULT 0,
    age_outros INTEGER DEFAULT 0,
    acima_1mm INTEGER DEFAULT 0,
    placa_bairro_foco DECIMAL(5,2) DEFAULT 0,
    placa_canoas_poa DECIMAL(5,2) DEFAULT 0,
    placa_outros DECIMAL(5,2) DEFAULT 0,
    pontos_vendas DECIMAL(10,2) DEFAULT 0,
    pontos_agenciamentos DECIMAL(10,2) DEFAULT 0,
    pontos_placas DECIMAL(10,2) DEFAULT 0,
    pontos_total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plantonista_id, mes_referencia)
);

-- Tabela de Plantões
CREATE TABLE plantoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    turno VARCHAR(10) NOT NULL CHECK (turno IN ('manha', 'tarde')),
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'confirmado', 'cancelado')),
    max_plantonistas INTEGER DEFAULT 2,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data, turno)
);

-- Tabela de Alocações de Plantões
CREATE TABLE alocacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantao_id UUID REFERENCES plantoes(id) ON DELETE CASCADE,
    plantonista_id UUID REFERENCES plantonistas(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'faltou')),
    tipo VARCHAR(20) DEFAULT 'escolha' CHECK (tipo IN ('escolha', 'atribuido', 'troca')),
    confirmado_em TIMESTAMP,
    google_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plantao_id, plantonista_id)
);

-- Tabela de Histórico de Trocas
CREATE TABLE trocas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alocacao_origem_id UUID REFERENCES alocacoes(id) ON DELETE CASCADE,
    plantonista_origem_id UUID REFERENCES plantonistas(id),
    plantonista_destino_id UUID REFERENCES plantonistas(id),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    motivo TEXT,
    aprovado_por UUID REFERENCES usuarios(id),
    aprovado_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações do Sistema
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Logs/Auditoria
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(50),
    registro_id UUID,
    detalhes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_plantonistas_usuario ON plantonistas(usuario_id);
CREATE INDEX idx_plantonistas_ranking ON plantonistas(ranking);
CREATE INDEX idx_pontuacao_plantonista ON pontuacao(plantonista_id);
CREATE INDEX idx_pontuacao_mes ON pontuacao(mes_referencia);
CREATE INDEX idx_plantoes_data ON plantoes(data);
CREATE INDEX idx_plantoes_status ON plantoes(status);
CREATE INDEX idx_alocacoes_plantao ON alocacoes(plantao_id);
CREATE INDEX idx_alocacoes_plantonista ON alocacoes(plantonista_id);
CREATE INDEX idx_alocacoes_status ON alocacoes(status);
CREATE INDEX idx_trocas_status ON trocas(status);
CREATE INDEX idx_logs_usuario ON logs(usuario_id);
CREATE INDEX idx_logs_created ON logs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER trigger_usuarios_updated BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_plantonistas_updated BEFORE UPDATE ON plantonistas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_pontuacao_updated BEFORE UPDATE ON pontuacao
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_plantoes_updated BEFORE UPDATE ON plantoes
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER trigger_alocacoes_updated BEFORE UPDATE ON alocacoes
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('horario_abertura_escolhas', '{"dia": 25, "hora": "00:00"}', 'Dia e hora que abre para escolha de plantões'),
('horario_fechamento_escolhas', '{"dia": 28, "hora": "23:59"}', 'Dia e hora que fecha para escolha de plantões'),
('turnos', '{"manha": {"inicio": "09:00", "fim": "13:00"}, "tarde": {"inicio": "13:00", "fim": "18:00"}}', 'Horários dos turnos'),
('dias_funcionamento', '["segunda", "terca", "quarta", "quinta", "sexta", "sabado"]', 'Dias de funcionamento'),
('pontos_venda', '8', 'Pontos por venda'),
('pontos_bairro_super_foco', '3', 'Pontos por agenciamento em bairro super foco'),
('pontos_bairro_foco', '2', 'Pontos por agenciamento em bairro foco'),
('pontos_outros_bairros', '1', 'Pontos por agenciamento em outros bairros'),
('pontos_placa_super_foco', '1.5', 'Pontos por placa em bairro super foco'),
('pontos_placa_foco', '1', 'Pontos por placa em bairro foco'),
('pontos_placa_outros', '0.5', 'Pontos por placa em outros bairros');

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, tipo) VALUES
('Administrador', 'admin@veloce.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.5goxeS', 'admin');

-- Comentários nas tabelas
COMMENT ON TABLE usuarios IS 'Tabela principal de usuários do sistema';
COMMENT ON TABLE plantonistas IS 'Dados específicos dos plantonistas';
COMMENT ON TABLE pontuacao IS 'Histórico de pontuação para cálculo de ranking';
COMMENT ON TABLE plantoes IS 'Plantões disponíveis para escolha';
COMMENT ON TABLE alocacoes IS 'Alocações de plantonistas aos plantões';
COMMENT ON TABLE trocas IS 'Histórico de solicitações de troca de plantões';
COMMENT ON TABLE configuracoes IS 'Configurações gerais do sistema';
COMMENT ON TABLE logs IS 'Logs de auditoria do sistema';
