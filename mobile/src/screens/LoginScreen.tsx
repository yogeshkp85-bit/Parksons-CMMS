import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

export default function LoginScreen() {
  const { login, serverIp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ipAddress, setIpAddress] = useState(serverIp || '10.0.2.2');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in all credentials.');
      return;
    }
    
    setLoading(false);
    try {
      setLoading(true);
      await login(email.trim(), password, ipAddress.trim());
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message || 'Check your credentials or backend server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>PARKSONS</Text>
          <Text style={styles.subTitle}>CMMS Mobile Portal</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="enter your email"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>SIGN IN</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server IP Configuration accordion */}
        <TouchableOpacity style={styles.settingsHeader} onPress={() => setShowSettings(!showSettings)}>
          <Text style={styles.settingsHeaderText}>
            {showSettings ? '▲ Hide Connection Settings' : '▼ Show Connection Settings'}
          </Text>
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.settingsForm}>
            <Text style={styles.label}>Server IP / Host address</Text>
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={setIpAddress}
              placeholder="e.g., 192.168.1.100 or 10.0.2.2"
              placeholderTextColor={COLORS.placeholder}
              autoCapitalize="none"
            />
            <Text style={styles.helpText}>
              In Android emulators, use 10.0.2.2 to connect to local host backend server. For physical devices, enter the LAN IP of your host machine.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  subTitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    ...TYPOGRAPHY.buttonText,
  },
  settingsHeader: {
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
  },
  settingsHeaderText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  settingsForm: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
