import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { videoRecorderService } from '../services/videoRecorderService';

const VideoRecordersScreen = () => {
  const navigation = useNavigation();
  const { isAdmin } = useAuth();
  const [recorders, setRecorders] = useState([]);
  const [filteredRecorders, setFilteredRecorders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecorders();
  }, []);

  useEffect(() => {
    filterRecorders();
  }, [searchQuery, recorders]);

  const loadRecorders = async () => {
    setLoading(true);
    try {
      const data = await videoRecorderService.getAll();
      setRecorders(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить видеорегистраторы');
    } finally {
      setLoading(false);
    }
  };

  const filterRecorders = () => {
    if (!searchQuery.trim()) {
      setFilteredRecorders(recorders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = recorders.filter(
      (recorder) =>
        recorder.number?.toLowerCase().includes(query)
    );
    setFilteredRecorders(filtered);
  };

  const handleDelete = (id) => {
    Alert.alert('Удаление', 'Вы уверены, что хотите удалить видеорегистратор?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await videoRecorderService.delete(id);
            loadRecorders();
          } catch (error) {
            const msg =
              error.response?.data?.message ||
              error.response?.data?.error ||
              error.message ||
              'Не удалось удалить видеорегистратор';
            Alert.alert('Ошибка', msg);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('VideoRecorderDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.number || `#${item.id}`}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'available' ? styles.statusAvailable : styles.statusIssued,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === 'available' ? 'Свободен' : 'Выдан'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardDate}>
        Добавлен: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ru-RU') : '-'}
      </Text>
      {isAdmin() && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VideoRecorderForm', { id: item.id })}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию, серийному номеру..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isAdmin() && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('VideoRecorderForm')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Добавить видеорегистратор</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredRecorders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRecorders} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет видеорегистраторов</Text>
          </View>
        }
      />
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  cardDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default VideoRecordersScreen;
