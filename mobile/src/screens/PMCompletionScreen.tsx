import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../components/Theme';
import { GlassCard, GlassInput } from '../components/premium';
import api from '../services/api';

export default function PMCompletionScreen({ route, navigation }: any) {
  const { schedule } = route.params;
  
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState<{item: string, passed: boolean | null, notes: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Parse checkpoints from string
    const cpString = schedule.pmTask?.checkpoints || '';
    const parsed = cpString.split('\n').filter((s: string) => s.trim().length > 0).map((s: string) => ({
      item: s.trim(),
      passed: null as boolean | null,
      notes: ''
    }));
    setChecklist(parsed);
  }, [schedule]);

  const updateChecklist = (index: number, field: 'passed' | 'notes', value: any) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], [field]: value };
    setChecklist(updated);
  };

  const handleComplete = async () => {
    // Validate checkpoints
    const uncompleted = checklist.some(c => c.passed === null);
    if (uncompleted && checklist.length > 0) {
      alert('Please mark Pass or Fail for all checkpoints.');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/pm/schedules/${schedule.id}/complete`, {
        completionRemarks: remarks,
        checkpointsResult: checklist,
        completedAt: new Date().toISOString()
      });
      alert('PM Task completed successfully!');
      navigation.goBack();
    } catch (err) {
      alert('Failed to complete task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Execution</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.infoCard}>
          <Text style={styles.machineName}>{schedule.machine?.name || 'Unknown Machine'}</Text>
          <Text style={styles.taskName}>{schedule.pmTask?.name || 'Maintenance Task'}</Text>
          {schedule.pmTask?.description && (
            <Text style={styles.description}>{schedule.pmTask.description}</Text>
          )}
        </GlassCard>

        {checklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checkpoints</Text>
            {checklist.map((cp, idx) => (
              <GlassCard key={idx} style={styles.checkpointCard}>
                <Text style={styles.cpItem}>{idx + 1}. {cp.item}</Text>
                
                <View style={styles.cpActions}>
                  <TouchableOpacity 
                    style={[styles.passFailBtn, cp.passed === true && styles.passBtnActive]}
                    onPress={() => updateChecklist(idx, 'passed', true)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={cp.passed === true ? '#fff' : COLORS.success} />
                    <Text style={[styles.passFailText, cp.passed === true && { color: '#fff' }]}>Pass</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.passFailBtn, cp.passed === false && styles.failBtnActive]}
                    onPress={() => updateChecklist(idx, 'passed', false)}
                  >
                    <Ionicons name="close-circle" size={20} color={cp.passed === false ? '#fff' : COLORS.danger} />
                    <Text style={[styles.passFailText, cp.passed === false && { color: '#fff' }]}>Fail</Text>
                  </TouchableOpacity>
                </View>

                {cp.passed === false && (
                  <TextInput
                    style={styles.cpNotesInput}
                    placeholder="Add failure reason..."
                    placeholderTextColor={COLORS.textMuted}
                    value={cp.notes}
                    onChangeText={(val) => updateChecklist(idx, 'notes', val)}
                  />
                )}
              </GlassCard>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Remarks</Text>
          <TextInput
            style={styles.remarksInput}
            placeholder="Add final comments, parts replaced, etc."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={setRemarks}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
          onPress={handleComplete}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Task</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  infoCard: {
    padding: 20,
    marginBottom: 20,
  },
  machineName: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    marginBottom: 5,
  },
  taskName: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 10,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 15,
  },
  checkpointCard: {
    padding: 15,
    marginBottom: 12,
  },
  cpItem: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginBottom: 15,
  },
  cpActions: {
    flexDirection: 'row',
    gap: 10,
  },
  passFailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  passBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  failBtnActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  passFailText: {
    color: COLORS.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  cpNotesInput: {
    marginTop: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  remarksInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
  }
});
