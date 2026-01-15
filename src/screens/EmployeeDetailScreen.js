import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';

const EmployeeDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getById(id);
      // Убеждаемся, что фото URL правильный
      if (data && !data.photo) {
        data.photo = employeeService.getPhotoUrl(id);
      }
      setEmployee(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные сотрудника');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к фотографиям');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri) => {
    setUploading(true);
    try {
      await employeeService.uploadPhoto(id, uri);
      loadEmployee();
      Alert.alert('Успех', 'Фото успешно загружено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Удаление', 'Вы уверены, что хотите удалить сотрудника?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await employeeService.delete(id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось удалить сотрудника');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.photoContainer}>
          {employee.photo ? (
            <Image
              source={{ uri: employee.photo || employeeService.getPhotoUrl(id) }}
              style={styles.photo}
              onError={() => setEmployee({ ...employee, photo: null })}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={60} color="#999" />
            </View>
          )}
          {isAdmin() && (
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.photoButtonText}>
                {uploading ? 'Загрузка...' : 'Изменить фото'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>ФИО</Text>
          <Text style={styles.value}>{employee.fullName || '-'}</Text>

          <Text style={styles.label}>Должность</Text>
          <Text style={styles.value}>{employee.position || '-'}</Text>

          <Text style={styles.label}>Табельный номер</Text>
          <Text style={styles.value}>{employee.employeeNumber || '-'}</Text>

          <Text style={styles.label}>Дата добавления</Text>
          <Text style={styles.value}>
            {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('ru-RU') : '-'}
          </Text>
        </View>

        {isAdmin() && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => navigation.navigate('EmployeeForm', { id: employee.id })}
            >
              <Ionicons name="pencil" size={20} color="#fff" />
              <Text style={styles.buttonText}>Редактировать</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.buttonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  actions: {
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmployeeDetailScreen;

