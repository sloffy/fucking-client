import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Vibration,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { videoRecorderService } from '../services/videoRecorderService';
import { issueService } from '../services/issueService';

const IssuesScreen = () => {
  const { isAdmin, isOperator } = useAuth();
  const [activeTab, setActiveTab] = useState('issue'); // 'issue' or 'return'
  const [employees, setEmployees] = useState([]);
  const [recorders, setRecorders] = useState([]);
  const [activeIssues, setActiveIssues] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRecorder, setSelectedRecorder] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // При смене вкладки сбрасываем выбранные значения
    setSelectedEmployee('');
    setSelectedRecorder('');
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setInitialLoading(true);
    try {
      const [employeesData, recordersData, activeIssuesData] = await Promise.all([
        employeeService.getAll(),
        videoRecorderService.getAll(),
        issueService.getActive(),
      ]);

      setEmployees(employeesData);
      setActiveIssues(activeIssuesData);

      if (activeTab === 'issue') {
        // Для выдачи показываем только свободные видеорегистраторы
        setRecorders(recordersData.filter((r) => r.status === 'available'));
      } else {
        // Для возврата видеорегистраторы берем из активных выдач
        const issuedIds = new Set(activeIssuesData.map((i) => i.videoRecorderId));
        setRecorders(recordersData.filter((r) => issuedIds.has(r.id)));
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedRecorder) {
      Alert.alert('Ошибка', 'Выберите сотрудника и видеорегистратор');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'issue') {
        // Проверка: сотрудник уже имеет активный видеорегистратор?
        const hasActive = activeIssues.some(
          (i) => i.employeeId.toString() === selectedEmployee
        );
        if (hasActive) {
          setLoading(false);
          Alert.alert('Ошибка', 'Сотруднику уже выдан видеорегистратор');
          return;
        }

        await issueService.issue(selectedEmployee, selectedRecorder);
        Alert.alert('Успех', 'Видеорегистратор успешно выдан');
      } else {
        await issueService.return(selectedEmployee, selectedRecorder);
        Alert.alert('Успех', 'Видеорегистратор успешно возвращен');
      }
      Vibration.vibrate(100);
      setSelectedEmployee('');
      setSelectedRecorder('');
      loadData();
    } catch (error) {
      Alert.alert(
        'Ошибка',
        error.response?.data?.message || 'Не удалось выполнить операцию'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderReturnItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.returnHeader}>
        <Text style={styles.returnTitle}>
          {item.videoRecorderNumber || `#${item.videoRecorderId}`}
        </Text>
        <Text style={styles.returnSubtitle}>{item.employeeName}</Text>
      </View>
      <Text style={styles.returnDate}>
        Выдан: {item.issueDate ? new Date(item.issueDate).toLocaleString('ru-RU') : '-'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={async () => {
          try {
            setLoading(true);
            await issueService.return(item.employeeId, item.videoRecorderId);
            Vibration.vibrate(100);
            // Обновляем данные после возврата - это удалит элемент из списка
            await loadData();
            Alert.alert('Успех', 'Видеорегистратор успешно возвращен');
          } catch (error) {
            Alert.alert(
              'Ошибка',
              error.response?.data?.message || error.response?.data?.detail || 'Не удалось выполнить операцию'
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        <Text style={styles.buttonText}>Принять</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'issue' && styles.tabActive]}
          onPress={() => setActiveTab('issue')}
        >
          <Text
            style={[styles.tabText, activeTab === 'issue' && styles.tabTextActive]}
          >
            Выдать
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'return' && styles.tabActive]}
          onPress={() => setActiveTab('return')}
        >
          <Text
            style={[styles.tabText, activeTab === 'return' && styles.tabTextActive]}
          >
            Принять
          </Text>
        </TouchableOpacity>
      </View>

      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : activeTab === 'issue' ? (
        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Выберите сотрудника</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEmployee}
                onValueChange={setSelectedEmployee}
                style={styles.picker}
              >
                <Picker.Item label="Выберите сотрудника" value="" />
                {employees
                  .filter(
                    (e) =>
                      !activeIssues.some(
                        (i) => i.employeeId && i.employeeId.toString() === e.id.toString()
                      )
                  )
                  .map((employee) => (
                    <Picker.Item
                      key={employee.id}
                      label={employee.fullName}
                      value={employee.id.toString()}
                    />
                  ))}
              </Picker>
            </View>

            <Text style={styles.label}>Выберите видеорегистратор (свободный)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedRecorder}
                onValueChange={setSelectedRecorder}
                style={styles.picker}
              >
                <Picker.Item label="Выберите видеорегистратор" value="" />
                {recorders.map((recorder) => (
                  <Picker.Item
                    key={recorder.id}
                    label={`${recorder.number || `#${recorder.id}`}`}
                    value={recorder.id.toString()}
                  />
                ))}
              </Picker>
            </View>

            {recorders.length === 0 && (
              <Text style={styles.emptyText}>Нет свободных видеорегистраторов</Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || recorders.length === 0 || !selectedEmployee || !selectedRecorder}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Обработка...' : 'Выдать видеорегистратор'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={activeIssues}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Нет активных выдач</Text>
            </View>
          }
          renderItem={renderReturnItem}
        />
      )}
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
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 18,
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
  content: {
    flex: 1,
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 15,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 15,
  },
  returnHeader: {
    marginBottom: 8,
  },
  returnTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  returnSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  returnDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
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

export default IssuesScreen;

