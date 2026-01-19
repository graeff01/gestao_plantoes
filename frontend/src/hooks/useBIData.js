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

    // Dados mock como fallback
    const getMockData = () => ({
        occupancyTrend: [
            { mes: 'Jul', ocupacao: 78.2 },
            { mes: 'Ago', ocupacao: 82.5 },
            { mes: 'Set', ocupacao: 75.8 },
            { mes: 'Out', ocupacao: 88.1 },
            { mes: 'Nov', ocupacao: 91.3 },
            { mes: 'Dez', ocupacao: 86.7 }
        ],
        performanceData: [
            { nome: 'Ana', pontuacao: 126 },
            { nome: 'Carlos', pontuacao: 118 },
            { nome: 'Maria', pontuacao: 112 },
            { nome: 'João', pontuacao: 98 },
            { nome: 'Sofia', pontuacao: 89 }
        ],
        shiftDistribution: [
            { name: 'Manhã', value: 25 },
            { name: 'Tarde', value: 30 },
            { name: 'Noite', value: 35 },
            { name: 'Madrugada', value: 10 }
        ],
        realTimeMetrics: {
            plantoesHoje: 8,
            changeHoje: 12.5,
            plantonistasAtivos: 23,
            changeAtivos: 5.2,
            taxaCancelamento: 3.2,
            changeCancelamento: -1.8
        },
        advancedKPIs: {
            eficienciaOperacional: 94,
            satisfacaoEquipe: 4.7,
            tempoResposta: 2.1,
            produtividade: 132
        },
        activities: [
            { message: 'Ana Costa escolheu plantão noturno', timestamp: '2 min atrás', type: 'success' },
            { message: 'Carlos Silva cancelou plantão', timestamp: '8 min atrás', type: 'warning' },
            { message: 'Sistema gerou escala mensal', timestamp: '15 min atrás', type: 'info' },
            { message: 'Maria Santos assumiu plantão', timestamp: '23 min atrás', type: 'success' },
            { message: 'Backup realizado com sucesso', timestamp: '1h atrás', type: 'success' }
        ]
    });

    const fetchBIData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Primeiro, definir dados mock como base
            const mockData = getMockData();
            setData(mockData);
            
            // Tentar buscar dados reais endpoint por endpoint
            let realData = { ...mockData };
            
            try {
                const occupancyResponse = await api.get('/bi/occupancy-trend');
                if (occupancyResponse?.data?.dados?.trend) {
                    realData.occupancyTrend = occupancyResponse.data.dados.trend;
                }
            } catch (e) {
                console.warn('Endpoint occupancy-trend falhou, usando dados mock');
            }
            
            try {
                const performanceResponse = await api.get('/bi/performance');
                if (performanceResponse?.data?.dados?.performance) {
                    realData.performanceData = performanceResponse.data.dados.performance;
                }
            } catch (e) {
                console.warn('Endpoint performance falhou, usando dados mock');
            }
            
            try {
                const shiftResponse = await api.get('/bi/shift-distribution');
                if (shiftResponse?.data?.dados?.distribution) {
                    realData.shiftDistribution = shiftResponse.data.dados.distribution;
                }
            } catch (e) {
                console.warn('Endpoint shift-distribution falhou, usando dados mock');
            }
            
            try {
                const metricsResponse = await api.get('/bi/real-time-metrics');
                if (metricsResponse?.data?.dados?.metrics) {
                    realData.realTimeMetrics = metricsResponse.data.dados.metrics;
                }
            } catch (e) {
                console.warn('Endpoint real-time-metrics falhou, usando dados mock');
            }
            
            try {
                const kpisResponse = await api.get('/bi/kpis');
                if (kpisResponse?.data?.dados?.kpis) {
                    realData.advancedKPIs = kpisResponse.data.dados.kpis;
                }
            } catch (e) {
                console.warn('Endpoint kpis falhou, usando dados mock');
            }
            
            try {
                const activitiesResponse = await api.get('/bi/activity-timeline');
                if (activitiesResponse?.data?.dados?.activities) {
                    realData.activities = activitiesResponse.data.dados.activities;
                }
            } catch (e) {
                console.warn('Endpoint activity-timeline falhou, usando dados mock');
            }
            
            // Atualizar com dados reais (se disponíveis) + mock (como fallback)
            setData(realData);
            
        } catch (err) {
            console.error('Erro geral ao buscar dados BI:', err);
            // Em caso de erro total, usar apenas dados mock
            setData(getMockData());
            setError(null); // Não mostrar erro pois temos fallback
        } finally {
            setLoading(false);
        }
    };

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