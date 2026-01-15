import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiClock, FiUsers, FiUserPlus } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

export default function PlantoesPage() {
  const { user } = useAuthStore();
  const isGestor = ['admin', 'gestor'].includes(user?.tipo);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plantoes, setPlantoes] = useState([]);
  const [plantonistas, setPlantonistas] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({ plantaoId: '', plantonistaId: '' });

  useEffect(() => {
    fetchPlantoes();
    if (isGestor) fetchPlantonistas();
  }, [currentMonth]);

  const fetchPlantoes = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const response = await api.get('/plantoes', {
        params: {
          inicio: format(start, 'yyyy-MM-dd'),
          fim: format(end, 'yyyy-MM-dd')
        }
      });
      setPlantoes(response.data.dados.plantoes);
    } catch (error) {
      toast.error('Erro ao buscar plantões');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantonistas = async () => {
    try {
      const response = await api.get('/auth/usuarios', { params: { tipo: 'plantonista' } });
      setPlantonistas(response.data.dados.usuarios);
    } catch (error) {
      toast.error('Erro ao buscar plantonistas');
    }
  };

  const escolherPlantao = async (plantaoId) => {
    try {
      await api.post(`/plantoes/${plantaoId}/escolher`);
      toast.success('Plantão reservado com sucesso!');
      fetchPlantoes();
    } catch (error) {
      toast.error(error.response?.data?.mensagem || 'Erro ao escolher plantão');
    }
  };

  const atribuirManual = async () => {
    if (!assignmentData.plantonistaId) return;
    try {
      await api.post(`/plantoes/${assignmentData.plantaoId}/atribuir`, {
        plantonista_id: assignmentData.plantonistaId
      });
      toast.success('Plantonista atribuído com sucesso!');
      setShowAssignModal(false);
      fetchPlantoes();
    } catch (error) {
      toast.error(error.response?.data?.mensagem || 'Erro ao atribuir plantonista');
    }
  };

  const removerPlantonista = async (plantaoId, plantonistaId) => {
    if (!window.confirm('Tem certeza que deseja remover este plantonista do plantão?')) return;
    try {
      await api.delete(`/plantoes/${plantaoId}/remover-alocacao`, {
        data: { plantonista_id: plantonistaId }
      });
      toast.success('Plantonista removido com sucesso!');
      fetchPlantoes();
    } catch (error) {
      toast.error(error.response?.data?.mensagem || 'Erro ao remover plantonista');
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getPlantoesDodia = (date) => {
    return plantoes.filter(p => isSameDay(parseISO(p.data), date));
  };

  const selectedDayPlantoes = selectedDate ? getPlantoesDodia(selectedDate) : [];

  if (loading && plantoes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Escala de Plantões</h1>
          <p className="text-gray-600">
            {isGestor ? 'Gerencie a escala oficial da imobiliária' : 'Escolha seus plantões baseados no ranking'}
          </p>
        </div>

        {!isGestor && user?.ranking && (
          <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-lg border border-blue-400">
            <div className="flex items-center space-x-3">
              <div className="bg-white text-blue-600 rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl">
                {user.ranking}º
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-80">Sua Posição no Ranking</p>
                <p className="text-lg font-bold">Abertura: Dia 25 às {8 + (user.ranking - 1)}:00h</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button onClick={handlePreviousMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 hide-print">←</button>
              <h2 className="text-2xl font-black capitalize text-gray-800">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <button onClick={handleNextMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 hide-print">→</button>
            </div>
            <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center space-x-2 shadow-md hide-print">
              <span>Gerar Relatório (PDF)</span>
            </button>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              .hide-print, nav, aside, .sidebar, button, .modal, .no-print { display: none !important; }
              body { background: white !important; margin: 0 !important; padding: 0 !important; }
              .bg-white { box-shadow: none !important; border: 1px solid #eee !important; }
              .lg\\:col-span-3 { width: 100% !important; grid-column: span 4 / span 4 !important; }
              .lg\\:grid-cols-4 { display: block !important; }
              .rounded-2xl { border-radius: 0 !important; }
              .grid-cols-7 { border: 1px solid #eee !important; }
            }
          `}} />

          <div className="hidden md:flex items-center space-x-4 text-xs font-bold text-gray-500 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></span>
              <span>Manhã (08h-13h)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
              <span>Tarde (13h-19h)</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden mt-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div key={dia} className="bg-gray-50 text-center font-bold text-gray-400 py-3 text-xs uppercase tracking-widest">{dia}</div>
            ))}

            {monthDays.map(day => {
              const plantoesDay = getPlantoesDodia(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isSunday = day.getDay() === 0;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => !isSunday && setSelectedDate(day)}
                  className={`bg-white min-h-[140px] transition-all flex flex-col items-start relative border-r border-b border-gray-100 cursor-pointer ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/80'} ${isSunday ? 'bg-gray-50/50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-full flex justify-between p-2">
                    <div className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-500'} ${isSunday ? 'text-gray-300' : ''}`}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {isSunday ? (
                    <div className="mt-auto w-full text-[9px] text-gray-400 font-bold uppercase text-center pb-3 uppercase">Sem Plantão</div>
                  ) : (
                    <div className="w-full px-1.5 pb-2 space-y-1">
                      {plantoesDay.map(p => (
                        <div key={p.id} className="w-full space-y-0.5">
                          {p.alocacoes?.map((aloc, idx) => (
                            <div key={idx} className={`group flex items-center justify-between text-[10px] font-bold px-1.5 py-1 rounded shadow-sm border ${p.turno === 'manha' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                              <span className="truncate">{aloc.plantonista_nome.split(' ')[0]}</span>
                              {isGestor && (
                                <button onClick={(e) => { e.stopPropagation(); removerPlantonista(p.id, aloc.plantonista_id); }} className="hidden group-hover:flex items-center justify-center h-3.5 w-3.5 rounded-full bg-white text-red-500 hover:bg-red-50 shadow-sm">&times;</button>
                              )}
                            </div>
                          ))}
                          {p.vagas_disponiveis > 0 && (
                            <div className="text-[9px] text-gray-400 border border-dashed border-gray-200 px-1.5 py-0.5 rounded flex items-center justify-between">
                              <span className="italic font-medium uppercase tracking-tighter">{p.turno === 'manha' ? 'MANHÃ' : 'TARDE'} (+{p.vagas_disponiveis})</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sidebar h-fit">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            <span>Detalhes do Dia</span>
          </h3>
          <p className="text-sm font-medium text-gray-500 mb-4">{selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Selecione um dia'}</p>

          <div className="space-y-4">
            {selectedDayPlantoes.length > 0 ? (
              selectedDayPlantoes.map(plantao => (
                <div key={plantao.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FiClock className="text-blue-500" />
                      <span className="font-bold capitalize text-gray-700">{plantao.turno}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                      <FiUsers size={12} />
                      <span>{plantao.alocacoes_count}/{plantao.max_plantonistas}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plantao.alocacoes?.map((aloc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{aloc.plantonista_nome}</span>
                        {isGestor && (
                          <button onClick={() => removerPlantonista(plantao.id, aloc.plantonista_id)} className="text-red-400 hover:text-red-600 transition-colors">&times;</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    {isGestor && plantao.vagas_disponiveis > 0 ? (
                      <button onClick={() => { setAssignmentData({ ...assignmentData, plantaoId: plantao.id }); setShowAssignModal(true); }} className="w-full bg-green-500 text-white py-2.5 rounded-xl font-bold hover:bg-green-600 flex items-center justify-center space-x-2 transition-all">
                        <FiUserPlus />
                        <span>Atribuir Corretor</span>
                      </button>
                    ) : !isGestor && plantao.vagas_disponiveis > 0 && (
                      <button onClick={() => escolherPlantao(plantao.id)} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all">Escolher Plantão</button>
                    )}
                    {plantao.vagas_disponiveis === 0 && (
                      <div className="w-full bg-gray-200 text-gray-500 py-2.5 rounded-xl text-center font-bold text-sm">Turno Completo</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm italic">Nenhum plantão neste dia</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Atribuir Corretor</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Selecione o Plantonista</label>
                <select
                  className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-4 border bg-gray-50 font-medium"
                  value={assignmentData.plantonistaId}
                  onChange={(e) => setAssignmentData({ ...assignmentData, plantonistaId: e.target.value })}
                >
                  <option value="">Selecione um corretor...</option>
                  {plantonistas.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-4 border border-gray-100 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all">Cancelar</button>
              <button onClick={atribuirManual} className="flex-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Atribuir Agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
