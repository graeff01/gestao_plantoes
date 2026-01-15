import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiTrash2 } from 'react-icons/fi';

export default function MeusPlantoesPage() {
  const [plantoes, setPlantoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMeusPlantoes();
  }, []);

  const fetchMeusPlantoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/plantoes/meus-plantoes');
      setPlantoes(response.data.dados.alocacoes || []);
    } catch (error) {
      toast.error('Erro ao carregar plantões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarPlantao = async (alocacaoId) => {
    if (!confirm('Tem certeza que deseja cancelar este plantão?')) {
      return;
    }

    try {
      await api.delete(`/plantoes/cancelar/${alocacaoId}`);
      toast.success('Plantão cancelado com sucesso!');
      fetchMeusPlantoes();
    } catch (error) {
      toast.error(error.response?.data?.mensagem || 'Erro ao cancelar plantão');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Meus Plantões</h1>
        <p className="text-gray-600">Plantões que você escolheu</p>
      </div>

      {plantoes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FiCalendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">Você ainda não escolheu nenhum plantão</p>
          <a
            href="/plantoes"
            className="inline-block mt-4 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600"
          >
            Ver Plantões Disponíveis
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantoes.map((alocacao) => (
            <div key={alocacao.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <FiCalendar size={18} />
                    <span className="font-semibold">
                      {format(parseISO(alocacao.plantao.data), "dd/MM/yyyy - EEEE", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiClock size={18} />
                    <span className="capitalize">{alocacao.plantao.turno}</span>
                    <span className="text-sm">
                      ({alocacao.plantao.turno === 'manha' ? '09:00 - 13:00' : '13:00 - 18:00'})
                    </span>
                  </div>
                </div>
                <span className={`
                  px-3 py-1 rounded-full text-xs font-semibold
                  ${alocacao.status === 'confirmado' ? 'bg-green-100 text-green-800' : ''}
                  ${alocacao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${alocacao.status === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {alocacao.status}
                </span>
              </div>

              {alocacao.status === 'confirmado' && (
                <button
                  onClick={() => cancelarPlantao(alocacao.id)}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  <FiTrash2 />
                  <span>Cancelar Plantão</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
