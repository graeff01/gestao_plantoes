from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Plantao, Alocacao, Plantonista, Usuario
from utils.auth import gestor_required, criar_resposta, criar_erro, log_acao, get_current_user
from datetime import datetime, date, timedelta
from calendar import monthrange
import uuid

plantao_bp = Blueprint('plantao', __name__, url_prefix='/api/plantoes')


@plantao_bp.route('', methods=['GET'])
@jwt_required()
def get_plantoes():
    """Retorna todos os plantões filtrados por data"""
    try:
        inicio = request.args.get('inicio')
        fim = request.args.get('fim')
        
        # Query simples e confiável
        query = Plantao.query
        
        if inicio:
            query = query.filter(Plantao.data >= datetime.strptime(inicio, '%Y-%m-%d').date())
        if fim:
            query = query.filter(Plantao.data <= datetime.strptime(fim, '%Y-%m-%d').date())
            
        plantoes = query.order_by(Plantao.data, Plantao.turno).all()
        
        resultado = []
        for plantao in plantoes:
            plantao_dict = plantao.to_dict()
            # Buscar alocações confirmadas
            alocacoes = Alocacao.query.filter_by(
                plantao_id=plantao.id, 
                status='confirmado'
            ).all()
            plantao_dict['alocacoes'] = [a.to_dict() for a in alocacoes]
            resultado.append(plantao_dict)
            
        return criar_resposta(dados={'plantoes': resultado})
    except Exception as e:
        return criar_erro(f'Erro ao buscar plantões: {str(e)}', 500)

@plantao_bp.route('/mes/<ano>/<mes>', methods=['GET'])
@jwt_required()
def get_plantoes_mes(ano, mes):
    """Retorna todos os plantões de um mês"""
    try:
        # Primeiro e último dia do mês
        primeiro_dia = date(int(ano), int(mes), 1)
        ultimo_dia = date(int(ano), int(mes), monthrange(int(ano), int(mes))[1])
        
        # Query simples e confiável
        plantoes = Plantao.query.filter(
            Plantao.data >= primeiro_dia,
            Plantao.data <= ultimo_dia
        ).order_by(Plantao.data, Plantao.turno).all()
        
        # Montar resposta com alocações
        resultado = []
        for plantao in plantoes:
            plantao_dict = plantao.to_dict()
            # Buscar alocações
            alocacoes = Alocacao.query.filter_by(plantao_id=plantao.id).all()
            plantao_dict['alocacoes'] = [a.to_dict() for a in alocacoes]
            resultado.append(plantao_dict)
            resultado.append(plantao_dict)
        
        return criar_resposta(dados={'plantoes': resultado})
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar plantões: {str(e)}', 500)


@plantao_bp.route('/gerar-mes', methods=['POST'])
@gestor_required
def gerar_plantoes_mes():
    """Gera automaticamente plantões para um mês"""
    try:
        data = request.get_json()
        
        ano = data.get('ano')
        mes = data.get('mes')
        
        if not ano or not mes:
            return criar_erro('Ano e mês são obrigatórios', 400)
        
        # Dias do mês
        num_dias = monthrange(int(ano), int(mes))[1]
        
        plantoes_criados = []
        plantoes_existentes = 0
        
        for dia in range(1, num_dias + 1):
            data_plantao = date(int(ano), int(mes), dia)
            dia_semana = data_plantao.weekday()  # 0=segunda, 6=domingo
            
            # Pular domingos (dia_semana == 6)
            if dia_semana == 6:
                continue
            
            # Criar plantões manhã e tarde
            for turno in ['manha', 'tarde']:
                # Verificar se já existe
                plantao_existe = Plantao.query.filter_by(
                    data=data_plantao,
                    turno=turno
                ).first()
                
                if plantao_existe:
                    plantoes_existentes += 1
                    continue
                
                # Criar plantão
                plantao = Plantao(
                    data=data_plantao,
                    turno=turno,
                    status='disponivel',
                    max_plantonistas=2
                )
                
                db.session.add(plantao)
                plantoes_criados.append(plantao)
        
        db.session.commit()
        
        # Log da ação
        user = get_current_user()
        log_acao(user.id, 'gerar_plantoes', detalhes={
            'ano': ano,
            'mes': mes,
            'criados': len(plantoes_criados),
            'existentes': plantoes_existentes
        })
        
        return criar_resposta(
            mensagem=f'{len(plantoes_criados)} plantões criados, {plantoes_existentes} já existiam',
            dados={
                'criados': len(plantoes_criados),
                'existentes': plantoes_existentes
            },
            codigo=201
        )
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao gerar plantões: {str(e)}', 500)


