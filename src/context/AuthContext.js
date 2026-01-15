import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await authService.getStoredToken();
      if (!token) return;

      // Проверяем валидность токена, получая текущего пользователя
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      // Если нет error.response — это сеть/SSL/DNS ошибка, не удаляем токен
      if (!error.response) {
        console.log('Ошибка сети при проверке аутентификации:', error.message);
      } else {
        // Токен невалиден или истек
        await authService.logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const { user: loggedInUser } = await authService.login(username, password);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      // Если нет error.response — это обычно проблема сети/SSL/DNS, а не "неверный логин"
      if (!error.response) {
        return {
          success: false,
          error: `Ошибка сети: ${error.message || 'не удалось подключиться к серверу'}`,
        };
      }
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          'Неверный логин или пароль',
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role_name === 'admin';
  };

  const isOperator = () => {
    return user?.role === 'operator' || user?.role_name === 'operator';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        isAdmin,
        isOperator,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

