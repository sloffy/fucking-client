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
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { issueService } from '../services/issueService';
import { employeeService } from '../services/employeeService';
import { videoRecorderService } from '../services/videoRecorderService';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [recorders, setRecorders] = useState([]);
  const [filters, setFilters] = useState({
    employeeId: '',
    videoRecorderId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadData = async () => {
    try {
      const [employeesData, recordersData] = await Promise.all([
        employeeService.getAll(),
        videoRecorderService.getAll(),
      ]);
      setEmployees(employeesData);
      setRecorders(recordersData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.employeeId) params.employee_id = filters.employeeId;
      if (filters.videoRecorderId) params.video_recorder_id = filters.videoRecorderId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const data = await issueService.getHistory(params);
      setHistory(data);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      employeeId: '',
      videoRecorderId: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      'Подтверждение',
      'Вы уверены, что хотите удалить всю историю? Это действие необратимо.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const ids = history.map(item => item.id);
              await issueService.deleteAll(ids);
              Alert.alert('Успех', 'Вся история удалена.');
              loadHistory(); // Обновить список
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить историю: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.employeeName || 'Неизвестный сотрудник'}</Text>
        <View
          style={[
            styles.statusBadge,
            !item.returnDate ? styles.statusIssue : styles.statusReturn,
          ]}
        >
          <Text style={styles.statusText}>{!item.returnDate ? 'Выдача' : 'Возврат'}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>
        Видеорегистратор: {item.videoRecorderNumber || `#${item.videoRecorderId}`}
      </Text>
      <Text style={styles.cardDate}>
        {item.issueDate
          ? new Date(item.issueDate).toLocaleString('ru-RU')
          : 'Дата выдачи неизвестна'}
      </Text>
      {item.returnDate && (
        <Text style={styles.cardDate}>
          Возврат: {new Date(item.returnDate).toLocaleString('ru-RU')}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="filter" size={20} color="#007AFF" />
        <Text style={styles.filterButtonText}>Фильтры</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>Удалить всю историю</Text>
      </TouchableOpacity>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadHistory}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              История пуста
            </Text>
          </View>
        }
      />

        <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Фильтры</Text>

            <Text style={styles.label}>Сотрудник</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.employeeId}
                onValueChange={(value) => setFilters({ ...filters, employeeId: value })}
                style={styles.picker}
              >
                <Picker.Item label="Все сотрудники" value="" />
                {employees.map((employee) => (
                  <Picker.Item
                    key={employee.id}
                    label={employee.fullName}
                    value={employee.id.toString()}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Видеорегистратор</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.videoRecorderId}
                onValueChange={(value) =>
                  setFilters({ ...filters, videoRecorderId: value })
                }
                style={styles.picker}
              >
                <Picker.Item label="Все видеорегистраторы" value="" />
                {recorders.map((recorder) => (
                  <Picker.Item
                    key={recorder.id}
                    label={recorder.name || recorder.serialNumber}
                    value={recorder.id.toString()}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Дата от</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={filters.dateFrom}
              onChangeText={(text) => setFilters({ ...filters, dateFrom: text })}
            />

            <Text style={styles.label}>Дата до</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={filters.dateTo}
              onChangeText={(text) => setFilters({ ...filters, dateTo: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={resetFilters}
              >
                <Text style={styles.modalButtonText}>Сбросить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Применить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    gap: 8,
  },
  filterButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
    backgroundColor: 'red',
    margin: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIssue: {
    backgroundColor: '#34C759',
  },
  statusReturn: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default HistoryScreen;


