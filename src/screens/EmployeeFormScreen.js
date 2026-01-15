import React, { useState, useEffect, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { employeeService } from '../services/employeeService';

const EmployeeFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    employeeNumber: '',
  });
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    setInitialLoading(true);
    try {
      const data = await employeeService.getById(id);
      setFormData({
        fullName: data.fullName || '',
        position: data.position || '',
        employeeNumber: data.employeeNumber || '',
      });
      if (data.photo) {
        setPhotoUri(data.photo);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные сотрудника');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/new-notification-3-398649.mp3')
      );
      await sound.playAsync();
      // Освобождаем звук после воспроизведения
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Ошибка воспроизведения звука:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim() || !formData.employeeNumber.trim()) {
      Alert.alert('Ошибка', 'Заполните обязательные поля (ФИО и табельный номер)');
      return;
    }

    setLoading(true);
    try {
      let employee;
      if (isEdit) {
        employee = await employeeService.update(id, formData);
      } else {
        employee = await employeeService.create(formData);
        // Воспроизвести звук уведомления при добавлении
        await playNotificationSound();
      }

      const employeeId = id || employee?.id;

      // Если выбрано новое фото — загружаем
      if (photoUri && employeeId) {
        try {
          await employeeService.uploadPhoto(employeeId, photoUri);
        } catch (uploadError) {
          // Не роняем сохранение сотрудника из-за ошибки фото
          console.warn('Не удалось загрузить фото сотрудника', uploadError);
        }
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message ||
          error.response?.data?.detail ||
          'Не удалось сохранить сотрудника'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>ФИО *</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Введите ФИО"
          />

          <Text style={styles.label}>Должность</Text>
          <TextInput
            style={styles.input}
            value={formData.position}
            onChangeText={(text) => setFormData({ ...formData, position: text })}
            placeholder="Введите должность"
          />

          <Text style={styles.label}>Табельный номер (до 6 символов) *</Text>
          <TextInput
            style={styles.input}
            value={formData.employeeNumber}
            onChangeText={(text) => setFormData({ ...formData, employeeNumber: text })}
            placeholder="Например: 123456"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Фото сотрудника (необязательно)</Text>
          <View style={styles.photoRow}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>Нет фото</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.photoButton}
              onPress={async () => {
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
                  setPhotoUri(result.assets[0].uri);
                }
              }}
            >
              <Text style={styles.photoButtonText}>
                {photoUri ? 'Изменить фото' : 'Выбрать фото'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Добавить'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleContainer: {
    flexDirection: 'row',
    marginTop: 10,
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  photoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmployeeFormScreen;

