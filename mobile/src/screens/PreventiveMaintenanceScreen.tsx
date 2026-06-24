import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

export default function PreventiveMaintenanceScreen() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'tasks' | 'frequencies' | 'compliance'>('schedules');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [frequencies, setFrequencies] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Executing Schedule Modal
  const [activeSchedule, setActiveSchedule] = useState<any | null>(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [checklist, setChecklist] = useState<any[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Creation forms
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskFreq, setNewTaskFreq] = useState('');
  const [newTaskCheckpoints, setNewTaskCheckpoints] = useState('');

  const [newFreqName, setNewFreqName] = useState('');
  const [newFreqCode, setNewFreqCode] = useState('');
  const [newFreqDays, setNewFreqDays] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'schedules') {
        const { data } = await api.get('/pm/schedules');
        setSchedules(data || []);
      } else if (activeTab === 'tasks') {
        const response = await api.get('/pm/tasks');
        setTasks(response.data || []);
        const freqRes = await api.get('/pm/frequencies');
        setFrequencies(freqRes.data?.data || []);
      } else if (activeTab === 'frequencies') {
        const { data } = await api.get('/pm/frequencies');
        setFrequencies(data?.data || []);
      } else if (activeTab === 'compliance') {
        const { data } = await api.get('/pm/compliance');
        setCompliance(data?.data || null);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to load PM data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openExecute = (schedule: any) => {
    setActiveSchedule(schedule);
    setCompletionRemarks('');
    setImageUri(null);
    const cpString = schedule.pmTask?.checkpoints || '';
    const parsed = cpString.split('\n').filter((s: string) => s.trim().length > 0).map((s: string) => ({
      item: s.trim(),
      passed: null as boolean | null,
      notes: ''
    }));
    setChecklist(parsed);
  };

  const updateChecklist = (index: number, field: 'passed' | 'notes', value: any) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], [field]: value };
    setChecklist(updated);
  };

  const handleCompleteSchedule = async () => {
    if (!activeSchedule) return;
    const uncompleted = checklist.some(c => c.passed === null);
    if (uncompleted && checklist.length > 0) {
      Alert.alert('Incomplete checklist', 'Please mark Pass or Fail for all checklist items.');
      return;
    }
    if (!completionRemarks) {
      Alert.alert('Validation Error', 'Please enter completion remarks.');
      return;
    }

    setIsProcessing(true);
    try {
      await api.put(`/pm/schedules/${activeSchedule.id}/complete`, {
        completionRemarks,
        checkpointsResult: checklist,
        imageUrl: imageUri || undefined
      });
      Alert.alert('Success', 'PM completed successfully.');
      setActiveSchedule(null);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to complete PM schedule.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskName || !newTaskFreq || !newTaskCheckpoints) {
      Alert.alert('Error', 'Please fill in name, frequency, and checkpoints.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/pm/tasks', {
        name: newTaskName,
        description: newTaskDesc,
        frequencyId: newTaskFreq,
        checkpoints: newTaskCheckpoints
      });
      Alert.alert('Success', 'Task created successfully.');
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskCheckpoints('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create task.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateFrequency = async () => {
    if (!newFreqName || !newFreqCode || !newFreqDays) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/pm/frequencies', {
        name: newFreqName,
        code: newFreqCode,
        intervalDays: newFreqDays
      });
      Alert.alert('Success', 'Frequency created successfully.');
      setNewFreqName('');
      setNewFreqCode('');
      setNewFreqDays('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create frequency.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Tabs */}
      <View style={styles.tabsRow}>
        {(['schedules', 'tasks', 'frequencies', 'compliance'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => {
              setActiveTab(tab);
              setActiveSchedule(null);
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeSchedule ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Execute PM</Text>
            <TouchableOpacity onPress={() => setActiveSchedule(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaTitle}>{activeSchedule.pmTask?.name}</Text>
            <Text style={styles.metaDesc}>{activeSchedule.pmTask?.description || 'No description provided.'}</Text>
            <Text style={styles.metaMachine}>Asset: {activeSchedule.machine?.name}</Text>
          </View>

          {checklist.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Checklist</Text>
              {checklist.map((item, idx) => (
                <View key={idx} style={styles.checklistCard}>
                  <Text style={styles.checkText}>{item.item}</Text>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[styles.checkBtn, item.passed === true && styles.passedBtn]}
                      onPress={() => updateChecklist(idx, 'passed', true)}
                    >
                      <Text style={[styles.checkBtnText, item.passed === true && styles.activeBtnText]}>Pass</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.checkBtn, item.passed === false && styles.failedBtn]}
                      onPress={() => updateChecklist(idx, 'passed', false)}
                    >
                      <Text style={[styles.checkBtnText, item.passed === false && styles.activeBtnText]}>Fail</Text>
                    </TouchableOpacity>
                  </View>
                  {item.passed === false && (
                    <TextInput
                      style={styles.checkInput}
                      placeholder="Enter failure reason..."
                      placeholderTextColor={COLORS.placeholder}
                      value={item.notes}
                      onChangeText={(val) => updateChecklist(idx, 'notes', val)}
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Completion Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about the maintenance completed..."
            placeholderTextColor={COLORS.placeholder}
            value={completionRemarks}
            onChangeText={setCompletionRemarks}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Execution Photo</Text>
          <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage}>
            <Text style={styles.photoBtnText}>📷 Snap Defect/Check Photo</Text>
          </TouchableOpacity>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

          <TouchableOpacity style={styles.submitBtn} onPress={handleCompleteSchedule} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>SUBMIT PM LOG</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          {activeTab === 'schedules' && (
            <FlatList
              data={schedules}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No active schedules found.</Text>}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{item.machine?.name}</Text>
                    <Text style={[styles.statusTag, item.status === 'COMPLETED' ? styles.statusCompleted : styles.statusPending]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.cardText}><Text style={styles.bold}>Task:</Text> {item.pmTask?.name}</Text>
                  <Text style={styles.cardText}><Text style={styles.bold}>Due Date:</Text> {new Date(item.dueDate).toLocaleDateString()}</Text>
                  {item.status === 'PENDING' && (
                    <TouchableOpacity style={styles.executeBtn} onPress={() => openExecute(item)}>
                      <Text style={styles.executeBtnText}>Execute Task</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          {activeTab === 'tasks' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>New Preventive Task</Text>
                <TextInput style={styles.input} placeholder="Task Name" placeholderTextColor={COLORS.placeholder} value={newTaskName} onChangeText={setNewTaskName} />
                <TextInput style={styles.input} placeholder="Description" placeholderTextColor={COLORS.placeholder} value={newTaskDesc} onChangeText={setNewTaskDesc} />
                
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.row}>
                  {frequencies.map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.smallChip, newTaskFreq === f.id && styles.activeSmallChip]}
                      onPress={() => setNewTaskFreq(f.id)}
                    >
                      <Text style={[styles.smallChipText, newTaskFreq === f.id && styles.activeSmallChipText]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.input, styles.textArea, { marginTop: 10 }]}
                  placeholder="Checkpoints (one per line)"
                  placeholderTextColor={COLORS.placeholder}
                  value={newTaskCheckpoints}
                  onChangeText={setNewTaskCheckpoints}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask} disabled={isProcessing}>
                  <Text style={styles.submitBtnText}>CREATE PM TASK</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Task Registry</Text>
              {tasks.map((task) => (
                <View key={task.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{task.name}</Text>
                  <Text style={styles.cardText}>{task.description || 'No description'}</Text>
                  <Text style={styles.frequencyBadge}>{task.frequency?.name}</Text>
                  <Text style={styles.bold}>Checkpoints:</Text>
                  <Text style={styles.checkpointsList}>{task.checkpoints}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {activeTab === 'frequencies' && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>New Frequency</Text>
                <TextInput style={styles.input} placeholder="Frequency Name (e.g. Monthly)" placeholderTextColor={COLORS.placeholder} value={newFreqName} onChangeText={setNewFreqName} />
                <TextInput style={styles.input} placeholder="Code (e.g. MN)" placeholderTextColor={COLORS.placeholder} value={newFreqCode} onChangeText={setNewFreqCode} />
                <TextInput style={styles.input} placeholder="Interval (Days)" placeholderTextColor={COLORS.placeholder} keyboardType="numeric" value={newFreqDays} onChangeText={setNewFreqDays} />
                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateFrequency} disabled={isProcessing}>
                  <Text style={styles.submitBtnText}>CREATE FREQUENCY</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Frequencies List</Text>
              {frequencies.map((freq) => (
                <View key={freq.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{freq.name} ({freq.code})</Text>
                  <Text style={styles.cardText}>Interval: {freq.intervalDays} Days</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {activeTab === 'compliance' && compliance && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.kpiContainer}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiValue}>{compliance.totalScheduled}</Text>
                  <Text style={styles.kpiLabel}>Total Scheduled</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: COLORS.success }]}>{compliance.completed}</Text>
                  <Text style={styles.kpiLabel}>Completed</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: COLORS.danger }]}>{compliance.overdue}</Text>
                  <Text style={styles.kpiLabel}>Overdue</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: COLORS.primary }]}>{compliance.complianceRate}%</Text>
                  <Text style={styles.kpiLabel}>Compliance Rate</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Overdue Critical Schedules</Text>
              {schedules
                .filter((s) => s.status === 'PENDING' && new Date(s.dueDate) < new Date())
                .map((s) => {
                  const overdueDays = Math.ceil((new Date().getTime() - new Date(s.dueDate).getTime()) / (1000 * 3600 * 24));
                  return (
                    <View key={s.id} style={[styles.card, { borderColor: COLORS.danger }]}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.cardTitle}>{s.machine?.name}</Text>
                        <Text style={styles.overdueDays}>{overdueDays} Days Overdue</Text>
                      </View>
                      <Text style={styles.cardText}><Text style={styles.bold}>Task:</Text> {s.pmTask?.name}</Text>
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardText: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: COLORS.success,
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: COLORS.warning,
  },
  executeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  executeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  closeText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  metaCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  metaTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  metaMachine: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyMuted,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checklistCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  checkText: {
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  checkBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  passedBtn: {
    backgroundColor: COLORS.success,
  },
  failedBtn: {
    backgroundColor: COLORS.danger,
  },
  checkBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeBtnText: {
    color: '#FFFFFF',
  },
  checkInput: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 6,
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
    height: 80,
    textAlignVertical: 'top',
  },
  photoBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  photoBtnText: {
    color: COLORS.text,
    fontSize: 13,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    ...TYPOGRAPHY.buttonText,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  smallChip: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeSmallChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  smallChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  activeSmallChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  frequencyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  checkpointsList: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    width: '48%',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  kpiLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  overdueDays: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 11,
  },
});