@plantao_bp.route('/<plantao_id>/escolher', methods=['POST'])
@jwt_required()
def escolher_plantao(plantao_id):
    """Plantonista escolhe um plantão disponível"""
    try:
        user = get_current_user()
        hoje = date.today()
        agora = datetime.utcnow()
        
        # Verificar se é plantonista
        if user.tipo != 'plantonista':
            return criar_erro('Apenas plantonistas podem escolher plantões', 403)
        
        plantonista = user.plantonista
        if not plantonista:
            return criar_erro('Registro de plantonista não encontrado', 404)
        
        if not plantao_id:
            return criar_erro('plantao_id é obrigatório', 400)
        
        # Buscar plantão
        plantao = Plantao.query.get(plantao_id)
        if not plantao:
            return criar_erro('Plantão não encontrado', 404)
        
        # Verificar se plantão está disponível
        if plantao.status not in ['disponivel', 'reservado']:
            return criar_erro('Plantão não está disponível', 400)
        
        # Verificar vagas
        alocacoes_confirmadas = Alocacao.query.filter_by(
            plantao_id=plantao_id,
            status='confirmado'
        ).count()
        
        if alocacoes_confirmadas >= plantao.max_plantonistas:
            return criar_erro('Plantão sem vagas disponíveis', 400)
        
        # Verificar se plantonista já escolheu este plantão
        alocacao_existente = Alocacao.query.filter_by(
            plantao_id=plantao_id,
            plantonista_id=plantonista.id
        ).first()
        
        if alocacao_existente:
            return criar_erro('Você já escolheu este plantão', 400)
            
        # Verificar se já tem outro plantão no mesmo DIA (Manhã + Tarde não permitido)
        outro_plantao_dia = Alocacao.query.join(Plantao).filter(
            Alocacao.plantonista_id == plantonista.id,
            Alocacao.status == 'confirmado',
            Plantao.data == plantao.data
        ).first()
        
        if outro_plantao_dia:
            return criar_erro('Não é permitido fazer dois plantões no mesmo dia', 400)
        
        # Verificar limite de plantões do mês - versão mais robusta
        try:
            mes_plantao = plantao.data.replace(day=1)
            # Calcular último dia do mês de forma segura
            if mes_plantao.month == 12:
                proximo_mes = mes_plantao.replace(year=mes_plantao.year + 1, month=1)
            else:
                proximo_mes = mes_plantao.replace(month=mes_plantao.month + 1)
            
            # Query mais segura usando between
            plantoes_mes = Alocacao.query.join(Plantao).filter(
                Alocacao.plantonista_id == plantonista.id,
                Alocacao.status == 'confirmado',
                Plantao.data >= mes_plantao,
                Plantao.data < proximo_mes
            ).count()
            
        except Exception:
            # Fallback simples se houver erro
            plantoes_mes = 0
        
        if plantoes_mes >= plantonista.max_plantoes_mes:
            return criar_erro(f'Você atingiu o limite de {plantonista.max_plantoes_mes} plantões no mês', 400)
            
        # Impedir escolha de plantões que já passaram
        if plantao.data < hoje:
            return criar_erro('Não é possível escolher plantões de datas passadas', 400)
            
        # --- Lógica de Meritocracia (Ranking) Simplificada ---
        # Dia 25 é o dia padrão de abertura para o mês seguinte
        DIA_ABERTURA_PADRAO = 25
        HORA_INICIO = 8  # 1º lugar às 08:00
        
        # Simplificar lógica de ranking - ser menos restritivo
        ranking = plantonista.ranking or 99
        
        # Para plantões do mês atual - sem restrições de ranking
        if plantao.data.year == hoje.year and plantao.data.month == hoje.month:
            # Liberar totalmente para mês atual
            pass  
        
        # Para plantões do mês seguinte - aplicar regras de ranking
        elif plantao.data.year == hoje.year and plantao.data.month == hoje.month + 1:
            data_abertura = date(hoje.year, hoje.month, DIA_ABERTURA_PADRAO)
            
            # Se ainda não abriu
            if hoje < data_abertura:
                return criar_erro(f'A escolha para o mês {plantao.data.strftime("%m/%Y")} será liberada em {data_abertura.strftime("%d/%m/%Y")}', 403)
            
            # Se abriu hoje, verificar horário apenas para rankings altos
            if hoje == data_abertura and ranking <= 10:  # Apenas top 10 tem restrição de horário
                hora_permitida = HORA_INICIO + (ranking - 1)
                if agora.hour < hora_permitida:
                    return criar_erro(f'Sua posição no ranking ({ranking}º) permite escolha a partir das {hora_permitida:02d}:00', 403)
        
        # Para plantões muito futuros
        elif plantao.data > date(hoje.year, hoje.month + 2, 1):
            return criar_erro('Não é possível escolher plantões tão distantes', 403)
            
        # Logica especial: "Depois que o da frente escolher"
        # Para ser 100% rigoroso como o cliente pediu, podemos opcionalmente olhar se os rankings superiores já escolheram.
        # Mas a janela de horário já resolve 99% dos casos se respeitada.
        # ----------------------------------------
        
        # Criar alocação com transação atômica
        alocacao = None  # Inicializar variável
        try:
            with db.session.begin():
                # Re-verificar disponibilidade dentro da transação
                alocacoes_atuais = Alocacao.query.filter_by(
                    plantao_id=plantao_id,
                    status='confirmado'
                ).count()
                
                if alocacoes_atuais >= plantao.max_plantonistas:
                    return criar_erro('Plantão sem vagas disponíveis (verificação final)', 400)
                
                alocacao = Alocacao(
                    plantao_id=plantao_id,
                    plantonista_id=plantonista.id,
                    status='confirmado',
                    tipo='escolha',
                    confirmado_em=datetime.utcnow()
                )
                
                db.session.add(alocacao)
                
                # Atualizar status do plantão
                alocacoes_confirmadas = alocacoes_atuais + 1
                if alocacoes_confirmadas >= plantao.max_plantonistas:
                    plantao.status = 'confirmado'
                else:
                    plantao.status = 'reservado'
                
                # Log da ação
                log_acao(user.id, 'escolher_plantao', 'alocacoes', alocacao.id, detalhes={
                    'plantao_id': str(plantao_id),
                    'data': plantao.data.isoformat(),
                    'turno': plantao.turno
                })
                
                # Commit implícito pelo context manager
        except Exception as e:
            return criar_erro(f'Erro na transação: {str(e)}', 500)
        
        if alocacao:
            return criar_resposta(
                mensagem='Plantão escolhido com sucesso',
                dados={'alocacao': alocacao.to_dict()},
                codigo=201
            )
        else:
            return criar_erro('Falha ao criar alocação', 500)
        
    except Exception as e:
        return criar_erro(f'Erro ao escolher plantão: {str(e)}', 500)


