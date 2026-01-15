import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { videoRecorderService } from '../services/videoRecorderService';

const VideoRecorderDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const [recorder, setRecorder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecorder();
  }, [id]);

  const loadRecorder = async () => {
    setLoading(true);
    try {
      const data = await videoRecorderService.getById(id);
      setRecorder(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные видеорегистратора');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Удаление', 'Вы уверены, что хотите удалить видеорегистратор?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await videoRecorderService.delete(id);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось удалить видеорегистратор');
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

  if (!recorder) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Номер (number)</Text>
          <Text style={styles.value}>{recorder.number || '-'}</Text>

          <Text style={styles.label}>Статус</Text>
          <View
            style={[
              styles.statusBadge,
              recorder.status === 'available' ? styles.statusAvailable : styles.statusIssued,
            ]}
          >
            <Text style={styles.statusText}>
              {recorder.status === 'available' ? 'Свободен' : 'Выдан'}
            </Text>
          </View>

          <Text style={styles.label}>Дата добавления</Text>
          <Text style={styles.value}>
            {recorder.createdAt ? new Date(recorder.createdAt).toLocaleDateString('ru-RU') : '-'}
          </Text>
        </View>

        {isAdmin() && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => navigation.navigate('VideoRecorderForm', { id: recorder.id })}
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 5,
  },
  statusAvailable: {
    backgroundColor: '#34C759',
  },
  statusIssued: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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

export default VideoRecorderDetailScreen;

