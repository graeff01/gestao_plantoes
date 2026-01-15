import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FiAward, FiTrendingUp, FiActivity, FiUsers } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlantonista, setSelectedPlantonista] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const { user } = useAuthStore();
  const isGestor = ['admin', 'gestor'].includes(user?.tipo);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pontuacao/ranking');
      setRanking(response.data.dados.ranking || []);
    } catch (error) {
      toast.error('Erro ao carregar ranking');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalhes = async (plantonista) => {
    if (!isGestor) return;
    try {
      setSelectedPlantonista(plantonista);
      setLoadingDetalhes(true);
      const response = await api.get(`/pontuacao/plantonista/${plantonista.id}`);
      // Pegar a pontuação mais recente (mês atual)
      setDetalhes(response.data.dados.pontuacoes[0] || null);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da pontuação');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const getRankingColor = (position) => {
    if (position === 1) return 'bg-yellow-400';
    if (position === 2) return 'bg-gray-300';
    if (position === 3) return 'bg-orange-400';
    return 'bg-blue-100';
  };

  const getRankingIcon = (position) => {
    if (position <= 3) {
      return <FiAward size={24} className="text-white" />;
    }
    return <span className="font-bold text-gray-600">{position}º</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Ranking de <span className="text-blue-600">Performance</span></h1>
          <p className="text-gray-500 font-medium tracking-tight">Classificação baseada na pontuação consolidada do mês.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-2">
          <FiAward className="text-amber-500 w-5 h-5" />
          <span className="text-sm font-bold text-gray-700">{ranking.length} Plantonistas</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Posição</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Plantonista</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Pontuação</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Contato</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {ranking.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => verDetalhes(p)}
                  className={`group transition-all ${isGestor ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                >
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm border-2 border-white transition-transform group-hover:scale-110 ${getRankingColor(p.ranking)}`}>
                      {getRankingIcon(p.ranking)}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                        {p.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-black text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
                          {p.nome}
                        </div>
                        {isGestor && (
                          <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                            Clique para ver extrato
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl w-fit group-hover:bg-white transition-colors">
                      <FiTrendingUp className="text-emerald-500" />
                      <span className="text-lg font-black text-gray-900 tracking-tighter">
                        {parseFloat(p.pontuacao_total || 0).toFixed(1)}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">pts</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {p.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-20 bg-gray-50/50">
            <div className="bg-white w-20 h-20 rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center mx-auto mb-6">
              <FiAward className="text-gray-300" size={40} />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Nenhum plantonista ranqueado ainda</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes (Apenas para Gestores) */}
      {selectedPlantonista && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border border-white relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <FiAward size={150} />
            </div>

            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-200">
                {selectedPlantonista.nome.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedPlantonista.nome}</h3>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Extrato de Performance Mensal</p>
              </div>
            </div>

            {loadingDetalhes ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : detalhes ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Vendas (pts)</p>
                    <p className="text-2xl font-black text-emerald-800">{detalhes.vendas} <span className="text-sm font-bold opacity-50">({detalhes.pontos_vendas})</span></p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Agenciamentos</p>
                    <p className="text-2xl font-black text-blue-800">{detalhes.agenciamentos_vendidos} <span className="text-sm font-bold opacity-50">({detalhes.pontos_agenciamentos})</span></p>
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Placas / Outros</p>
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-black text-amber-800">{detalhes.pontos_placas} <span className="text-sm font-bold opacity-30 uppercase tracking-widest ml-1">Pontos</span></p>
                    <div className="text-[10px] font-bold text-amber-500 text-right">
                      Soma de placas e <br />bairros foco
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Consolidado</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tighter">{detalhes.pontos_total} <span className="text-sm font-bold text-blue-600">PTS</span></p>
                  </div>
                  <button
                    onClick={() => setSelectedPlantonista(null)}
                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-colors shadow-lg"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 font-bold uppercase tracking-widest">
                Nenhum dado detalhado encontrado para este mês.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
