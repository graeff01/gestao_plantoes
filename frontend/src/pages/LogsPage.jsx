import { useEffect, useState } from 'react';
import api from '../services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiActivity, FiSearch, FiFilter } from 'react-icons/fi';

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ acao: '', tabela: '' });
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                acao: filters.acao,
                tabela: filters.tabela
            };
            const response = await api.get('/logs', { params });
            setLogs(response.data.dados.logs);
            setPagination(prev => ({
                ...prev,
                total: response.data.dados.total,
                pages: response.data.dados.pages
            }));
        } catch (error) {
            console.error('Erro ao buscar logs', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (acao) => {
        if (acao.includes('remover')) return 'text-red-600 bg-red-50';
        if (acao.includes('atribuir')) return 'text-green-600 bg-green-50';
        if (acao.includes('criar')) return 'text-blue-600 bg-blue-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Histórico do Sistema</h1>
                    <p className="text-gray-600">Auditagem detalhada de todas as ações administrativas</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-2">
                    <FiActivity className="text-blue-500 w-5 h-5" />
                    <span className="text-sm font-bold text-gray-700">{pagination.total} Registros</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ação (ex: remover)"
                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.acao}
                            onChange={(e) => setFilters({ ...filters, acao: e.target.value })}
                        />
                    </div>
                    <select
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={filters.tabela}
                        onChange={(e) => setFilters({ ...filters, tabela: e.target.value })}
                    >
                        <option value="">Todas as Tabelas</option>
                        <option value="alocacoes">Alocações</option>
                        <option value="usuarios">Usuários</option>
                        <option value="plantoes">Plantões</option>
                        <option value="pontuacao">Pontuação</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Tabela</th>
                                <th className="px-6 py-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        Carregando histórico...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {format(parseISO(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(parseISO(log.created_at), "HH:mm:ss")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getActionColor(log.acao)}`}>
                                                {log.acao.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {log.tabela}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 italic max-w-xs truncate">
                                            {log.detalhes ? JSON.stringify(log.detalhes) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center space-x-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPagination({ ...pagination, page: p })}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${pagination.page === p
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
