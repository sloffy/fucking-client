import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import { videoRecorderService } from '../services/videoRecorderService';

const VideoRecorderFormScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    number: '',
    status: 'available',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      loadRecorder();
    }
  }, [id]);

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
    if (!formData.number.trim()) {
      Alert.alert('Ошибка', 'Заполните обязательное поле (номер видеорегистратора)');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await videoRecorderService.update(id, formData);
      } else {
        // При создании статус всегда "available", без выбора пользователем
        await videoRecorderService.create({ number: formData.number, status: 'available' });
        // Воспроизвести звук уведомления при добавлении
        await playNotificationSound();
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message ||
          error.response?.data?.detail ||
          'Не удалось сохранить видеорегистратор'
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
          <Text style={styles.label}>Номер (number) *</Text>
          <TextInput
            style={styles.input}
            value={formData.number}
            onChangeText={(text) => setFormData({ ...formData, number: text })}
            placeholder="Например: VR-001"
          />

          {isEdit && (
            <>
              <Text style={styles.label}>Статус</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Свободен (available)" value="available" />
                  <Picker.Item label="Выдан (issued)" value="issued" />
                </Picker>
              </View>
            </>
          )}
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
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
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

export default VideoRecorderFormScreen;

