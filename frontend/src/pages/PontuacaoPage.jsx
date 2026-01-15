import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FiPlus, FiRefreshCw, FiEdit3, FiAward } from 'react-icons/fi';

export default function PontuacaoPage() {
  const [pontuacoes, setPontuacoes] = useState([]);
  const [plantonistas, setPlantonistas] = useState([]);
  const [mesReferencia, setMesReferencia] = useState(
    new Date().toISOString().slice(0, 7) + '-01'
  );
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    plantonista_id: '',
    vendas: 0,
    age_bairro_foco: 0,
    age_outros: 0,
    placa_bairro_foco: 0,
    placa_outros: 0,
    mes_referencia: mesReferencia
  });

  useEffect(() => {
    fetchDados();
  }, [mesReferencia]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      // Buscar pontuações do mês
      const resPont = await api.get(`/pontuacao/mes/${mesReferencia}`);
      setPontuacoes(resPont.data.dados.pontuacoes || []);

      // Buscar lista de plantonistas para o select
      const resPlat = await api.get('/pontuacao/ranking'); // Reusando endpoint que traz plantonistas
      setPlantonistas(resPlat.data.dados.ranking || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarPontuacao = async (e) => {
    e.preventDefault();
    if (!formData.plantonista_id) {
      toast.warning('Selecione um plantonista');
      return;
    }
    try {
      setLoading(true);
      await api.post('/pontuacao/criar', {
        ...formData,
        mes_referencia: mesReferencia
      });
      toast.success('Pontuação salva com sucesso!');
      setShowModal(false);
      fetchDados();
    } catch (error) {
      toast.error('Erro ao salvar pontuação');
    } finally {
      setLoading(false);
    }
  };

  const calcularRanking = async () => {
    try {
      setLoading(true);
      await api.post(`/pontuacao/calcular/${mesReferencia}`);
      toast.success('Ranking atualizado com sucesso!');
      fetchDados();
    } catch (error) {
      toast.error('Erro ao calcular ranking');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (p) => {
    setFormData({
      plantonista_id: p.plantonista_id,
      vendas: p.vendas,
      age_bairro_foco: p.age_bairro_foco,
      age_outros: p.age_outros,
      placa_bairro_foco: p.placa_bairro_foco,
      placa_outros: p.placa_outros
    });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="mb-8 lg:flex items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Meritocracia</h1>
          <p className="text-gray-600">Lance as produções e atualize o ranking oficial</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={() => {
              setFormData({ plantonista_id: '', vendas: 0, age_bairro_foco: 0, age_outros: 0, placa_bairro_foco: 0, placa_outros: 0 });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus />
            <span>Lançar Produção</span>
          </button>
          <button
            onClick={calcularRanking}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiAward />
            <span>Atualizar Ranking</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Corretor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendas</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Age. Foco</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Placas</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pontos Total</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pontuacoes.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                        {p.plantonista_nome?.charAt(0)}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{p.plantonista_nome}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.vendas}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.age_bairro_foco}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.placa_bairro_foco}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded-full">
                      {parseFloat(p.pontos_total).toFixed(1)} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(p)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg"
                    >
                      <FiEdit3 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pontuacoes.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAward className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-500 font-medium">Nenhum dado lançado para este mês.</p>
            <p className="text-gray-400 text-sm">Clique em "Lançar Produção" para começar.</p>
          </div>
        )}
      </div>

      {/* Modal de Lançamento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Lançar Produção</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSalvarPontuacao} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Corretor</label>
                <select
                  required
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border outline-none"
                  value={formData.plantonista_id}
                  onChange={(e) => setFormData({ ...formData, plantonista_id: e.target.value })}
                >
                  <option value="">Selecione o corretor...</option>
                  {plantonistas.map((plt) => (
                    <option key={plt.id} value={plt.id}>{plt.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Vendas Concluídas</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border outline-none"
                    value={formData.vendas}
                    onChange={(e) => setFormData({ ...formData, vendas: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Age. Bairro Foco</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border outline-none"
                    value={formData.age_bairro_foco}
                    onChange={(e) => setFormData({ ...formData, age_bairro_foco: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Placas Bairro Foco</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border outline-none"
                    value={formData.placa_bairro_foco}
                    onChange={(e) => setFormData({ ...formData, placa_bairro_foco: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Placas Outros</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border outline-none"
                    value={formData.placa_outros}
                    onChange={(e) => setFormData({ ...formData, placa_outros: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:bg-blue-300"
                >
                  {loading ? 'Salvando...' : 'Salvar Dados'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