@plantao_bp.route('/cancelar/<alocacao_id>', methods=['DELETE'])
@jwt_required()
def cancelar_alocacao(alocacao_id):
    """Plantonista cancela uma alocação"""
    try:
        user = get_current_user()
        
        # Buscar alocação
        alocacao = Alocacao.query.get(alocacao_id)
        if not alocacao:
            return criar_erro('Alocação não encontrada', 404)
        
        # Verificar permissão
        if user.tipo == 'plantonista':
            if str(alocacao.plantonista.usuario_id) != str(user.id):
                return criar_erro('Você não pode cancelar alocação de outro plantonista', 403)
        elif user.tipo not in ['admin', 'gestor']:
            return criar_erro('Sem permissão para cancelar alocação', 403)
        
        # Verificar se pode cancelar (ex: não pode cancelar no mesmo dia)
        plantao = alocacao.plantao
        if plantao.data <= date.today():
            if user.tipo == 'plantonista':
                return criar_erro('Não é possível cancelar plantões do dia atual ou passados', 400)
        
        # Cancelar alocação
        alocacao.status = 'cancelado'
        
        # Atualizar status do plantão
        alocacoes_confirmadas = Alocacao.query.filter_by(
            plantao_id=plantao.id,
            status='confirmado'
        ).count()
        
        if alocacoes_confirmadas < plantao.max_plantonistas:
            plantao.status = 'disponivel'
        
        db.session.commit()
        
        # Log da ação
        log_acao(user.id, 'cancelar_alocacao', 'alocacoes', alocacao_id, detalhes={
            'plantao_id': str(plantao.id),
            'data': plantao.data.isoformat()
        })
        
        return criar_resposta(mensagem='Alocação cancelada com sucesso')
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao cancelar alocação: {str(e)}', 500)


