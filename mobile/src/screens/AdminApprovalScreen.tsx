import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const TECHNICIANS = ['Ashish', 'Shivaji', 'Bipin', 'Ketan', 'Sanjay', 'Dinesh', 'Vijay', 'Amit', 'Rajesh', 'Nilesh', 'YogeshK'];
const SHIFTS = ['First Shift', 'Second Shift', 'Third Shift'];

export default function AdminApprovalScreen({ navigation }: { navigation: any }) {
  const [pendingLogs, setPendingLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  
  // Extended form states
  const [actionDesc, setActionDesc] = useState('');
  const [rootCauseDesc, setRootCauseDesc] = useState('');
  const [logRemarks, setLogRemarks] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editAttendedBy, setEditAttendedBy] = useState('');
  const [editAdditionalTeam, setEditAdditionalTeam] = useState<string[]>([]);
  const [editProblemReported, setEditProblemReported] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSpareConsumed, setEditSpareConsumed] = useState('');

  // Bulk processing states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTeamModal, setShowTeamModal] = useState(false);

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
    if (isSelectMode) {
      toggleSelection(item.refId);
      return;
    }
    
    setSelectedLog(item);
    setActionDesc(item.actionTaken || '');
    setRootCauseDesc(item.rootCause || '');
    setLogRemarks(item.remarks || '');
    
    let formattedDate = '';
    if (item.date) {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }
    setEditDate(formattedDate || '');
    setEditShift(item.shift || '');
    setEditAttendedBy(item.attendedBy || '');
    setEditProblemReported(item.problemReported || '');
    setEditDescription(item.description || '');
    setEditSpareConsumed(item.spareConsumed || '');
    setEditAdditionalTeam(
      item.additionalTeam 
        ? String(item.additionalTeam).split(',').map(s => s.trim()).filter(Boolean) 
        : []
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    let approved = 0;
    let failed = 0;
    for (const refId of Array.from(selectedIds)) {
      try {
        await api.post('/approvals/approve', { refId });
        approved++;
      } catch {
        failed++;
      }
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
    fetchPending();
    setIsProcessing(false);
    Alert.alert('Bulk Process', `${approved} approved, ${failed} failed.`);
  };

  const handleApprove = async () => {
    if (!selectedLog) return;
    setIsProcessing(true);
    try {
      await api.put('/breakdowns/update', {
        refId: selectedLog.refId,
        date: editDate || undefined,
        shift: editShift || undefined,
        attendedBy: editAttendedBy || undefined,
        additionalTeam: editAdditionalTeam.join(', ') || undefined,
        problemReported: editProblemReported || undefined,
        description: editDescription || undefined,
        spareConsumed: editSpareConsumed || undefined,
        actionTaken: actionDesc || undefined,
        rootCause: rootCauseDesc || undefined,
        remarks: logRemarks || undefined
      });

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

  const renderTeamModal = () => (
    <Modal visible={showTeamModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitleText}>Select Team Members</Text>
            <TouchableOpacity onPress={() => setShowTeamModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {TECHNICIANS.filter(t => t !== editAttendedBy).map(tech => {
              const isSelected = editAdditionalTeam.includes(tech);
              return (
                <TouchableOpacity 
                  key={tech} 
                  style={[styles.teamRow, isSelected && styles.teamRowSelected]}
                  onPress={() => setEditAdditionalTeam(prev => isSelected ? prev.filter(n => n !== tech) : [...prev, tech])}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[styles.teamNameText, isSelected && styles.teamNameSelected]}>{tech}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.doneBtn} onPress={() => setShowTeamModal(false)}>
            <Text style={styles.doneBtnText}>Confirm ({editAdditionalTeam.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {selectedLog ? (
        <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviewing Incident</Text>
            <TouchableOpacity onPress={() => setSelectedLog(null)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reviewContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.detailsCard}>
              <Text style={styles.refIdText}>{selectedLog.refId}</Text>
              
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="Date" placeholderTextColor={COLORS.placeholder} />
              
              <Text style={styles.label}>Shift</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {SHIFTS.map(s => (
                  <TouchableOpacity key={s} style={[styles.chip, editShift === s && styles.activeChip]} onPress={() => setEditShift(s)}>
                    <Text style={[styles.chipText, editShift === s && styles.activeChipText]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Attended By (Primary)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {TECHNICIANS.map(t => (
                  <TouchableOpacity key={t} style={[styles.chip, editAttendedBy === t && styles.activeChip]} onPress={() => setEditAttendedBy(t)}>
                    <Text style={[styles.chipText, editAttendedBy === t && styles.activeChipText]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Additional Team</Text>
              <TouchableOpacity style={styles.inputPicker} onPress={() => setShowTeamModal(true)}>
                <Text style={{ color: editAdditionalTeam.length ? COLORS.text : COLORS.placeholder }}>
                  {editAdditionalTeam.length ? editAdditionalTeam.join(', ') : 'Select co-workers...'}
                </Text>
                <Ionicons name="people" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.label}>Problem Reported</Text>
              <TextInput style={[styles.input, styles.textArea]} value={editProblemReported} onChangeText={setEditProblemReported} placeholder="Problem reported..." placeholderTextColor={COLORS.placeholder} multiline />

              <Text style={styles.label}>Problem Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={editDescription} onChangeText={setEditDescription} placeholder="Description..." placeholderTextColor={COLORS.placeholder} multiline />

              <Text style={styles.label}>Spare Parts Consumed</Text>
              <TextInput style={styles.input} value={editSpareConsumed} onChangeText={setEditSpareConsumed} placeholder="e.g. Bearing 6205 x2" placeholderTextColor={COLORS.placeholder} />
              
              {/* Root Cause Category */}
              <Text style={[styles.label, { marginTop: 20, color: COLORS.warning }]}>Root Cause Analysis</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {STATIC_ROOT_CAUSE_CATEGORIES.map((rc) => (
                  <TouchableOpacity key={rc.id} style={[styles.chip, rootCauseDesc.startsWith(rc.id) && styles.activeChip]} onPress={() => setRootCauseDesc(rc.id)}>
                    <Text style={[styles.chipText, rootCauseDesc.startsWith(rc.id) && styles.activeChipText]}>{rc.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={[styles.input, styles.textArea]} value={rootCauseDesc} onChangeText={setRootCauseDesc} placeholder="Additional details..." placeholderTextColor={COLORS.placeholder} multiline />

              {/* Action Taken Category */}
              <Text style={[styles.label, { marginTop: 20, color: COLORS.success }]}>Action Taken & Resolution</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {STATIC_ACTION_CATEGORIES.map((at) => (
                  <TouchableOpacity key={at.id} style={[styles.chip, actionDesc.startsWith(at.id) && styles.activeChip]} onPress={() => setActionDesc(at.id)}>
                    <Text style={[styles.chipText, actionDesc.startsWith(at.id) && styles.activeChipText]}>{at.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput style={[styles.input, styles.textArea]} value={actionDesc} onChangeText={setActionDesc} placeholder="Additional details..." placeholderTextColor={COLORS.placeholder} multiline />

              <Text style={styles.label}>Admin Remarks</Text>
              <TextInput style={styles.input} value={logRemarks} onChangeText={setLogRemarks} placeholder="Final remarks..." placeholderTextColor={COLORS.placeholder} />
            </View>
          </ScrollView>

          <View style={styles.buttonRowFixed}>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject} disabled={isProcessing}>
              <Text style={styles.rejectText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.approveText}>APPROVE LOG</Text>}
            </TouchableOpacity>
          </View>
          {renderTeamModal()}
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Pending Queue</Text>
              <Text style={styles.subtitle}>Select logs to review</Text>
            </View>
            <TouchableOpacity 
              style={[styles.selectModeBtn, isSelectMode && styles.selectModeBtnActive]}
              onPress={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedIds(new Set());
              }}
            >
              <Ionicons name="checkbox-outline" size={18} color={isSelectMode ? '#fff' : COLORS.textMuted} />
            </TouchableOpacity>
          </View>

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
              renderItem={({ item }) => {
                const isSelected = selectedIds.has(item.refId);
                return (
                  <TouchableOpacity 
                    style={[styles.itemCard, isSelected && styles.itemCardSelected]} 
                    onPress={() => handleSelect(item)}
                    onLongPress={() => {
                      if (!isSelectMode) setIsSelectMode(true);
                      toggleSelection(item.refId);
                    }}
                  >
                    <View style={styles.itemHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isSelectMode && (
                          <View style={[styles.listCheckbox, isSelected && styles.listCheckboxSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                        )}
                        <Text style={styles.itemRef}>{item.refId}</Text>
                      </View>
                      <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.itemText}><Text style={styles.bold}>Machine:</Text> {item.machineName}</Text>
                    <Text style={styles.itemText}><Text style={styles.bold}>Defect:</Text> {item.description}</Text>
                    <Text style={styles.itemText}><Text style={styles.bold}>Duration:</Text> {item.duration || item.durationMin || '--'} mins</Text>
                    <Text style={styles.itemText}><Text style={styles.bold}>Logged By:</Text> {item.submittedBy}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {isSelectMode && selectedIds.size > 0 && (
            <TouchableOpacity style={styles.fabApprove} onPress={handleBulkApprove} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.fabApproveText}>Bulk Approve ({selectedIds.size})</Text>}
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  selectModeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectModeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
  itemCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center'
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
  listCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listCheckboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  fabApprove: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabApproveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  closeText: {
    color: COLORS.textMuted,
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    fontSize: 13,
  },
  inputPicker: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 12,
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonRowFixed: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
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
    backgroundColor: 'transparent',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitleText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Outfit-Bold'
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  teamRowSelected: {
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  teamNameText: {
    color: COLORS.textMuted,
    fontSize: 14
  },
  teamNameSelected: {
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  doneBtnText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
