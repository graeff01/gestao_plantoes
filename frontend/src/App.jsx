import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlantoesPage from './pages/PlantoesPage';
import PontuacaoPage from './pages/PontuacaoPage';
import MeusPlantoesPage from './pages/MeusPlantoesPage';
import RankingPage from './pages/RankingPage';
import UsuariosPage from './pages/UsuariosPage';
import LogsPage from './pages/LogsPage';

// Store
import { useAuthStore } from './store/authStore';

// Layout
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="plantoes" element={<PlantoesPage />} />
          <Route path="meus-plantoes" element={<MeusPlantoesPage />} />
          <Route path="pontuacao" element={<PontuacaoPage />} />
          <Route path="ranking" element={<RankingPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="historico" element={<LogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
