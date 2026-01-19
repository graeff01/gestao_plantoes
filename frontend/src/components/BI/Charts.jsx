import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiUsers, FiCalendar, FiActivity } from 'react-icons/fi';

const COLORS = {
  primary: '#2563eb',
  secondary: '#10b981', 
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6'
};

// Componente para gráfico de tendência de ocupação
export const OccupancyTrendChart = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Tendência de Ocupação</h3>
        <FiTrendingUp className="text-blue-500" size={20} />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, 'Ocupação']} />
            <Area 
              type="monotone" 
              dataKey="ocupacao" 
              stroke={COLORS.primary} 
              fillOpacity={1} 
              fill="url(#colorOccupancy)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente para gráfico de performance dos plantonistas
export const PerformanceChart = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Performance Top 10</h3>
        <FiActivity className="text-purple-500" size={20} />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="nome" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip formatter={(value) => [value, 'Pontos']} />
            <Bar dataKey="pontuacao" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente para distribuição de plantões por turno
export const ShiftDistributionChart = ({ data }) => {
  const SHIFT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Distribuição por Turno</h3>
        <FiCalendar className="text-green-500" size={20} />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >              {data && data.length > 0 ? data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SHIFT_COLORS[index % SHIFT_COLORS.length]} />
              )) : null}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente para métricas em tempo real
export const RealTimeMetrics = ({ metrics = {} }) => {
  const metricCards = [
    {
      title: 'Plantões Hoje',
      value: metrics?.plantoesHoje || 0,
      change: metrics?.changeHoje || 0,
      icon: FiCalendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Plantonistas Ativos',
      value: metrics?.plantonistasAtivos || 0,
      change: metrics?.changeAtivos || 0,
      icon: FiUsers,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Taxa Cancelamento',
      value: `${metrics?.taxaCancelamento || 0}%`,
      change: metrics?.changeCancelamento || 0,
      icon: FiActivity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {metricCards.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <div className="flex items-center mt-2">
                {metric.change >= 0 ? (
                  <FiTrendingUp className="text-green-500 mr-1" size={16} />
                ) : (
                  <FiTrendingDown className="text-red-500 mr-1" size={16} />
                )}
                <span className={`text-sm font-medium ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(metric.change)}% vs ontem
                </span>
              </div>
            </div>
            <div className={`${metric.bgColor} p-3 rounded-xl`}>
              <metric.icon className={metric.color} size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente para KPIs avançados
export const AdvancedKPIs = ({ kpis = {} }) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl p-6 text-white">
      <h3 className="text-xl font-bold mb-6 text-center">KPIs Executivos</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <p className="text-3xl font-black">{kpis?.eficienciaOperacional || '95'}%</p>
          <p className="text-blue-100 text-sm">Eficiência Operacional</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black">{kpis?.satisfacaoEquipe || '4.8'}</p>
          <p className="text-blue-100 text-sm">Satisfação da Equipe</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black">{kpis?.tempoResposta || '2.1'}h</p>
          <p className="text-blue-100 text-sm">Tempo Resp. Média</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black">{kpis?.produtividade || '125'}</p>
          <p className="text-blue-100 text-sm">Índice Produtividade</p>
        </div>
      </div>
    </div>
  );
};

// Componente para timeline de atividades
export const ActivityTimeline = ({ activities = [] }) => {
  const safeActivities = activities && Array.isArray(activities) ? activities : [];
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-50 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Atividades Recentes</h3>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {safeActivities.length > 0 ? safeActivities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              activity.type === 'success' ? 'bg-green-500' :
              activity.type === 'warning' ? 'bg-yellow-500' :
              activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.timestamp}</p>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma atividade recente</p>
          </div>
        )}
      </div>
    </div>
  );
};