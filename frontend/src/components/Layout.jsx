import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiHome, FiCalendar, FiList, FiAward, FiBarChart2, FiLogOut, FiMenu, FiX, FiUsers, FiActivity } from 'react-icons/fi';
import { useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome, roles: ['admin', 'gestor', 'plantonista'] },
    { name: 'Plantões Disponíveis', href: '/plantoes', icon: FiCalendar, roles: ['admin', 'gestor', 'plantonista'] },
    { name: 'Meus Plantões', href: '/meus-plantoes', icon: FiList, roles: ['plantonista'] },
    { name: 'Usuários', href: '/usuarios', icon: FiUsers, roles: ['admin', 'gestor'] },
    { name: 'Pontuação', href: '/pontuacao', icon: FiBarChart2, roles: ['admin', 'gestor'] },
    { name: 'Histórico', href: '/historico', icon: FiActivity, roles: ['admin', 'gestor'] },
    { name: 'Ranking', href: '/ranking', icon: FiAward, roles: ['admin', 'gestor', 'plantonista'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.tipo));

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-20 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Sistema de Plantões</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Plantões</h1>
            <p className="text-sm text-gray-600">Veloce Imobiliária</p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{user?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.tipo}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <FiLogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 flex flex-col h-screen overflow-hidden">
        <main className="p-6 flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
