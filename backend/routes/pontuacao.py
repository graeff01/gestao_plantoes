from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Pontuacao, Plantonista, Usuario, Plantao, Alocacao
from utils.auth import gestor_required, criar_resposta, criar_erro, log_acao, get_current_user
from utils.pontuacao import CalculadoraPontuacao
from datetime import datetime, date
import uuid

pontuacao_bp = Blueprint('pontuacao', __name__, url_prefix='/api/pontuacao')


@pontuacao_bp.route('/ranking', methods=['GET'])
@jwt_required()
def get_ranking():
    """Retorna o ranking atual dos plantonistas"""
    try:
        calc = CalculadoraPontuacao()
        ranking = calc.obter_ranking_atual()
        
        return criar_resposta(dados={'ranking': ranking})
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar ranking: {str(e)}', 500)


@pontuacao_bp.route('/calcular/<mes_referencia>', methods=['POST'])
@gestor_required
def calcular_ranking(mes_referencia):
    """Calcula o ranking para um mês específico"""
    try:
        calc = CalculadoraPontuacao()
        ranking = calc.calcular_ranking_mes(mes_referencia)
        
        user = get_current_user()
        log_acao(user.id, 'calcular_ranking', detalhes={'mes': mes_referencia})
        
        return criar_resposta(
            mensagem='Ranking calculado com sucesso',
            dados={'ranking': [p.to_dict() for p in ranking]}
        )
        
    except Exception as e:
        return criar_erro(f'Erro ao calcular ranking: {str(e)}', 500)


@pontuacao_bp.route('/mes/<mes_referencia>', methods=['GET'])
@jwt_required()
def get_pontuacao_mes(mes_referencia):
    """Retorna pontuações de todos os plantonistas para um mês"""
    try:
        data_ref = datetime.strptime(mes_referencia, '%Y-%m-%d').date()
        
        pontuacoes = Pontuacao.query.filter_by(mes_referencia=data_ref).all()
        
        return criar_resposta(dados={
            'pontuacoes': [p.to_dict() for p in pontuacoes]
        })
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar pontuações: {str(e)}', 500)


@pontuacao_bp.route('/plantonista/<plantonista_id>', methods=['GET'])
@jwt_required()
def get_pontuacao_plantonista(plantonista_id):
    """Retorna histórico de pontuações de um plantonista"""
    try:
        pontuacoes = Pontuacao.query.filter_by(
            plantonista_id=plantonista_id
        ).order_by(
            Pontuacao.mes_referencia.desc()
        ).all()
        
        return criar_resposta(dados={
            'pontuacoes': [p.to_dict() for p in pontuacoes]
        })
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar pontuações do plantonista: {str(e)}', 500)


@pontuacao_bp.route('/criar', methods=['POST'])
@gestor_required
def criar_pontuacao():
    """Cria ou atualiza pontuação de um plantonista"""
    try:
        data = request.get_json()
        
        plantonista_id = data.get('plantonista_id')
        mes_referencia = data.get('mes_referencia')
        
        if not plantonista_id or not mes_referencia:
            return criar_erro('plantonista_id e mes_referencia são obrigatórios', 400)
        
        # Verificar se plantonista existe
        plantonista = Plantonista.query.get(plantonista_id)
        if not plantonista:
            return criar_erro('Plantonista não encontrado', 404)
        
        # Transação atômica para operação crítica
        try:
            with db.session.begin():
                calc = CalculadoraPontuacao()
                
                dados_pontuacao = {
                    'vendas': data.get('vendas', 0),
                    'agenciamentos_vendidos': data.get('agenciamentos_vendidos', 0),
                    'age_bairro_foco': data.get('age_bairro_foco', 0),
                    'age_canoas_poa': data.get('age_canoas_poa', 0),
                    'age_outros': data.get('age_outros', 0),
                    'acima_1mm': data.get('acima_1mm', 0),
                    'placa_bairro_foco': data.get('placa_bairro_foco', 0),
                    'placa_canoas_poa': data.get('placa_canoas_poa', 0),
                    'placa_outros': data.get('placa_outros', 0)
                }
                
                pontuacao = calc.criar_pontuacao_mes(
                    plantonista_id,
                    mes_referencia,
                    dados_pontuacao
                )
                
                # Log da ação
                user = get_current_user()
                log_acao(user.id, 'criar_pontuacao', 'pontuacao', pontuacao.id, detalhes=dados_pontuacao)
                
                # Commit implícito pelo context manager
                
        except Exception as e:
            db.session.rollback()
            raise e
        
        return criar_resposta(
            mensagem='Pontuação criada/atualizada com sucesso',
            dados={'pontuacao': pontuacao.to_dict()},
            codigo=201
        )
        
    except Exception as e:
        return criar_erro(f'Erro ao criar pontuação: {str(e)}', 500)


