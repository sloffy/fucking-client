import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import VideoRecordersScreen from '../screens/VideoRecordersScreen';
import VideoRecorderDetailScreen from '../screens/VideoRecorderDetailScreen';
import VideoRecorderFormScreen from '../screens/VideoRecorderFormScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import EmployeeDetailScreen from '../screens/EmployeeDetailScreen';
import EmployeeFormScreen from '../screens/EmployeeFormScreen';
import IssuesScreen from '../screens/IssuesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const VideoRecordersStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="VideoRecordersList"
      component={VideoRecordersScreen}
      options={{ title: 'Видеорегистраторы' }}
    />
    <Stack.Screen
      name="VideoRecorderDetail"
      component={VideoRecorderDetailScreen}
      options={{ title: 'Детали видеорегистратора' }}
    />
    <Stack.Screen
      name="VideoRecorderForm"
      component={VideoRecorderFormScreen}
      options={{ title: 'Редактирование' }}
    />
  </Stack.Navigator>
);

const EmployeesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="EmployeesList"
      component={EmployeesScreen}
      options={{ title: 'Сотрудники' }}
    />
    <Stack.Screen
      name="EmployeeDetail"
      component={EmployeeDetailScreen}
      options={{ title: 'Детали сотрудника' }}
    />
    <Stack.Screen
      name="EmployeeForm"
      component={EmployeeFormScreen}
      options={{ title: 'Редактирование' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="Issues"
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'VideoRecorders') {
          iconName = focused ? 'videocam' : 'videocam-outline';
        } else if (route.name === 'Employees') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Issues') {
          iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
        } else if (route.name === 'History') {
          iconName = focused ? 'time' : 'time-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="Issues"
      component={IssuesScreen}
      options={{ title: 'Выдачи' }}
    />
    <Tab.Screen
      name="VideoRecorders"
      component={VideoRecordersStack}
      options={{ title: 'Видеорегистраторы' }}
    />
    <Tab.Screen
      name="Employees"
      component={EmployeesStack}
      options={{ title: 'Сотрудники' }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ title: 'История' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Профиль' }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Можно добавить экран загрузки
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;

