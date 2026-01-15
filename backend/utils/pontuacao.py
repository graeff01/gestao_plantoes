from models import Pontuacao, Plantonista, Configuracao, db
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func


class CalculadoraPontuacao:
    """Classe para calcular pontuações e rankings"""
    
    def __init__(self):
        self.config = self._carregar_config()
    
    def _carregar_config(self):
        """Carrega configurações de pontuação do banco"""
        config = {}
        
        configs = {
            'pontos_venda': 'pontos_venda',
            'pontos_bairro_super_foco': 'pontos_bairro_super_foco',
            'pontos_bairro_foco': 'pontos_bairro_foco',
            'pontos_outros_bairros': 'pontos_outros_bairros',
            'pontos_placa_super_foco': 'pontos_placa_super_foco',
            'pontos_placa_foco': 'pontos_placa_foco',
            'pontos_placa_outros': 'pontos_placa_outros'
        }
        
        for chave, nome in configs.items():
            cfg = Configuracao.query.filter_by(chave=chave).first()
            if cfg:
                config[nome] = float(cfg.valor) if isinstance(cfg.valor, (int, float, str)) else 0
            else:
                # Valores padrão
                defaults = {
                    'pontos_venda': 8,
                    'pontos_bairro_super_foco': 3,
                    'pontos_bairro_foco': 2,
                    'pontos_outros_bairros': 1,
                    'pontos_placa_super_foco': 1.5,
                    'pontos_placa_foco': 1.0,
                    'pontos_placa_outros': 0.5
                }
                config[nome] = defaults[nome]
        
        return config
    
    def calcular_pontos(self, pontuacao):
        """Calcula pontos totais de uma pontuação"""
        # Pontos por vendas
        pontos_vendas = pontuacao.vendas * self.config['pontos_venda']
        
        # Pontos por agenciamentos
        pontos_age = 0
        if pontuacao.age_bairro_foco:
            pontos_age += pontuacao.age_bairro_foco * self.config['pontos_bairro_foco']
        if pontuacao.age_canoas_poa:
            pontos_age += pontuacao.age_canoas_poa * self.config['pontos_outros_bairros']
        if pontuacao.age_outros:
            pontos_age += pontuacao.age_outros * self.config['pontos_outros_bairros']
        
        # Pontos por placas
        pontos_placas = 0
        if pontuacao.placa_bairro_foco:
            pontos_placas += float(pontuacao.placa_bairro_foco) * self.config['pontos_placa_foco']
        if pontuacao.placa_canoas_poa:
            pontos_placas += float(pontuacao.placa_canoas_poa) * self.config['pontos_placa_outros']
        if pontuacao.placa_outros:
            pontos_placas += float(pontuacao.placa_outros) * self.config['pontos_placa_outros']
        
        # Atualizar pontuação
        pontuacao.pontos_vendas = pontos_vendas
        pontuacao.pontos_agenciamentos = pontos_age
        pontuacao.pontos_placas = pontos_placas
        pontuacao.pontos_total = pontos_vendas + pontos_age + pontos_placas
        
        return pontuacao
    
    def calcular_ranking_mes(self, mes_referencia):
        """Calcula ranking para um mês específico"""
        if isinstance(mes_referencia, str):
            mes_referencia = datetime.strptime(mes_referencia, '%Y-%m-%d').date()
        
        # Buscar todas as pontuações do mês
        pontuacoes = Pontuacao.query.filter_by(mes_referencia=mes_referencia).all()
        
        # Calcular pontos para cada uma
        for pont in pontuacoes:
            self.calcular_pontos(pont)
        
        db.session.commit()
        
        # Ordenar por pontos (decrescente)
        pontuacoes_ordenadas = sorted(pontuacoes, key=lambda x: float(x.pontos_total), reverse=True)
        
        # Atribuir ranking
        ranking_atual = 1
        for pont in pontuacoes_ordenadas:
            plantonista = Plantonista.query.get(pont.plantonista_id)
            if plantonista:
                plantonista.ranking = ranking_atual
                plantonista.pontuacao_total = pont.pontos_total
                ranking_atual += 1
        
        db.session.commit()
        
        return pontuacoes_ordenadas
    
    def calcular_ranking_acumulado(self, meses=3):
        """Calcula ranking baseado nos últimos N meses"""
        data_fim = date.today().replace(day=1)
        data_inicio = data_fim - relativedelta(months=meses-1)
        
        # Buscar pontuações dos últimos meses
        pontuacoes = db.session.query(
            Pontuacao.plantonista_id,
            func.sum(Pontuacao.pontos_total).label('total')
        ).filter(
            Pontuacao.mes_referencia >= data_inicio,
            Pontuacao.mes_referencia <= data_fim
        ).group_by(
            Pontuacao.plantonista_id
        ).order_by(
            func.sum(Pontuacao.pontos_total).desc()
        ).all()
        
        # Atualizar ranking
        ranking_atual = 1
        for pont in pontuacoes:
            plantonista = Plantonista.query.get(pont.plantonista_id)
            if plantonista:
                plantonista.ranking = ranking_atual
                plantonista.pontuacao_total = pont.total
                ranking_atual += 1
        
        db.session.commit()
        
        return pontuacoes
    
    def obter_ranking_atual(self):
        """Retorna o ranking atual ordenado"""
        plantonistas = Plantonista.query.join(
            Pontuacao
        ).order_by(
            Plantonista.ranking.asc()
        ).all()
        
        return [p.to_dict() for p in plantonistas]
    
    def criar_pontuacao_mes(self, plantonista_id, mes_referencia, dados):
        """Cria ou atualiza pontuação de um plantonista para um mês"""
        if isinstance(mes_referencia, str):
            mes_referencia = datetime.strptime(mes_referencia, '%Y-%m-%d').date()
        
        # Verificar se já existe pontuação para o mês
        pontuacao = Pontuacao.query.filter_by(
            plantonista_id=plantonista_id,
            mes_referencia=mes_referencia
        ).first()
        
        if not pontuacao:
            pontuacao = Pontuacao(
                plantonista_id=plantonista_id,
                mes_referencia=mes_referencia
            )
        
        # Atualizar dados
        for campo, valor in dados.items():
            if hasattr(pontuacao, campo):
                setattr(pontuacao, campo, valor)
        
        # Calcular pontos
        pontuacao = self.calcular_pontos(pontuacao)
        
        db.session.add(pontuacao)
        db.session.commit()
        
        return pontuacao
    
    def importar_pontuacoes_planilha(self, mes_referencia, dados_planilha):
        """Importa pontuações de uma planilha (formato dict)"""
        resultados = {
            'sucesso': [],
            'erros': []
        }
        
        for item in dados_planilha:
            try:
                # Buscar plantonista pelo nome
                plantonista = Plantonista.query.join(
                    'usuario'
                ).filter(
                    Usuario.nome.ilike(f"%{item['nome']}%")
                ).first()
                
                if not plantonista:
                    resultados['erros'].append({
                        'nome': item['nome'],
                        'erro': 'Plantonista não encontrado'
                    })
                    continue
                
                # Criar pontuação
                dados = {
                    'vendas': item.get('vendas', 0),
                    'age_bairro_foco': item.get('age_bairro_foco', 0),
                    'age_canoas_poa': item.get('age_canoas_poa', 0),
                    'age_outros': item.get('age_outros', 0),
                    'acima_1mm': item.get('acima_1mm', 0),
                    'placa_bairro_foco': item.get('placa_bairro_foco', 0),
                    'placa_canoas_poa': item.get('placa_canoas_poa', 0),
                    'placa_outros': item.get('placa_outros', 0)
                }
                
                pontuacao = self.criar_pontuacao_mes(
                    plantonista.id,
                    mes_referencia,
                    dados
                )
                
                resultados['sucesso'].append({
                    'nome': item['nome'],
                    'pontos': float(pontuacao.pontos_total)
                })
                
            except Exception as e:
                resultados['erros'].append({
                    'nome': item.get('nome', 'Desconhecido'),
                    'erro': str(e)
                })
        
        return resultados
