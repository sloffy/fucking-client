import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const ProfileScreen = () => {
  const { user, logout, isAdmin } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    role_id: 2,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.username || !registerData.password || !registerData.last_name || !registerData.first_name) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    try {
      await authService.register(registerData);
      Alert.alert('Успех', 'Пользователь успешно зарегистрирован');
      setRegisterModalVisible(false);
      setRegisterData({
        username: '',
        password: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        role_id: 2,
      });
    } catch (error) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось зарегистрировать пользователя'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>ФИО</Text>
          <Text style={styles.value}>
            {currentUser?.fullName || user?.fullName || '-'}
          </Text>

          <Text style={styles.label}>Роль</Text>
          <Text style={styles.value}>
            {(currentUser?.role || user?.role) === 'admin' ? 'Администратор' : 'Оператор'}
          </Text>

          <Text style={styles.label}>Дата регистрации</Text>
          <Text style={styles.value}>
            {currentUser?.createdAt
              ? new Date(currentUser.createdAt).toLocaleDateString('ru-RU')
              : '-'}
          </Text>
        </View>

        {isAdmin() && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setRegisterModalVisible(true)}
          >
            <Text style={styles.buttonText}>Зарегистрировать пользователя</Text>
          </TouchableOpacity>
        )}

          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <Modal
        visible={registerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Регистрация пользователя</Text>

            <TextInput
              style={styles.input}
              placeholder="Логин"
              value={registerData.username}
              onChangeText={(text) => setRegisterData({ ...registerData, username: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Пароль"
              value={registerData.password}
              onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Фамилия"
              value={registerData.last_name}
              onChangeText={(text) => setRegisterData({ ...registerData, last_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Имя"
              value={registerData.first_name}
              onChangeText={(text) => setRegisterData({ ...registerData, first_name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Отчество (необязательно)"
              value={registerData.middle_name}
              onChangeText={(text) => setRegisterData({ ...registerData, middle_name: text })}
            />

            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  registerData.role_id === 1 && styles.roleButtonActive,
                ]}
                onPress={() => setRegisterData({ ...registerData, role_id: 1 })}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    registerData.role_id === 1 && styles.roleButtonTextActive,
                  ]}
                >
                  Администратор
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  registerData.role_id === 2 && styles.roleButtonActive,
                ]}
                onPress={() => setRegisterData({ ...registerData, role_id: 2 })}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    registerData.role_id === 2 && styles.roleButtonTextActive,
                  ]}
                >
                  Оператор
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRegisterModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRegister}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Зарегистрировать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#333',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default ProfileScreen;

