import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BreakdownFormScreen from './src/screens/BreakdownFormScreen';
import BreakdownDetailScreen from './src/screens/BreakdownDetailScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import AdminApprovalScreen from './src/screens/AdminApprovalScreen';
import PreventiveMaintenanceScreen from './src/screens/PreventiveMaintenanceScreen';
import PMCompletionScreen from './src/screens/PMCompletionScreen';
import MachineMasterScreen from './src/screens/MachineMasterScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import MenuScreen from './src/screens/MenuScreen';
import { COLORS } from './src/components/Theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900 glass
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'rgba(148, 163, 184, 0.6)',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Scan') iconName = focused ? 'qr-code' : 'qr-code-outline';
          else if (route.name === 'Menu') iconName = focused ? 'grid' : 'grid-outline';

          return <Ionicons name={iconName} size={focused ? 28 : 24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Scan" component={QRScannerScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}

function NavigationRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
            {/* Screens accessed from Menu or deep links */}
            <Stack.Screen name="BreakdownForm" component={BreakdownFormScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BreakdownDetails" component={BreakdownDetailScreen} options={{ title: 'Breakdown Log' }} />
            <Stack.Screen name="AdminApproval" component={AdminApprovalScreen} options={{ title: 'Admin Review' }} />
            <Stack.Screen name="PreventiveMaintenance" component={PreventiveMaintenanceScreen} options={{ title: 'Preventive Maintenance' }} />
            <Stack.Screen name="PMCompletion" component={PMCompletionScreen} options={{ title: 'Execute PM Task' }} />
            <Stack.Screen name="MachineMaster" component={MachineMasterScreen} options={{ title: 'Machine Master' }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Analytics & Reports' }} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'User Management' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationRouter />
      </NotificationProvider>
    </AuthProvider>
  );
}