@pontuacao_bp.route('/importar', methods=['POST'])
@gestor_required
def importar_pontuacoes():
    """Importa pontuações em lote (de planilha)"""
    try:
        data = request.get_json()
        
        mes_referencia = data.get('mes_referencia')
        pontuacoes = data.get('pontuacoes', [])
        
        if not mes_referencia or not pontuacoes:
            return criar_erro('mes_referencia e pontuacoes são obrigatórios', 400)
        
        calc = CalculadoraPontuacao()
        resultados = calc.importar_pontuacoes_planilha(mes_referencia, pontuacoes)
        
        # Calcular ranking após importação
        calc.calcular_ranking_mes(mes_referencia)
        
        # Log da ação
        user = get_current_user()
        log_acao(user.id, 'importar_pontuacoes', detalhes={
            'mes': mes_referencia,
            'total': len(pontuacoes),
            'sucesso': len(resultados['sucesso']),
            'erros': len(resultados['erros'])
        })
        
        return criar_resposta(
            mensagem=f"Importação concluída: {len(resultados['sucesso'])} sucessos, {len(resultados['erros'])} erros",
            dados=resultados
        )
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao importar pontuações: {str(e)}', 500)


@pontuacao_bp.route('/<pontuacao_id>', methods=['DELETE'])
@gestor_required
def deletar_pontuacao(pontuacao_id):
    """Deleta uma pontuação"""
    try:
        pontuacao = Pontuacao.query.get(pontuacao_id)
        
        if not pontuacao:
            return criar_erro('Pontuação não encontrada', 404)
        
        mes_ref = pontuacao.mes_referencia
        
        db.session.delete(pontuacao)
        db.session.commit()
        
        # Recalcular ranking do mês
        calc = CalculadoraPontuacao()
        calc.calcular_ranking_mes(mes_ref)
        
        # Log da ação
        user = get_current_user()
        log_acao(user.id, 'deletar_pontuacao', 'pontuacao', pontuacao_id)
        
        return criar_resposta(mensagem='Pontuação deletada com sucesso')
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao deletar pontuação: {str(e)}', 500)


@pontuacao_bp.route('/estatisticas', methods=['GET'])
@jwt_required()
def get_estatisticas():
    """Retorna estatísticas gerais de pontuação e plantões"""
    try:
        # Usar uma única query para plantonista com mais pontos
        top_query = db.session.query(
            Usuario.nome,
            Plantonista.pontuacao_total
        ).join(Plantonista, Usuario.id == Plantonista.usuario_id)\
         .order_by(Plantonista.pontuacao_total.desc())\
         .first()
        
        top_nome = top_query.nome if top_query else None
        
        # Queries otimizadas em paralelo
        hoje = date.today()
        primeiro_dia = hoje.replace(day=1)
        
        # Single query para estatísticas do mês
        stats_query = db.session.query(
            db.func.sum(Pontuacao.pontos_total).label('total_pontos'),
            db.func.sum(Plantao.max_plantonistas).label('total_vagas'),
            db.func.count(Alocacao.id).label('vagas_preenchidas')
        ).select_from(Plantao)\
         .outerjoin(Alocacao, 
            db.and_(Plantao.id == Alocacao.plantao_id, Alocacao.status == 'confirmado'))\
         .outerjoin(Pontuacao, 
            Pontuacao.mes_referencia == primeiro_dia)\
         .filter(
            Plantao.data >= primeiro_dia,
            Plantao.data <= hoje
        ).first()
        
        total_pontos = float(stats_query.total_pontos or 0)
        total_vagas = int(stats_query.total_vagas or 0)
        vagas_preenchidas = int(stats_query.vagas_preenchidas or 0)
        taxa_ocupacao = (vagas_preenchidas / total_vagas * 100) if total_vagas > 0 else 0.0
        
        return criar_resposta(dados={
            'total_pontos': total_pontos,
            'taxa_ocupacao': round(float(taxa_ocupacao), 1),
            'vagas_preenchidas': vagas_preenchidas,
            'total_vagas': total_vagas,
            'top_plantonista': top_nome
        })
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar estatísticas: {str(e)}', 500)

@pontuacao_bp.route('/meu-desempenho', methods=['GET'])
@jwt_required()
def get_meu_desempenho():
    """Extrato de desempenho do plantonista logado"""
    try:
        user = get_current_user()
        if user.tipo != 'plantonista' or not user.plantonista:
            return criar_erro('Apenas plantonistas podem acessar seu extrato', 403)
            
        # Pegar pontuação do mês atual
        hoje = date.today()
        mes_ref = hoje.replace(day=1)
        
        pontuacao = Pontuacao.query.filter_by(
            plantonista_id=user.plantonista.id,
            mes_referencia=mes_ref
        ).first()
        
        return criar_resposta(dados={
            'ranking_atual': user.plantonista.ranking,
            'pontuacao_total': float(user.plantonista.pontuacao_total),
            'detalhes_mes': pontuacao.to_dict() if pontuacao else None
        })
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar desempenho: {str(e)}', 500)
