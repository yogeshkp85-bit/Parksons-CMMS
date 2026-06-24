import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import api from '../services/api';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

const ROLES = [
  { id: 'superadmin', name: 'Super Admin' },
  { id: 'admin', name: 'Admin' },
  { id: 'manager', name: 'Manager' },
  { id: 'supervisor', name: 'Supervisor' },
  { id: 'technician', name: 'Technician' },
  { id: 'viewer', name: 'Viewer' }
];

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add user screen/modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('supervisor');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      // Response format: { success: true, data: { status: 'success', users: [...] } }
      if (data && data.success && data.data && data.data.users) {
        setUsers(data.data.users);
      } else if (data && data.users) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setLevel('supervisor');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields (Name, Email, and Password).');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/users/create', {
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        level
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'User created successfully.');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to create user.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (userEmail: string) => {
    const targetEmail = userEmail.trim().toLowerCase();
    if (targetEmail === 'yogeshkp85@gmail.com') {
      Alert.alert('Action Denied', 'The system protectively prevents deleting the core Super Admin.');
      return;
    }

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user ${userEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/users/${encodeURIComponent(targetEmail)}`);
              if (response.data && response.data.success) {
                Alert.alert('Success', 'User deleted successfully.');
                fetchUsers();
              } else {
                Alert.alert('Error', response.data?.message || 'Failed to delete user.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user.');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {isModalOpen ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. John Doe" 
            placeholderTextColor={COLORS.placeholder} 
            value={name} 
            onChangeText={setName} 
          />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. john@parksons.com" 
            placeholderTextColor={COLORS.placeholder} 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email} 
            onChangeText={setEmail} 
          />

          <Text style={styles.label}>Password *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Min 6 characters" 
            placeholderTextColor={COLORS.placeholder} 
            secureTextEntry
            autoCapitalize="none"
            value={password} 
            onChangeText={setPassword} 
          />

          <Text style={styles.label}>Role / Level *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[styles.chip, level === role.id && styles.activeChip]}
                onPress={() => setLevel(role.id)}
              >
                <Text style={[styles.chipText, level === role.id && styles.activeChipText]}>
                  {role.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>CREATE USER</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.headerRow}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search users..."
              placeholderTextColor={COLORS.placeholder}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleOpenModal}>
              <Text style={styles.addBtnText}>+ Add User</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.email}
              ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardEmail}>{item.email}</Text>
                    </View>
                    <View style={styles.roleBadgeContainer}>
                      <Text style={styles.roleBadgeText}>
                        {ROLES.find(r => r.id === item.level)?.name || item.level || 'Technician'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.rowEnd, { marginTop: 12 }]}>
                    {item.email !== 'yogeshkp85@gmail.com' && (
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.email)}>
                        <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    )}
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
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  roleBadgeContainer: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: 'bold',
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
    marginTop: 12,
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
    marginBottom: 16,
    paddingVertical: 4,
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
