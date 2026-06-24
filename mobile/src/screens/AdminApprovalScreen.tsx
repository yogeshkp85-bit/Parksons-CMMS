import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import api from '../services/api';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

const STATIC_ROOT_CAUSE_CATEGORIES = [
  { id: 'Normal Wear & Tear', name: 'Normal Wear & Tear' },
  { id: 'Lack of Lubrication', name: 'Lack of Lubrication' },
  { id: 'Operator Negligence', name: 'Operator Negligence' },
  { id: 'Design Defect', name: 'Design Defect' },
  { id: 'Material Fatigue', name: 'Material Fatigue' },
  { id: 'External Factor', name: 'External Factor' },
  { id: 'Utility Trip', name: 'Utility Trip' }
];

const STATIC_ACTION_CATEGORIES = [
  { id: 'Part Replaced', name: 'Part Replaced' },
  { id: 'Component Calibrated', name: 'Component Calibrated' },
  { id: 'Temporary Repair', name: 'Temporary Repair' },
  { id: 'Overhauled', name: 'Overhauled' },
  { id: 'Lubricated & Cleaned', name: 'Lubricated & Cleaned' },
  { id: 'Wiring Fixed', name: 'Wiring Fixed' },
  { id: 'Reset System', name: 'Reset System' }
];

export default function AdminApprovalScreen({ navigation }: { navigation: any }) {
  const [pendingLogs, setPendingLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [actionDesc, setActionDesc] = useState('');
  const [rootCauseDesc, setRootCauseDesc] = useState('');
  const [logRemarks, setLogRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/breakdowns/pending');
      if (res.data?.data?.all) {
        const filtered = res.data.data.all.filter((item: any) => item.status === 'PENDING_REVIEW');
        setPendingLogs(filtered);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load pending queue data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelect = (item: any) => {
    setSelectedLog(item);
    setActionDesc(item.actionTaken || '');
    setRootCauseDesc(item.rootCause || '');
    setLogRemarks(item.remarks || '');
  };

  const handleApprove = async () => {
    if (!selectedLog) return;
    setIsProcessing(true);
    try {
      // 1. Save edits first via PUT /breakdowns/update
      await api.put('/breakdowns/update', {
        refId: selectedLog.refId,
        actionTaken: actionDesc || undefined,
        rootCause: rootCauseDesc || undefined,
        remarks: logRemarks || undefined
      });

      // 2. Call approvals approve endpoint
      await api.post('/approvals/approve', {
        refId: selectedLog.refId
      });

      Alert.alert('Success', `Incident ${selectedLog.refId} APPROVED successfully.`);
      setSelectedLog(null);
      fetchPending();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLog) return;
    setIsProcessing(true);
    try {
      await api.post('/approvals/reject', {
        refId: selectedLog.refId
      });

      Alert.alert('Success', `Incident ${selectedLog.refId} REJECTED successfully.`);
      setSelectedLog(null);
      fetchPending();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject incident.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {selectedLog ? (
        <ScrollView style={styles.reviewContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviewing Incident</Text>
            <TouchableOpacity onPress={() => setSelectedLog(null)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.refIdText}>{selectedLog.refId}</Text>
            <Text style={styles.detailLabel}>Machine: <Text style={styles.detailValue}>{selectedLog.machineName} ({selectedLog.unit || 'Whole Machine'})</Text></Text>
            <Text style={styles.detailLabel}>Shift: <Text style={styles.detailValue}>{selectedLog.shift}</Text></Text>
            <Text style={styles.detailLabel}>Downtime: <Text style={styles.detailValue}>{selectedLog.duration || selectedLog.durationMin || '--'} mins</Text></Text>
            <Text style={styles.detailLabel}>Problem Category: <Text style={styles.detailValue}>{selectedLog.category}</Text></Text>
            <Text style={styles.detailLabel}>Problem Description: <Text style={styles.detailValue}>{selectedLog.description}</Text></Text>
            <Text style={styles.detailLabel}>Logged By: <Text style={styles.detailValue}>{selectedLog.submittedBy || 'N/A'}</Text></Text>
          </View>

          {/* Root Cause Dropdown selector */}
          <Text style={styles.label}>Select Root Cause Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {STATIC_ROOT_CAUSE_CATEGORIES.map((rc) => (
              <TouchableOpacity
                key={rc.id}
                style={[styles.chip, rootCauseDesc.startsWith(rc.id) && styles.activeChip]}
                onPress={() => setRootCauseDesc(rc.id)}
              >
                <Text style={[styles.chipText, rootCauseDesc.startsWith(rc.id) && styles.activeChipText]}>{rc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Root Cause Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={rootCauseDesc}
            onChangeText={setRootCauseDesc}
            placeholder="e.g. Bearing failure due to dust load..."
            placeholderTextColor={COLORS.placeholder}
            multiline
            numberOfLines={2}
          />

          {/* Action Taken Dropdown selector */}
          <Text style={styles.label}>Select Action Taken Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {STATIC_ACTION_CATEGORIES.map((at) => (
              <TouchableOpacity
                key={at.id}
                style={[styles.chip, actionDesc.startsWith(at.id) && styles.activeChip]}
                onPress={() => setActionDesc(at.id)}
              >
                <Text style={[styles.chipText, actionDesc.startsWith(at.id) && styles.activeChipText]}>{at.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Action Taken Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={actionDesc}
            onChangeText={setActionDesc}
            placeholder="e.g. Replaced worn bearings and cleaned shaft..."
            placeholderTextColor={COLORS.placeholder}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Remarks (Admin Comments)</Text>
          <TextInput
            style={styles.input}
            value={logRemarks}
            onChangeText={setLogRemarks}
            placeholder="Review completed cleanly."
            placeholderTextColor={COLORS.placeholder}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject} disabled={isProcessing}>
              <Text style={styles.rejectText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.approveText}>APPROVE</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.headerTitle}>Pending Approvals</Text>
          <Text style={styles.subtitle}>Select a logged breakdown request to review and update</Text>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={pendingLogs}
              keyExtractor={(item) => item.refId}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>🎉 No pending breakdown approvals found!</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.itemCard} onPress={() => handleSelect(item)}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemRef}>{item.refId}</Text>
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.itemText}><Text style={styles.bold}>Machine:</Text> {item.machineName}</Text>
                  <Text style={styles.itemText}><Text style={styles.bold}>Defect:</Text> {item.description}</Text>
                  <Text style={styles.itemText}><Text style={styles.bold}>Duration:</Text> {item.duration || item.durationMin || '--'} mins</Text>
                  <Text style={styles.itemText}><Text style={styles.bold}>Logged By:</Text> {item.submittedBy}</Text>
                </TouchableOpacity>
              )}
            />
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
  listContainer: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemRef: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  reviewContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  closeText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  refIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: 'normal',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
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
    height: 60,
    textAlignVertical: 'top',
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  rejectBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  rejectText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
  },
  approveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
