import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, senha) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/login', { email, senha });
          const { access_token, usuario } = response.data.dados;

          set({
            user: usuario,
            token: access_token,
            isAuthenticated: true,
            loading: false
          });

          // Configurar token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

          return { success: true };
        } catch (error) {
          set({ loading: false });
          return {
            success: false,
            error: error.response?.data?.mensagem || 'Erro ao fazer login'
          };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      // Inicializar token ao carregar do localStorage
      initializeAuth: () => {
        const token = get().token;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Inicializar auth ao carregar
useAuthStore.getState().initializeAuth();