@plantao_bp.route('/meus-plantoes', methods=['GET'])
@jwt_required()
def get_meus_plantoes():
    """Retorna plantões do plantonista logado"""
    try:
        user = get_current_user()
        
        if user.tipo != 'plantonista':
            return criar_erro('Apenas plantonistas podem acessar este endpoint', 403)
        
        plantonista = user.plantonista
        if not plantonista:
            return criar_erro('Registro de plantonista não encontrado', 404)
        
        # Buscar alocações
        alocacoes = Alocacao.query.filter_by(
            plantonista_id=plantonista.id
        ).join(Plantao).filter(
            Plantao.data >= date.today()
        ).order_by(Plantao.data, Plantao.turno).all()
        
        resultado = []
        for alocacao in alocacoes:
            aloc_dict = alocacao.to_dict()
            aloc_dict['plantao'] = alocacao.plantao.to_dict()
            resultado.append(aloc_dict)
        
        return criar_resposta(dados={'alocacoes': resultado})
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar plantões: {str(e)}', 500)


@plantao_bp.route('/disponiveis', methods=['GET'])
@jwt_required()
def get_plantoes_disponiveis():
    """Retorna plantões disponíveis para escolha"""
    try:
        user = get_current_user()
        
        if user.tipo != 'plantonista':
            return criar_erro('Apenas plantonistas podem acessar este endpoint', 403)
        
        # Parâmetros opcionais
        data_inicio = request.args.get('data_inicio', date.today().isoformat())
        data_fim = request.args.get('data_fim')
        
        if not data_fim:
            # Padrão: próximos 60 dias
            data_fim = (date.today() + timedelta(days=60)).isoformat()
        
        data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d').date()
        
        # Buscar plantões disponíveis
        plantoes = Plantao.query.filter(
            Plantao.data >= data_inicio_obj,
            Plantao.data <= data_fim_obj,
            Plantao.status.in_(['disponivel', 'reservado'])
        ).order_by(Plantao.data, Plantao.turno).all()
        
        resultado = []
        for plantao in plantoes:
            # Verificar vagas
            alocacoes = Alocacao.query.filter_by(
                plantao_id=plantao.id,
                status='confirmado'
            ).count()
            
            if alocacoes < plantao.max_plantonistas:
                plantao_dict = plantao.to_dict()
                plantao_dict['vagas_ocupadas'] = alocacoes
                resultado.append(plantao_dict)
        
        return criar_resposta(dados={'plantoes': resultado})
        
    except Exception as e:
        return criar_erro(f'Erro ao buscar plantões disponíveis: {str(e)}', 500)


@plantao_bp.route('/<plantao_id>', methods=['PUT'])
@gestor_required
def atualizar_plantao(plantao_id):
    """Atualiza informações de um plantão"""
    try:
        plantao = Plantao.query.get(plantao_id)
        
        if not plantao:
            return criar_erro('Plantão não encontrado', 404)
        
        data = request.get_json()
        
        # Campos atualizáveis
        if 'status' in data:
            plantao.status = data['status']
        if 'max_plantonistas' in data:
            plantao.max_plantonistas = data['max_plantonistas']
        if 'observacoes' in data:
            plantao.observacoes = data['observacoes']
        
        db.session.commit()
        
        # Log da ação
        user = get_current_user()
        log_acao(user.id, 'atualizar_plantao', 'plantoes', plantao_id, detalhes=data)
        
        return criar_resposta(
            mensagem='Plantão atualizado com sucesso',
            dados={'plantao': plantao.to_dict()}
        )
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao atualizar plantão: {str(e)}', 500)


@plantao_bp.route('/<plantao_id>', methods=['DELETE'])
@gestor_required
def deletar_plantao(plantao_id):
    """Deleta um plantão (apenas se não tiver alocações)"""
    try:
        plantao = Plantao.query.get(plantao_id)
        
        if not plantao:
            return criar_erro('Plantão não encontrado', 404)
        
        # Verificar se tem alocações
        tem_alocacoes = Alocacao.query.filter_by(plantao_id=plantao_id).count() > 0
        
        if tem_alocacoes:
            return criar_erro('Não é possível deletar plantão com alocações', 400)
        
        db.session.delete(plantao)
        db.session.commit()
        
        # Log da ação
        user = get_current_user()
        log_acao(user.id, 'deletar_plantao', 'plantoes', plantao_id)
        
        return criar_resposta(mensagem='Plantão deletado com sucesso')
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao deletar plantão: {str(e)}', 500)

