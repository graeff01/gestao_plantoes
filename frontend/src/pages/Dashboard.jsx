import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { FiCalendar, FiUsers, FiAward, FiTrendingUp, FiActivity, FiBarChart, FiPieChart } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';
import useWebSocket from '../hooks/useWebSocket';

// Importar componentes BI
import { 
  OccupancyTrendChart, 
  PerformanceChart, 
  ShiftDistributionChart, 
  RealTimeMetrics, 
  AdvancedKPIs, 
  ActivityTimeline 
} from '../components/BI/Charts';
import { useBIData } from '../hooks/useBIData';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    proximos_plantoes: 0,
    ranking_posicao: '-',
    pontuacao_total: 0,
    taxa_ocupacao: 0,
    vagas_preenchidas: 0,
    total_vagas: 0,
    top_plantonista: '-'
  });
  const [meuDesempenho, setMeuDesempenho] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedBI, setShowAdvancedBI] = useState(false);

  // Hook para dados BI
  const biData = useBIData();
  
  // Hook para conectividade WebSocket
  const { isConnected } = useWebSocket();

  const isGestor = ['admin', 'gestor'].includes(user?.tipo);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [estatisticasRes, desempenhoRes, proximosRes, rankingRes, logsRes] = await Promise.all([
        api.get('/pontuacao/estatisticas'),
        user?.tipo === 'plantonista' ? api.get('/pontuacao/meu-desempenho') : Promise.resolve({ data: { dados: {} } }),
        user?.tipo === 'plantonista' ? api.get('/plantoes/meus-plantoes') : Promise.resolve({ data: { dados: {} } }),
        api.get('/pontuacao/ranking'),
        isGestor ? api.get('/logs', { params: { per_page: 5 } }) : Promise.resolve({ data: { dados: { logs: [] } } })
      ]);

      const estatisticas = estatisticasRes.data.dados;
      const desempenho = desempenhoRes.data.dados;
      const proximos = proximosRes.data.dados.alocacoes || [];
      const rankingData = rankingRes.data.dados.ranking || [];
      const logsData = logsRes.data.dados.logs || [];

      setStats({
        ...estatisticas,
        proximos_plantoes: proximos.length,
        ranking_posicao: desempenho.ranking_atual || '-',
        pontuacao_total: desempenho.pontuacao_total || 0,
      });

      setMeuDesempenho(desempenho.detalhes_mes);
      setRanking(rankingData.slice(0, 5));
      setLogs(logsData);

    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      name: 'Posição Ranking',
      value: stats.ranking_posicao !== '-' ? `${stats.ranking_posicao}º` : '-',
      icon: FiAward,
      color: 'bg-amber-500',
      show: !isGestor
    },
    {
      name: 'Pontuação Total',
      value: parseFloat(stats.pontuacao_total || 0).toFixed(1),
      icon: FiTrendingUp,
      color: 'bg-emerald-500',
      show: !isGestor
    },
    {
      name: 'Ocupação Escala',
      value: `${stats.taxa_ocupacao}%`,
      icon: FiUsers,
      color: 'bg-indigo-500',
      show: true
    },
    {
      name: 'Vagas Preenchidas',
      value: `${stats.vagas_preenchidas}/${stats.total_vagas}`,
      icon: FiCalendar,
      color: 'bg-blue-500',
      show: true
    },
    {
      name: 'Ponto Total (Todos)',
      value: stats.total_pontos?.toFixed(0) || 0,
      icon: FiTrendingUp,
      color: 'bg-purple-500',
      show: isGestor
    },
    {
      name: 'Top Plantonista',
      value: stats.top_plantonista || '-',
      icon: FiAward,
      color: 'bg-rose-500',
      show: isGestor
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-2">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Olá, <span className="text-blue-600">{user?.nome.split(' ')[0]}</span>!
          </h1>
          <p className="text-gray-500 font-medium text-sm">Veja o que está acontecendo no sistema hoje.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 text-sm font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-gray-600">
              Sistema {isConnected ? 'Conectado' : 'Operacional'}
            </span>
          </div>
          
          {/* Toggle BI Avançado (apenas para gestores) */}
          {isGestor && (
            <button
              onClick={() => setShowAdvancedBI(!showAdvancedBI)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl shadow-sm border transition-all ${
                showAdvancedBI 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-400' 
                  : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'
              }`}
            >
              <FiBarChart size={16} />
              <span className="text-sm font-bold">BI Avançado</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {statsConfig.filter(stat => stat.show).map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-50 p-4 hover:scale-[1.02] transition-transform cursor-default">
            <div className="flex items-center justify-between mb-2">
              <div className={`${stat.color} p-2 rounded-xl shadow-md border-2 border-white`}>
                <stat.icon className="text-white" size={16} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">Resumo</span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 mb-0">{stat.name}</p>
            <p className="text-xl font-black text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* BI Avançado (apenas para gestores quando ativado) */}
      {isGestor && showAdvancedBI && !biData.loading && (
        <div className="space-y-6">
          {/* KPIs Executivos */}
          <AdvancedKPIs kpis={biData.advancedKPIs} />

          {/* Métricas em Tempo Real */}
          <RealTimeMetrics metrics={biData.realTimeMetrics} />

          {/* Grid de Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OccupancyTrendChart data={biData.occupancyTrend} />
            <PerformanceChart data={biData.performanceData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ShiftDistributionChart data={biData.shiftDistribution} />
            </div>
            <ActivityTimeline activities={biData.activityTimeline} />
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1 min-h-0">

        {/* Left/Center Columns: Primary Content */}
        <div className="xl:col-span-3 flex flex-col space-y-4">

          {/* Performance Extract (Plantonista Only) - Compacted */}
          {!isGestor && meuDesempenho && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600 font-black">
                <FiTrendingUp size={120} />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center space-x-2">
                <FiAward className="text-blue-600" />
                <span>Extrato de Performance</span>
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 tracking-wider">Vendas</p>
                  <p className="text-xl font-black text-emerald-800">{meuDesempenho.vendas}</p>
                  <p className="text-[10px] text-emerald-500 mt-1 font-bold">+{meuDesempenho.pontos_vendas?.toFixed(1)} pts</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1 tracking-wider">Agenciamentos</p>
                  <p className="text-xl font-black text-blue-800">{meuDesempenho.agenciamentos_vendidos}</p>
                  <p className="text-[10px] text-blue-500 mt-1 font-bold">+{meuDesempenho.pontos_agenciamentos?.toFixed(1)} pts</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1 tracking-wider">Placas</p>
                  <p className="text-xl font-black text-orange-800">{meuDesempenho.placa_bairro_foco + meuDesempenho.placa_canoas_poa}</p>
                  <p className="text-[10px] text-orange-500 mt-1 font-bold">+{meuDesempenho.pontos_placas?.toFixed(1)} pts</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total do Mês</p>
                  <p className="text-2xl font-black text-gray-800 tracking-tight">
                    {meuDesempenho.pontos_total?.toFixed(1)}
                    <span className="text-xs font-bold text-gray-400 ml-1">PONTOS</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-600 uppercase italic">Meritocracia Veloce</p>
                </div>
              </div>
            </div>
          )}

          {/* Manager Action Panel (Gestor Only) */}
          {isGestor && (
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden group shrink-0 min-h-[140px] flex flex-col justify-center">
              <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:rotate-12 transition-transform">
                <FiUsers size={160} />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black mb-1">Painel Gestor</h2>
                  <p className="text-blue-100 text-sm font-medium">Escala, usuários e auditoria.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <a href="/plantoes" className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl border border-white/20 transition-all flex items-center space-x-2 group/btn">
                    <FiCalendar size={18} />
                    <span className="font-bold text-sm">Escala</span>
                  </a>
                  <a href="/historico" className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl border border-white/20 transition-all flex items-center space-x-2 group/btn">
                    <FiActivity size={18} />
                    <span className="font-bold text-sm">Histórico</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity (Gestor) or Alerts (Plantonista) */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-lg font-black text-gray-800">
                {isGestor ? 'Últimas Ações' : 'Avisos da Gestão'}
              </h3>
              {isGestor && <a href="/historico" className="text-xs font-bold text-blue-600 hover:underline">Ver tudo</a>}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {isGestor ? (
                <div className="space-y-3">
                  {logs.length > 0 ? logs.slice(0, 8).map((log, idx) => {
                    // Define colors and icons based on action type
                    const actionType = log.acao.toLowerCase();
                    const isSystem = actionType.includes('login') || actionType.includes('db');
                    const isScore = actionType.includes('pontu') || actionType.includes('venda') || actionType.includes('agencia');
                    const isUser = actionType.includes('usu') || actionType.includes('perfil');

                    return (
                      <div key={idx} className="group bg-white hover:bg-blue-50/30 transition-all p-3 rounded-2xl flex items-center justify-between border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-md">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className={`p-3 rounded-xl shrink-0 ${isScore ? 'bg-emerald-50 text-emerald-600' :
                            isUser ? 'bg-amber-50 text-amber-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                            {isScore ? <FiTrendingUp size={18} /> : isUser ? <FiUsers size={18} /> : <FiActivity size={18} />}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-800">
                              <span className="text-blue-600 font-black">{log.usuario?.nome.split(' ')[0]}</span>
                              <span className="mx-1 text-gray-400 font-medium">realizou</span>
                              <span className="capitalize">{log.acao.replace('_', ' ')}</span>
                            </p>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider flex items-center space-x-2">
                              <span>Módulo: {isScore ? 'Pontuação' : isUser ? 'Usuários' : 'Sistema'}</span>
                              <span>•</span>
                              <span>há {Math.floor((new Date() - new Date(log.created_at)) / 60000)} min</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 px-4 border-l border-gray-100 hidden sm:block">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Horário</p>
                          <p className="text-sm font-black text-gray-700">{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                      <FiActivity size={40} className="text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400 font-bold">Nenhuma atividade registrada no momento.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 p-8 rounded-3xl flex items-start space-x-6 max-w-4xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 text-amber-600 group-hover:scale-110 transition-transform">
                      <FiAward size={140} />
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-lg border-b-4 border-amber-200">
                      <FiAward size={36} className="text-amber-600" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-amber-800 font-black text-2xl mb-2 tracking-tight">Oportunidade: Janela de Escolha</h4>
                      <p className="text-amber-900 leading-relaxed font-bold text-lg opacity-80">
                        A abertura da escala para o próximo mês ocorre todo **dia 25, às 08:00**.
                        Quanto melhor sua posição no ranking, maior a sua liberdade de escolha!
                      </p>
                      <a href="/ranking" className="inline-flex items-center space-x-2 mt-4 text-amber-700 font-black hover:translate-x-1 transition-transform">
                        <span>Ver meu ranking atual</span>
                        <FiTrendingUp />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini-Ranking (Plantonista only) & Support */}
        <div className="flex flex-col space-y-4 h-full min-h-0">
          {/* Mini Ranking - Hidden for Admin as requested to save space */}
          {!isGestor && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
              <h3 className="text-base font-black text-gray-800 mb-3 shrink-0">Top 5 Líderes</h3>
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                {ranking.map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-gray-700 text-xs truncate max-w-[100px]">{player.usuario?.nome}</span>
                    </div>
                    <span className="font-black text-blue-600 text-[10px]">{player.pontos_total?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col justify-between overflow-hidden relative group" style={{ flex: isGestor ? '3' : '1' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors"></div>

            <h3 className="text-lg font-black text-gray-800 mb-4 tracking-tight uppercase flex items-center space-x-3 relative z-10">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span>Atalhos Rápidos</span>
            </h3>

            <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-1">
              <a href="/plantoes" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md hover:border-blue-100 border border-transparent transition-all group shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2.5 rounded-lg text-white shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
                    <FiCalendar size={18} />
                  </div>
                  <div>
                    <span className="block font-black text-[13px] uppercase tracking-wider text-gray-800">Ver Escala</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <span className="font-black text-base">→</span>
                </div>
              </a>

              <a href="/ranking" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md hover:border-amber-100 border border-transparent transition-all group shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500 p-2.5 rounded-lg text-white shadow-lg shadow-amber-100 group-hover:scale-105 transition-transform">
                    <FiAward size={18} />
                  </div>
                  <div>
                    <span className="block font-black text-[13px] uppercase tracking-wider text-gray-800">Ranking Geral</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <span className="font-black text-base">→</span>
                </div>
              </a>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between relative z-10 shrink-0">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Status Base</p>
                <p className="text-[11px] font-bold text-gray-600">Sincronizado ✅</p>
              </div>
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-200"></div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 text-white relative h-auto shrink-0 overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <FiTrendingUp size={60} />
            </div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Manual Base</p>
            <button className="w-full py-3 bg-white/10 hover:bg-white text-blue-900 hover:text-blue-900 font-black text-[10px] rounded-xl border border-white/20 transition-all uppercase tracking-widest">
              ABRIR PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
