import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../components/Theme';
import { GlassCard, GlowButton, PremiumSelect, PremiumMultiSelect, PremiumInput } from '../components/premium';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  DEPARTMENTS,
  getMachineNames,
  getUnits,
  TECHNICIANS,
  SHIFTS,
  PROBLEM_TYPES,
  CATEGORIES,
  detectCurrentShift,
  isTimeValidForShift
} from '../config/masterConfig';
// Note: offlineQueue needs to be verified/adapted, but for now we'll do direct API call or mock it.
// To keep it simple in this rewrite, we'll try online first.

export default function BreakdownFormScreen({ navigation }: any) {
  const { user } = useAuth();
  const initDetails = detectCurrentShift();

  // STATE: Section 1 (When)
  const [date, setDate] = useState(initDetails.shiftDateStr);
  const [shiftId, setShiftId] = useState(initDetails.shiftId);
  const [timeStart, setTimeStart] = useState('');
  const [dateEnd, setDateEnd] = useState(initDetails.shiftDateStr);
  const [timeEnd, setTimeEnd] = useState('');
  const [shiftError, setShiftError] = useState<string | null>(null);

  // STATE: Section 2 (Machine)
  const [departmentId, setDepartmentId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [machineNames, setMachineNames] = useState<string[]>([]);
  const [unitList, setUnitList] = useState<string[]>([]);

  // STATE: Section 3 (Problem)
  const [problemCategoryId, setProblemCategoryId] = useState(PROBLEM_TYPES[0]);
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]);
  const [problemReported, setProblemReported] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [rootCause, setRootCause] = useState('');

  // STATE: Section 4 (People & Extras)
  const [attendedBy, setAttendedBy] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [spareConsumed, setSpareConsumed] = useState('');
  const [additionalTeam, setAdditionalTeam] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preselect user if technician
  useEffect(() => {
    if (user?.name) {
      const match = TECHNICIANS.find(t => t.toLowerCase() === user.name.toLowerCase());
      if (match) {
        setSubmittedBy(match);
        setAttendedBy(match);
      }
    }
  }, [user]);

  // Set current time for timeStart on mount
  useEffect(() => {
    const now = new Date();
    setTimeStart(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
  }, []);

  // Cascading Dropdowns
  useEffect(() => {
    if (departmentId) {
      setMachineNames(getMachineNames(departmentId));
      setMachineId('');
      setUnitId('');
      setUnitList([]);
    }
  }, [departmentId]);

  useEffect(() => {
    if (departmentId && machineId) {
      const units = getUnits(departmentId, machineId);
      setUnitList(units);
      setUnitId('');
      if (units.length === 1) setUnitId(units[0]);
    }
  }, [machineId, departmentId]);

  // Validators
  const handleTimeStart = (val: string) => {
    setTimeStart(val);
    if (shiftId && val && !isTimeValidForShift(shiftId, val)) {
      setShiftError(`Invalid time for selected shift.`);
    } else {
      setShiftError(null);
    }
  };

  const handleShiftChange = (val: string) => {
    setShiftId(val);
    if (timeStart && val && !isTimeValidForShift(val, timeStart)) {
      setShiftError(`Invalid time for selected shift.`);
    } else {
      setShiftError(null);
    }
  };

  const getCalculatedDuration = () => {
    if (!date || !timeStart || !dateEnd || !timeEnd) return { txt: 'Enter all times', mins: 0 };
    const s = new Date(`${date}T${timeStart}:00`).getTime();
    const e = new Date(`${dateEnd}T${timeEnd}:00`).getTime();
    const diff = Math.round((e - s) / 60000);
    if (isNaN(diff) || diff <= 0) return { txt: 'Invalid timeframe', mins: 0 };
    return { txt: `${diff} mins`, mins: diff };
  };
  const duration = getCalculatedDuration();

  const handleSubmit = async () => {
    if (!date || !shiftId || !timeStart || !dateEnd || !timeEnd || !departmentId || !machineId || !problemCategoryId || !categoryId || !attendedBy || !submittedBy || problemDescription.length < 5 || actionTaken.length < 5) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly.');
      return;
    }
    if (unitList.length > 0 && !unitId) {
      Alert.alert('Validation Error', 'Unit is required for this machine.');
      return;
    }
    if (shiftError) {
      Alert.alert('Validation Error', 'Please enter a valid start time for the selected shift.');
      return;
    }
    if (duration.mins <= 0) {
      Alert.alert('Validation Error', 'End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date, shift: shiftId, machineType: departmentId, machineName: machineId, unit: unitId,
        problemType: problemCategoryId, category: categoryId, problemReported, description: problemDescription,
        actionTaken, rootCause, timeStart: timeStart.length === 5 ? `${timeStart}:00` : timeStart,
        timeEnd: timeEnd.length === 5 ? `${timeEnd}:00` : timeEnd, dateEnd, durationMin: String(duration.mins),
        attendedBy, additionalTeam: additionalTeam.join(', ') || null, submittedBy, spareConsumed, remarks
      };
      const res = await api.post('/breakdowns/create', payload);
      Alert.alert('Success', `Breakdown logged! Ref: ${res.data?.data?.refId || 'OK'}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit breakdown.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Breakdown Entry</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}><Ionicons name="time" size={16}/>  When</Text>
          <View style={styles.row}>
            <PremiumInput label="Start Date" value={date} onChangeText={setDate} style={{ flex: 1, marginRight: 8 }} required placeholder="YYYY-MM-DD" />
            <PremiumSelect 
              label="Shift" value={shiftId} options={SHIFTS.map(s => ({label: s.name, value: s.id}))} 
              onSelect={handleShiftChange} style={{ flex: 1 }} required 
            />
          </View>
          <View style={styles.row}>
            <PremiumInput label="Time Start" value={timeStart} onChangeText={handleTimeStart} error={shiftError || ''} style={{ flex: 1, marginRight: 8 }} required placeholder="HH:MM" />
            <PremiumInput label="Time End" value={timeEnd} onChangeText={setTimeEnd} style={{ flex: 1 }} required placeholder="HH:MM" />
          </View>
          <PremiumInput label="End Date" value={dateEnd} onChangeText={setDateEnd} required placeholder="YYYY-MM-DD" />
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Calculated Duration:</Text>
            <Text style={styles.durationText}>{duration.txt}</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}><Ionicons name="settings" size={16}/>  Machine Details</Text>
          <PremiumSelect label="Machine Type" value={departmentId} options={DEPARTMENTS.map(d => ({label: d, value: d}))} onSelect={setDepartmentId} required />
          <PremiumSelect label="Machine Name" value={machineId} options={machineNames.map(m => ({label: m, value: m}))} onSelect={setMachineId} required disabled={!departmentId} />
          <PremiumSelect label="Unit / Section" value={unitId} options={unitList.map(u => ({label: u, value: u}))} onSelect={setUnitId} required={unitList.length > 0} disabled={unitList.length === 0} />
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}><Ionicons name="alert-circle" size={16}/>  Problem Details</Text>
          <View style={styles.row}>
            <PremiumSelect label="Problem Type" value={problemCategoryId} options={PROBLEM_TYPES.map(p => ({label: p, value: p}))} onSelect={setProblemCategoryId} style={{ flex: 1, marginRight: 8 }} required />
            <PremiumSelect label="Category" value={categoryId} options={CATEGORIES.map(c => ({label: c, value: c}))} onSelect={setCategoryId} style={{ flex: 1 }} required />
          </View>
          <PremiumInput label="Problem Reported By" value={problemReported} onChangeText={setProblemReported} placeholder="Optional" />
          <PremiumInput label="Description of Problem" value={problemDescription} onChangeText={setProblemDescription} required multiline maxLength={300} placeholder="What happened..." />
          <PremiumInput label="Action Taken" value={actionTaken} onChangeText={setActionTaken} required multiline maxLength={300} placeholder="What was done to fix it..." />
          <PremiumInput label="Root Cause" value={rootCause} onChangeText={setRootCause} multiline maxLength={200} placeholder="Optional root cause..." />
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}><Ionicons name="people" size={16}/>  Personnel & Extras</Text>
          <View style={styles.row}>
            <PremiumSelect label="Attended By" value={attendedBy} options={TECHNICIANS.map(t => ({label: t, value: t}))} onSelect={setAttendedBy} style={{ flex: 1, marginRight: 8 }} required />
            <PremiumSelect label="Submitted By" value={submittedBy} options={TECHNICIANS.map(t => ({label: t, value: t}))} onSelect={setSubmittedBy} style={{ flex: 1 }} required />
          </View>
          <PremiumMultiSelect label="Additional Team Members" values={additionalTeam} options={TECHNICIANS.map(t => ({label: t, value: t}))} onSelect={setAdditionalTeam} placeholder="Select co-workers..." />
          <PremiumInput label="Spares Consumed" value={spareConsumed} onChangeText={setSpareConsumed} multiline placeholder="e.g. Bearing 6205 x2" />
          <PremiumInput label="Remarks" value={remarks} onChangeText={setRemarks} multiline placeholder="Optional notes" />
        </GlassCard>

        <GlowButton 
          title={isSubmitting ? "Submitting..." : "Submit Maintenance Log"} 
          onPress={handleSubmit} 
          color={COLORS.success}
          disabled={isSubmitting}
          style={{ marginBottom: 40, paddingVertical: 16 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: SIZES.padding * 2.5, paddingBottom: SIZES.padding, paddingHorizontal: SIZES.padding,
    backgroundColor: 'rgba(15, 23, 42, 0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  backBtn: { padding: 8 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  scroll: { padding: SIZES.padding },
  section: { padding: SIZES.padding, marginBottom: 20 },
  sectionTitle: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  row: { flexDirection: 'row' },
  durationBox: { backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  durationLabel: { color: COLORS.warning, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  durationText: { color: COLORS.warning, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
});
