from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
import pytz
import os


class GoogleCalendarService:
    """Serviço para integração com Google Calendar"""
    
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self):
        self.timezone = pytz.timezone('America/Sao_Paulo')
    
    def criar_flow(self, redirect_uri):
        """Cria flow OAuth2 para autenticação"""
        client_config = {
            "web": {
                "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        }
        
        flow = Flow.from_client_config(
            client_config,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri
        )
        
        return flow
    
    def obter_credenciais(self, token_info):
        """Cria objeto de credenciais a partir do token"""
        creds = Credentials(
            token=token_info.get('access_token'),
            refresh_token=token_info.get('refresh_token'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            scopes=self.SCOPES
        )
        
        return creds
    
    def criar_evento_plantao(self, credentials, plantao, plantonista):
        """Cria evento no Google Calendar para um plantão"""
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            # Definir horários baseado no turno
            data = plantao.data
            if plantao.turno == 'manha':
                hora_inicio = '09:00'
                hora_fim = '13:00'
            else:  # tarde
                hora_inicio = '13:00'
                hora_fim = '18:00'
            
            # Criar datetime com timezone
            inicio = datetime.combine(data, datetime.strptime(hora_inicio, '%H:%M').time())
            fim = datetime.combine(data, datetime.strptime(hora_fim, '%H:%M').time())
            
            inicio = self.timezone.localize(inicio)
            fim = self.timezone.localize(fim)
            
            # Criar evento
            evento = {
                'summary': f'Plantão - {plantao.turno.capitalize()}',
                'description': f'Plantão {plantao.turno} na imobiliária\n'
                             f'Plantonista: {plantonista.usuario.nome}',
                'start': {
                    'dateTime': inicio.isoformat(),
                    'timeZone': 'America/Sao_Paulo',
                },
                'end': {
                    'dateTime': fim.isoformat(),
                    'timeZone': 'America/Sao_Paulo',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 dia antes
                        {'method': 'popup', 'minutes': 60},  # 1 hora antes
                    ],
                },
                'colorId': '9'  # Azul
            }
            
            # Inserir evento
            calendar_id = plantonista.google_calendar_id or 'primary'
            evento_criado = service.events().insert(
                calendarId=calendar_id,
                body=evento
            ).execute()
            
            return evento_criado.get('id')
            
        except HttpError as error:
            print(f'Erro ao criar evento: {error}')
            return None
    
    def atualizar_evento_plantao(self, credentials, event_id, plantao, plantonista):
        """Atualiza evento existente no Google Calendar"""
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            # Definir horários baseado no turno
            data = plantao.data
            if plantao.turno == 'manha':
                hora_inicio = '09:00'
                hora_fim = '13:00'
            else:
                hora_inicio = '13:00'
                hora_fim = '18:00'
            
            inicio = datetime.combine(data, datetime.strptime(hora_inicio, '%H:%M').time())
            fim = datetime.combine(data, datetime.strptime(hora_fim, '%H:%M').time())
            
            inicio = self.timezone.localize(inicio)
            fim = self.timezone.localize(fim)
            
            # Buscar evento existente
            calendar_id = plantonista.google_calendar_id or 'primary'
            evento = service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            # Atualizar campos
            evento['start'] = {
                'dateTime': inicio.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            }
            evento['end'] = {
                'dateTime': fim.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            }
            
            # Salvar alterações
            evento_atualizado = service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=evento
            ).execute()
            
            return True
            
        except HttpError as error:
            print(f'Erro ao atualizar evento: {error}')
            return False
    
    def deletar_evento_plantao(self, credentials, event_id, calendar_id='primary'):
        """Deleta evento do Google Calendar"""
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            return True
            
        except HttpError as error:
            print(f'Erro ao deletar evento: {error}')
            return False
    
    def listar_calendarios(self, credentials):
        """Lista todos os calendários do usuário"""
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            calendar_list = service.calendarList().list().execute()
            
            return calendar_list.get('items', [])
            
        except HttpError as error:
            print(f'Erro ao listar calendários: {error}')
            return []
    
    def criar_calendario(self, credentials, nome, descricao=''):
        """Cria um novo calendário"""
        try:
            service = build('calendar', 'v3', credentials=credentials)
            
            calendar = {
                'summary': nome,
                'description': descricao,
                'timeZone': 'America/Sao_Paulo'
            }
            
            calendario_criado = service.calendars().insert(body=calendar).execute()
            
            return calendario_criado.get('id')
            
        except HttpError as error:
            print(f'Erro ao criar calendário: {error}')
            return None
