import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../components/Theme';
import { GlassCard, Badge } from '../components/premium';
import api from '../services/api';

export default function BreakdownDetailScreen({ route, navigation }: any) {
  const { breakdown: initialBreakdown } = route.params;
  const [breakdown, setBreakdown] = useState<any>(initialBreakdown);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialBreakdown?.refId) {
      setLoading(true);
      api.get('/breakdowns/pending').then(res => {
        const allLogs = res.data?.data?.all || [];
        const full = allLogs.find((b: any) => b.refId === initialBreakdown.refId);
        if (full) {
          setBreakdown({ ...initialBreakdown, ...full, minutes: full.duration || initialBreakdown.minutes });
        }
      }).catch(err => console.log('Error fetching full breakdown:', err))
        .finally(() => setLoading(false));
    }
  }, [initialBreakdown]);

  if (!breakdown) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: COLORS.textMuted }}>Details not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Breakdown Log</Text>
        <View style={{ width: 40, alignItems: 'center' }}>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* IDENTIFICATION */}
        <GlassCard style={styles.section} glowColor={COLORS.primary}>
          <View style={styles.rowBetween}>
            <Text style={styles.refId}>{breakdown.refId || 'N/A'}</Text>
            <Badge label={breakdown.category || 'General'} color={COLORS.primary} />
          </View>
          <Text style={styles.machineTitle}>{breakdown.machineName || 'Unknown Machine'}</Text>
          <Text style={styles.subtext}>{breakdown.machineType || ''} {breakdown.unit ? `• ${breakdown.unit}` : ''}</Text>
        </GlassCard>

        {/* TIMING */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}><Ionicons name="time" size={16}/>  Timing & Shift</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaVal}>{breakdown.date || '--'}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Shift</Text>
              <Text style={styles.metaVal}>{breakdown.shift || '--'}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Start Time</Text>
              <Text style={styles.metaVal}>{breakdown.timeStart || '--'}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>End Time</Text>
              <Text style={styles.metaVal}>{breakdown.timeEnd || '--'}</Text>
            </View>
          </View>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Total Downtime</Text>
            <Text style={styles.durationText}>{breakdown.minutes || 0} mins</Text>
          </View>
        </GlassCard>

        {/* PROBLEM SPECIFICATION */}
        <GlassCard style={styles.section} glowColor={COLORS.danger}>
          <Text style={styles.sectionTitle}><Ionicons name="alert-circle" size={16}/>  Problem Specification</Text>
          <Text style={styles.metaLabel}>Problem Type</Text>
          <Text style={styles.metaVal}>{breakdown.problemType || '--'}</Text>
          
          <Text style={styles.metaLabel}>Description</Text>
          <Text style={styles.descriptionText}>{breakdown.description || 'No description provided.'}</Text>
          
          {breakdown.problemReported && (
            <>
              <Text style={[styles.metaLabel, { marginTop: 12 }]}>Reported By</Text>
              <Text style={styles.metaVal}>{breakdown.problemReported}</Text>
            </>
          )}
        </GlassCard>

        {/* ACTION & RESOLUTION */}
        {(breakdown.actionTaken || breakdown.rootCause) && (
          <GlassCard style={styles.section} glowColor={COLORS.success}>
            <Text style={styles.sectionTitle}><Ionicons name="build" size={16}/>  Action & Resolution</Text>
            
            {breakdown.actionTaken ? (
              <>
                <Text style={styles.metaLabel}>Action Taken</Text>
                <Text style={styles.descriptionText}>{breakdown.actionTaken}</Text>
              </>
            ) : null}

            {breakdown.rootCause ? (
              <>
                {breakdown.actionTaken && <View style={styles.divider} />}
                <Text style={styles.metaLabel}>Root Cause</Text>
                <Text style={styles.descriptionText}>{breakdown.rootCause}</Text>
              </>
            ) : null}

            {breakdown.spareConsumed ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.metaLabel}>Spares Consumed</Text>
                <Text style={styles.descriptionText}>{breakdown.spareConsumed}</Text>
              </>
            ) : null}
          </GlassCard>
        )}

        {/* PERSONNEL */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}><Ionicons name="people" size={16}/>  Personnel</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Attended By</Text>
              <Text style={styles.metaVal}>{breakdown.attendedBy || '--'}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Additional Team</Text>
              <Text style={styles.metaVal}>{breakdown.additionalTeam || '--'}</Text>
            </View>
          </View>
        </GlassCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  centerContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: SIZES.padding * 2.5, paddingBottom: SIZES.padding, paddingHorizontal: SIZES.padding,
    backgroundColor: 'rgba(15, 23, 42, 0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  backBtn: { padding: 8 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  scroll: { padding: SIZES.padding, paddingBottom: 40 },
  
  section: { padding: SIZES.padding, marginBottom: 16 },
  sectionTitle: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refId: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  machineTitle: { color: COLORS.text, fontSize: 18, fontWeight: '600', marginBottom: 4 },
  subtext: { color: COLORS.textMuted, fontSize: 13 },
  
  metaRow: { flexDirection: 'row', marginBottom: 16 },
  metaCol: { flex: 1 },
  metaLabel: { color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metaVal: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  
  descriptionText: { color: COLORS.text, fontSize: 14, lineHeight: 22, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 16 },
  
  durationBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  durationLabel: { color: COLORS.danger, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  durationText: { color: COLORS.danger, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
});
