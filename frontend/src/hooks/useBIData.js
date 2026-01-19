import { useState, useEffect } from 'react';
import api from '../services/api';

const useBIData = () => {
    const [data, setData] = useState({
        occupancyTrend: [],
        performanceData: [],
        shiftDistribution: [],
        realTimeMetrics: {},
        advancedKPIs: {},
        activities: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBIData = async () => {
        try {
            setLoading(true);
            
            // Buscar todos os dados BI em paralelo
            const [
                occupancyResponse,
                performanceResponse, 
                shiftResponse,
                metricsResponse,
                kpisResponse,
                activitiesResponse
            ] = await Promise.all([
                api.get('/bi/occupancy-trend'),
                api.get('/bi/performance'),
                api.get('/bi/shift-distribution'),
                api.get('/bi/real-time-metrics'),
                api.get('/bi/kpis'),
                api.get('/bi/activity-timeline')
            ]);

            setData({
                occupancyTrend: occupancyResponse.data.dados.trend,
                performanceData: performanceResponse.data.dados.performance,
                shiftDistribution: shiftResponse.data.dados.distribution,
                realTimeMetrics: metricsResponse.data.dados.metrics,
                advancedKPIs: kpisResponse.data.dados.kpis,
                activities: activitiesResponse.data.dados.activities
            });
            
            setError(null);
        } catch (err) {
            console.error('Erro ao buscar dados BI:', err);
            setError('Erro ao carregar dados de Business Intelligence');
            
            // Fallback para dados mock em caso de erro
            setData({
                occupancyTrend: generateMockOccupancyData(),
                performanceData: generateMockPerformanceData(),
                shiftDistribution: generateMockShiftData(),
                realTimeMetrics: generateMockMetrics(),
                advancedKPIs: generateMockKPIs(),
                activities: generateMockActivities()
            });
        } finally {
            setLoading(false);
        }
    };

    // Funções de fallback com dados mock
    const generateMockOccupancyData = () => [
        { mes: 'Jul', ocupacao: 78.2 },
        { mes: 'Ago', ocupacao: 82.5 },
        { mes: 'Set', ocupacao: 75.8 },
        { mes: 'Out', ocupacao: 88.1 },
        { mes: 'Nov', ocupacao: 91.3 },
        { mes: 'Dez', ocupacao: 86.7 }
    ];

    const generateMockPerformanceData = () => [
        { nome: 'Ana', pontuacao: 126 },
        { nome: 'Carlos', pontuacao: 118 },
        { nome: 'Maria', pontuacao: 112 },
        { nome: 'João', pontuacao: 98 },
        { nome: 'Sofia', pontuacao: 89 }
    ];

    const generateMockShiftData = () => [
        { name: 'Manhã', value: 25 },
        { name: 'Tarde', value: 30 },
        { name: 'Noite', value: 35 },
        { name: 'Madrugada', value: 10 }
    ];

    const generateMockMetrics = () => ({
        plantoesHoje: 8,
        changeHoje: 12.5,
        plantonistasAtivos: 23,
        changeAtivos: 5.2,
        taxaCancelamento: 3.2,
        changeCancelamento: -1.8
    });

    const generateMockKPIs = () => ({
        eficienciaOperacional: 94,
        satisfacaoEquipe: 4.7,
        tempoResposta: 2.1,
        produtividade: 132
    });

    const generateMockActivities = () => [
        { message: 'Ana Costa escolheu plantão noturno', timestamp: '2 min atrás', type: 'success' },
        { message: 'Carlos Silva cancelou plantão', timestamp: '8 min atrás', type: 'warning' },
        { message: 'Sistema gerou escala mensal', timestamp: '15 min atrás', type: 'info' },
        { message: 'Maria Santos assumiu plantão', timestamp: '23 min atrás', type: 'success' },
        { message: 'Erro na sincronização do calendário', timestamp: '1h atrás', type: 'error' }
    ];

    useEffect(() => {
        fetchBIData();
        
        // Atualizar dados a cada 5 minutos
        const interval = setInterval(fetchBIData, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchBIData
    };
};

export default useBIData;
export { useBIData };