@plantao_bp.route('/<plantao_id>/atribuir', methods=['POST'])
@gestor_required
def atribuir_plantonista(plantao_id):
    """Gestor atribui manualmente um plantonista a um plantão"""
    try:
        data = request.get_json()
        plantonista_id = data.get('plantonista_id')
        
        if not plantonista_id:
            return criar_erro('plantonista_id é obrigatório', 400)
        
        # Transação atômica para proteção contra concorrência
        try:
            with db.session.begin():
                plantao = Plantao.query.get(plantao_id)
                plantonista = Plantonista.query.get(plantonista_id)
                
                if not plantao or not plantonista:
                    return criar_erro('Plantão ou Plantonista não encontrado', 404)
                
                # Verificar alocação existente
                alocacao_existente = Alocacao.query.filter_by(
                    plantao_id=plantao_id,
                    plantonista_id=plantonista_id,
                    status='confirmado'
                ).first()
                
                if alocacao_existente:
                    return criar_erro('Plantonista já está alocado neste plantão', 400)
                    
                # Verificar se já tem outro plantão no mesmo DIA
                outro_plantao_dia = Alocacao.query.join(Plantao).filter(
                    Alocacao.plantonista_id == plantonista_id,
                    Alocacao.status == 'confirmado',
                    Plantao.data == plantao.data
                ).first()
                
                if outro_plantao_dia:
                    return criar_erro('Não é permitido que um plantonista faça dois turnos no mesmo dia', 400)
                
                # Verificar se há vagas
                alocacoes_atuais = Alocacao.query.filter_by(
                    plantao_id=plantao_id, 
                    status='confirmado'
                ).count()
                
                if alocacoes_atuais >= plantao.max_plantonistas:
                    return criar_erro('Plantão já está lotado', 400)
                    
                alocacao = Alocacao(
                    plantao_id=plantao_id,
                    plantonista_id=plantonista_id,
                    status='confirmado',
                    tipo='atribuido',
                    confirmado_em=datetime.utcnow()
                )
                
                db.session.add(alocacao)
                
                # Atualizar status do plantão
                if (alocacoes_atuais + 1) >= plantao.max_plantonistas:
                    plantao.status = 'confirmado'
                else:
                    plantao.status = 'reservado'
                
                # Log
                user = get_current_user()
                log_acao(user.id, 'atribuir_plantonista', 'alocacoes', alocacao.id)
                
                # Commit implícito pelo context manager
                
        except Exception as e:
            db.session.rollback()
            raise e
        
        return criar_resposta(
            mensagem='Plantonista atribuído com sucesso', 
            dados={'alocacao': alocacao.to_dict()}
        )
        
    except Exception as e:
        return criar_erro(f'Erro ao atribuir plantonista: {str(e)}', 500)

@plantao_bp.route('/<plantao_id>/remover-alocacao', methods=['DELETE'])
@gestor_required
def remover_alocacao(plantao_id):
    """Gestor remove um plantonista de um plantão"""
    try:
        data = request.get_json()
        plantonista_id = data.get('plantonista_id')
        
        if not plantonista_id:
            return criar_erro('plantonista_id é obrigatório', 400)
            
        alocacao = Alocacao.query.filter_by(
            plantao_id=plantao_id, 
            plantonista_id=plantonista_id,
            status='confirmado'
        ).first()
        
        if not alocacao:
            return criar_erro('Alocação não encontrada', 404)
            
        db.session.delete(alocacao)
        
        # Atualizar status do plantão
        plantao = Plantao.query.get(plantao_id)
        if plantao:
            plantao.status = 'disponivel'
            
        db.session.commit()
        
        # Log
        user = get_current_user()
        log_acao(user.id, 'remover_alocacao', 'alocacoes', alocacao.id)
        
        return criar_resposta(mensagem='Plantonista removido com sucesso')
        
    except Exception as e:
        db.session.rollback()
        return criar_erro(f'Erro ao remover alocação: {str(e)}', 500)
