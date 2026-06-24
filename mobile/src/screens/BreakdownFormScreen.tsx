import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { saveOfflineBreakdown, getCachedMachines, cacheMachines } from '../services/db';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

export default function BreakdownFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const scannedMachineName = route.params?.machineName || '';
  const scannedMachineId = route.params?.machineId || '';

  const [isOnline, setIsOnline] = useState(true);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [shift, setShift] = useState('Shift A');
  const [category, setCategory] = useState('Mechanical');
  const [problemType, setProblemType] = useState('Gearbox Failure');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Network Monitoring & Machine Master Caching
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const loadMachines = async () => {
    if (!isOnline) {
      const cached = getCachedMachines();
      setMachines(cached);
      if (scannedMachineId) {
        const found = cached.find(c => c.id === scannedMachineId || c.machineId === scannedMachineId);
        if (found) setSelectedMachine(found);
      }
      return;
    }

    try {
      const response = await api.get('/machines');
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setMachines(data);
      
      // Cache locally in SQLite
      const flatList = data.map((m: any) => ({
        id: m.id,
        machineId: m.machineId || m.id,
        name: m.name,
        category: m.category?.name || 'General',
        units: m.units || '',
      }));
      cacheMachines(flatList);

      if (scannedMachineId) {
        const found = data.find((c: any) => c.id === scannedMachineId || c.machineId === scannedMachineId);
        if (found) setSelectedMachine(found);
      }
    } catch (e) {
      console.warn('Failed to load machines online, falling back to cache', e);
      setMachines(getCachedMachines());
    }
  };

  useEffect(() => {
    loadMachines();
  }, [isOnline, scannedMachineId]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required to take defect photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleChooseLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMachine && !scannedMachineName) {
      Alert.alert('Validation Error', 'Please select a machine.');
      return;
    }
    if (!description) {
      Alert.alert('Validation Error', 'Please describe the problem.');
      return;
    }

    const machineName = selectedMachine ? selectedMachine.name : scannedMachineName;
    const machineId = selectedMachine ? selectedMachine.id : scannedMachineId;

    if (!isOnline) {
      // Offline Flow: Save draft in SQLite
      try {
        const tempId = Math.random().toString(36).substring(7);
        saveOfflineBreakdown({
          id: tempId,
          machineId: machineId || 'offline-machine',
          machineName,
          shift,
          category,
          problemType,
          description,
          priority,
          imageUri,
        });
        Alert.alert('Saved Offline', 'Breakdown saved locally. It will auto-sync when network returns.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to save breakdown locally.');
      }
      return;
    }

    // Online Flow: POST directly to server
    setLoading(true);
    try {
      const payload: any = {
        machineName,
        shift,
        category,
        problemType,
        description,
        priority,
        timeStart: new Date().toISOString(),
      };

      if (imageUri) {
        // Mock sending base64 or upload file if backend has attachment support
        // In basic version we pass imageUri placeholder or upload
        payload.imageUrl = imageUri;
      }

      await api.post('/breakdowns/create', payload);
      Alert.alert('Success', 'Breakdown logged successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit breakdown.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Log New Breakdown</Text>
      
      {/* Machine Name Box */}
      <Text style={styles.label}>Machine</Text>
      {scannedMachineName ? (
        <View style={styles.scannedBox}>
          <Text style={styles.scannedText}>Scanned: {scannedMachineName}</Text>
        </View>
      ) : (
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(Array.isArray(machines) ? machines : []).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.machineChip,
                  selectedMachine?.id === m.id && styles.activeMachineChip
                ]}
                onPress={() => setSelectedMachine(m)}
              >
                <Text style={[
                  styles.machineChipText,
                  selectedMachine?.id === m.id && styles.activeMachineChipText
                ]}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Shift Segment */}
      <Text style={styles.label}>Shift</Text>
      <View style={styles.tabsRow}>
        {['Shift A', 'Shift B', 'Shift C'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tabButton, shift === s && styles.activeTabButton]}
            onPress={() => setShift(s)}
          >
            <Text style={[styles.tabButtonText, shift === s && styles.activeTabButtonText]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Priority Selection */}
      <Text style={styles.label}>Priority</Text>
      <View style={styles.tabsRow}>
        {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.tabButton,
              priority === p && {
                backgroundColor: p === 'HIGH' ? COLORS.danger : p === 'MEDIUM' ? COLORS.warning : COLORS.secondary
              }
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.tabButtonText, priority === p && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Problem Category & Type */}
      <Text style={styles.label}>Problem Category</Text>
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Mechanical, Electrical, Pneumatic, etc."
        placeholderTextColor={COLORS.placeholder}
      />

      <Text style={styles.label}>Problem Type</Text>
      <TextInput
        style={styles.input}
        value={problemType}
        onChangeText={setProblemType}
        placeholder="E.g. Belt slip, Overheating, Jammed"
        placeholderTextColor={COLORS.placeholder}
      />

      {/* Problem Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter breakdown details..."
        placeholderTextColor={COLORS.placeholder}
        multiline
        numberOfLines={4}
      />

      {/* Defect Photo Attachments */}
      <Text style={styles.label}>Defect Photo</Text>
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
          <Text style={styles.photoButtonText}>📷 Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={handleChooseLibrary}>
          <Text style={styles.photoButtonText}>🖼️ Choose Gallery</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removePhoto} onPress={() => setImageUri(null)}>
            <Text style={styles.removeText}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submission Control */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isOnline ? 'SUBMIT BREAKDOWN' : 'SAVE OFFLINE DRAFT'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: 20,
    color: COLORS.primary,
  },
  label: {
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.text,
    marginVertical: 8,
    fontWeight: '600',
  },
  scannedBox: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 12,
  },
  scannedText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  machineChip: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeMachineChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  machineChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  activeMachineChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoButtonText: {
    color: COLORS.text,
    fontSize: 13,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removePhoto: {
    padding: 8,
    marginTop: 8,
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    ...TYPOGRAPHY.buttonText,
  },
});
