import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BreakdownFormScreen from './src/screens/BreakdownFormScreen';
import BreakdownDetailScreen from './src/screens/BreakdownDetailScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import AdminApprovalScreen from './src/screens/AdminApprovalScreen';
import PreventiveMaintenanceScreen from './src/screens/PreventiveMaintenanceScreen';
import MachineMasterScreen from './src/screens/MachineMasterScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import { COLORS } from './src/components/Theme';

const Stack = createNativeStackNavigator();

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
          headerStyle: {
            backgroundColor: COLORS.card,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
        ) : (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'CMMS Dashboard' }} 
            />
            <Stack.Screen 
              name="BreakdownForm" 
              component={BreakdownFormScreen} 
              options={{ title: 'Report Breakdown' }} 
            />
            <Stack.Screen 
              name="BreakdownDetails" 
              component={BreakdownDetailScreen} 
              options={{ title: 'Breakdown Log' }} 
            />
            <Stack.Screen 
              name="QRScanner" 
              component={QRScannerScreen} 
              options={{ title: 'Scan Code' }} 
            />
            <Stack.Screen 
              name="AdminApproval" 
              component={AdminApprovalScreen} 
              options={{ title: 'Admin Review Queue' }} 
            />
            <Stack.Screen 
              name="PreventiveMaintenance" 
              component={PreventiveMaintenanceScreen} 
              options={{ title: 'Preventive Maintenance' }} 
            />
            <Stack.Screen 
              name="MachineMaster" 
              component={MachineMasterScreen} 
              options={{ title: 'Machine Master' }} 
            />
            <Stack.Screen 
              name="Reports" 
              component={ReportsScreen} 
              options={{ title: 'Analytics & Reports' }} 
            />
            <Stack.Screen 
              name="UserManagement" 
              component={UserManagementScreen} 
              options={{ title: 'User Management' }} 
            />
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
