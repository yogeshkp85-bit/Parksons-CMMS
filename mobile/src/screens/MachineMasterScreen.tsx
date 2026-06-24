import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Switch } from 'react-native';
import api from '../services/api';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

export default function MachineMasterScreen() {
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown lists
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Add/Edit screen states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [parentMachineId, setParentMachineId] = useState('');
  const [isSubAssembly, setIsSubAssembly] = useState(false);
  const [status, setStatus] = useState('ACTIVE');

  const [isProcessing, setIsProcessing] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config/masters');
      if (data) {
        setCategories(data.categories || []);
        setUnits(data.units || []);
      }
    } catch (err) {
      console.error('Failed to load config masters', err);
    }
  };

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/machines');
      setMachines(data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchConfig();
  }, []);

  const filtered = machines.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.machineId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.unit?.section?.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (machine: any = null) => {
    if (machine) {
      setEditingMachine(machine);
      setCode(machine.machineId || machine.code || '');
      setName(machine.name || '');
      setCategoryId(machine.machineCategoryId || '');
      setUnitId(machine.unitId || '');
      setSectionId(machine.sectionId || '');
      setParentMachineId(machine.parentMachineId || '');
      setIsSubAssembly(!!machine.isSubAssembly);
      setStatus(machine.status || 'ACTIVE');
    } else {
      setEditingMachine(null);
      setCode('');
      setName('');
      setCategoryId('');
      setUnitId('');
      setSectionId('');
      setParentMachineId('');
      setIsSubAssembly(false);
      setStatus('ACTIVE');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!code || !name || !categoryId || !unitId) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    
    setIsProcessing(true);
    const formData = {
      code,
      name,
      categoryId,
      unitId,
      sectionId,
      parentMachineId: isSubAssembly ? parentMachineId : undefined,
      isSubAssembly,
      status
    };

    try {
      if (editingMachine) {
        await api.put(`/machines/${editingMachine.id}`, formData);
        Alert.alert('Success', 'Machine updated successfully.');
      } else {
        await api.post('/machines', formData);
        Alert.alert('Success', 'Machine created successfully.');
      }
      setIsModalOpen(false);
      fetchMachines();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save machine');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this machine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/machines/${id}`);
              Alert.alert('Success', 'Machine deleted successfully.');
              fetchMachines();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete machine.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isModalOpen ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingMachine ? 'Edit Machine' : 'Add Machine'}</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Machine Code *</Text>
          <TextInput style={styles.input} placeholder="e.g. M-101" placeholderTextColor={COLORS.placeholder} value={code} onChangeText={setCode} />

          <Text style={styles.label}>Machine Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Heidelberg CD 102" placeholderTextColor={COLORS.placeholder} value={name} onChangeText={setName} />

          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, categoryId === c.id && styles.activeChip]}
                onPress={() => setCategoryId(c.id)}
              >
                <Text style={[styles.chipText, categoryId === c.id && styles.activeChipText]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Unit *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {units.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.chip, unitId === u.id && styles.activeChip]}
                onPress={() => {
                  setUnitId(u.id);
                  setSectionId(u.sectionId || '');
                }}
              >
                <Text style={[styles.chipText, unitId === u.id && styles.activeChipText]}>{u.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Is this a Sub-Assembly?</Text>
            <Switch
              value={isSubAssembly}
              onValueChange={setIsSubAssembly}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={isSubAssembly ? '#FFFFFF' : '#7f8c8d'}
            />
          </View>

          {isSubAssembly && (
            <View>
              <Text style={styles.label}>Select Parent Machine *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {machines
                  .filter((m) => !m.isSubAssembly && m.id !== editingMachine?.id)
                  .map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, parentMachineId === m.id && styles.activeChip]}
                      onPress={() => setParentMachineId(m.id)}
                    >
                      <Text style={[styles.chipText, parentMachineId === m.id && styles.activeChipText]}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>Status</Text>
          <View style={styles.tabsRow}>
            {['ACTIVE', 'INACTIVE', 'SCRAPPED'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.tabButton, status === s && styles.activeTabButton]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.tabButtonText, status === s && styles.activeTabButtonText]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>SAVE MACHINE</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.headerRow}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search machines..."
              placeholderTextColor={COLORS.placeholder}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No machines found.</Text>}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      {item.isSubAssembly && <Text style={styles.subAssemblyBadge}>Sub-Assembly</Text>}
                    </View>
                    <Text style={styles.cardCode}>{item.machineId || item.code}</Text>
                  </View>
                  <Text style={styles.cardText}><Text style={styles.bold}>Dept/Unit:</Text> {item.unit?.section?.department?.name || 'General'} ({item.unit?.name || 'No unit'})</Text>
                  <Text style={styles.cardText}><Text style={styles.bold}>Hierarchy:</Text> {item.parentMachine ? `Child of ${item.parentMachine.name}` : 'Parent'}</Text>
                  
                  <View style={styles.rowBetween}>
                    <Text style={[styles.statusTag, item.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
                      {item.status}
                    </Text>
                    <View style={styles.row}>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenModal(item)}>
                        <Text style={styles.iconText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleDelete(item.id)}>
                        <Text style={[styles.iconText, { color: COLORS.danger }]}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
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
  cardCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'monospace',
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
  subAssemblyBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    color: '#00d4ff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: COLORS.success,
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: COLORS.danger,
  },
  row: {
    flexDirection: 'row',
  },
  iconBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  iconText: {
    fontSize: 11,
    color: COLORS.text,
  },
  formContainer: {
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
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 10,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    ...TYPOGRAPHY.buttonText,
  },
});
