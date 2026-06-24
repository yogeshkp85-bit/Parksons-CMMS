import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { getDB } from '../services/db';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

export default function BreakdownDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { breakdownId } = route.params;
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<any>(null);
  
  const [actionTaken, setActionTaken] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const loadDetails = async () => {
    setLoading(true);
    
    // Offline Details Fallback
    if (!isOnline || breakdownId.length < 10) { // Local drafts have short temp IDs
      const db = getDB();
      const local = db.getFirstSync<any>(
        `SELECT * FROM offline_breakdowns WHERE id = ?`,
        [breakdownId]
      );
      if (local) {
        setBreakdown({
          breakdownNumber: `DRAFT-${local.id.substring(0, 5)}`,
          machine: { name: local.machineName },
          shift: local.shift,
          category: { name: local.category },
          problemCategory: { name: local.problemType },
          problemDescription: local.description,
          status: local.status,
          startTime: local.createdAt,
          priority: local.priority,
        });
      }
      setLoading(false);
      return;
    }

    try {
      // Find breakdown by listing pending/reports or fetching directly
      const response = await api.get('/breakdowns/pending');
      const list = response.data.data || [];
      const item = list.find((b: any) => b.id === breakdownId);
      
      if (item) {
        setBreakdown(item);
        setActionTaken(item.actionTakenDescription || '');
        setRootCause(item.rootCauseDescription || '');
      } else {
        Alert.alert('Not Found', 'Breakdown detail not found on the server (it might be approved already).');
        navigation.goBack();
      }
    } catch (e: any) {
      console.warn('Failed to load breakdown online details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [isOnline, breakdownId]);

  const handleUpdateProgress = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot update status while offline.');
      return;
    }

    setUpdating(true);
    try {
      // Move status to IN_PROGRESS
      await api.put('/breakdowns/status', {
        refId: breakdown.breakdownNumber,
        status: 'IN_PROGRESS',
      });
      
      Alert.alert('Success', 'Status updated to IN_PROGRESS.');
      loadDetails();
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot submit approval requests while offline.');
      return;
    }
    if (!actionTaken || !rootCause) {
      Alert.alert('Validation Error', 'Please specify action taken and root cause.');
      return;
    }

    setUpdating(true);
    try {
      // Approve/Complete route setup or update description
      await api.post('/approvals/approve', {
        refId: breakdown.breakdownNumber,
        actionTaken,
        rootCause,
      });

      Alert.alert('Submitted', 'Breakdown submitted for supervisor approval.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.response?.data?.message || 'Failed to submit approval.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!breakdown) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load breakdown details.</Text>
      </View>
    );
  }

  const isPendingSync = breakdown.status === 'PENDING_SYNC';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Title block */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.refId}>{breakdown.breakdownNumber}</Text>
          <Text style={[styles.statusTag, { color: breakdown.status === 'APPROVED' ? COLORS.success : COLORS.warning }]}>
            {breakdown.status}
          </Text>
        </View>
        <Text style={styles.machineTitle}>Machine: {breakdown.machine?.name || 'Unknown'}</Text>
        <Text style={styles.dateText}>Logged: {new Date(breakdown.startTime).toLocaleString()}</Text>
      </View>

      {/* Details Section */}
      <Text style={styles.sectionLabel}>Problem Specification</Text>
      <View style={styles.card}>
        <Text style={styles.metaLabel}>Shift</Text>
        <Text style={styles.metaVal}>{breakdown.shift}</Text>

        <View style={styles.divider} />

        <Text style={styles.metaLabel}>Category</Text>
        <Text style={styles.metaVal}>{breakdown.category?.name || 'General'}</Text>

        <View style={styles.divider} />

        <Text style={styles.metaLabel}>Problem Type</Text>
        <Text style={styles.metaVal}>{breakdown.problemCategory?.name || 'General Failure'}</Text>

        <View style={styles.divider} />

        <Text style={styles.metaLabel}>Description</Text>
        <Text style={styles.descriptionText}>{breakdown.problemDescription}</Text>
      </View>

      {/* Action updates form */}
      {!isPendingSync && breakdown.status !== 'APPROVED' && (
        <>
          <Text style={styles.sectionLabel}>Technician Update Actions</Text>
          <View style={styles.card}>
            {breakdown.status === 'PENDING_REVIEW' ? (
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProgress} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>START ATTENDING (IN_PROGRESS)</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.metaLabel}>Root Cause Analysis</Text>
                <TextInput
                  style={styles.input}
                  value={rootCause}
                  onChangeText={setRootCause}
                  placeholder="What caused the failure?"
                  placeholderTextColor={COLORS.placeholder}
                />

                <Text style={styles.metaLabel}>Action Taken Details</Text>
                <TextInput
                  style={styles.input}
                  value={actionTaken}
                  onChangeText={setActionTaken}
                  placeholder="How did you resolve it?"
                  placeholderTextColor={COLORS.placeholder}
                />

                <TouchableOpacity 
                  style={[styles.updateButton, { backgroundColor: COLORS.success }]} 
                  onPress={handleSubmitForApproval} 
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>SUBMIT FOR APPROVAL</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusTag: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  machineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  metaVal: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    ...TYPOGRAPHY.buttonText,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    fontSize: 14,
  },
});
