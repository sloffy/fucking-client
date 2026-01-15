import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

function normalizeUser(me) {
  if (!me) return null;
  const first = me.first_name ?? me.firstName ?? '';
  const last = me.last_name ?? me.lastName ?? '';
  const middle = me.middle_name ?? me.middleName ?? '';
  const fullNameFromParts = [last, first, middle].filter(Boolean).join(' ').trim();

  return {
    id: me.id,
    username: me.username ?? me.login,
    fullName: me.fullName ?? fullNameFromParts,
    role: me.role_name ?? me.role,
    roleId: me.role_id ?? me.roleId,
    createdAt: me.createdAt ?? me.created_at,
  };
}

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { access_token } = response.data;
    // Сохраняем токен
    await AsyncStorage.setItem('authToken', access_token);
    // Получаем информацию о пользователе
    const meResponse = await api.get('/auth/me');
    const user = normalizeUser(meResponse.data);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return { token: access_token, user };
  },

  register: async (userData) => {
    // API ожидает snake_case + role_id
    const payload = {
      username: userData.username,
      password: userData.password,
      last_name: userData.last_name ?? userData.lastName ?? userData.lastNameInput,
      first_name: userData.first_name ?? userData.firstName ?? userData.firstNameInput,
      middle_name: userData.middle_name ?? userData.middleName ?? userData.middleNameInput ?? '',
      role_id: userData.role_id ?? userData.roleId,
    };
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return normalizeUser(response.data);
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  getStoredToken: async () => {
    return await AsyncStorage.getItem('authToken');
  },

  getStoredUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

