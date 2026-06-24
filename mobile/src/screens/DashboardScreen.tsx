import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { getPendingBreakdowns, getDB, OfflineBreakdown } from '../services/db';
import { COLORS, TYPOGRAPHY } from '../components/Theme';
import { hasPermission } from '../utils/permissions';

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const { unreadCount, clearUnread } = useNotifications();
  
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [breakdowns, setBreakdowns] = useState<any[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'PENDING_REVIEW' | 'IN_PROGRESS' | 'APPROVED'>('PENDING_REVIEW');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const drawerItems = [
    { label: 'Dashboard', screen: 'Dashboard', icon: '📊', permission: 'Dashboard' },
    { label: 'Report Breakdown', screen: 'BreakdownForm', icon: '⚠️', permission: 'Create' },
    { label: 'Scan Code', screen: 'QRScanner', icon: '🔍', permission: 'Create' },
    { label: 'Admin Review Queue', screen: 'AdminApproval', icon: '📝', permission: 'Approve' },
    { label: 'Preventive Maintenance', screen: 'PreventiveMaintenance', icon: '🔧', permission: 'PreventiveMaintenance' },
    { label: 'Machine Master', screen: 'MachineMaster', icon: '🏭', permission: 'Masters' },
    { label: 'Analytics & Reports', screen: 'Reports', icon: '📈', permission: 'Reports' },
    { label: 'User Management', screen: 'UserManagement', icon: '👥', permission: 'Users' }
  ];

  // Monitor Network
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const fetchBreakdowns = async () => {
    // Fetch offline local draft count
    const pendingDrafts = getPendingBreakdowns();
    setOfflineCount(pendingDrafts.length);

    if (!isOnline) {
      // Offline mode: Load from local SQLite db if available, or show message
      const db = getDB();
      const localData = db.getAllSync<any>(`SELECT * FROM offline_breakdowns`);
      // Adapt to local rendering
      const adapted = localData.map(d => ({
        id: d.id,
        breakdownNumber: `DRAFT-${d.id.substring(0, 5)}`,
        machine: { name: d.machineName },
        problemDescription: d.description,
        status: d.status,
        timeStart: d.createdAt,
      }));
      setBreakdowns(adapted);
      return;
    }

    setLoading(true);
    try {
      // In CMMS, technician breakdowns can be fetched via reports or pending approval
      const response = await api.get('/breakdowns/pending');
      const list = response.data.data?.all || response.data.data || [];
      setBreakdowns(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.warn('Failed to load online breakdowns', error);
      // Fallback to local SQLite cache
      const db = getDB();
      const localData = db.getAllSync<any>(`SELECT * FROM offline_breakdowns`);
      setBreakdowns(localData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdowns();
  }, [isOnline, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBreakdowns();
    setRefreshing(false);
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please connect to the internet.');
      return;
    }

    const drafts = getPendingBreakdowns();
    if (drafts.length === 0) {
      Alert.alert('No Drafts', 'There are no pending offline drafts to sync.');
      return;
    }

    setLoading(true);
    let successCount = 0;
    
    for (const draft of drafts) {
      try {
        // Upload draft to server
        await api.post('/breakdowns/create', {
          machineName: draft.machineName,
          shift: draft.shift,
          category: draft.category,
          problemType: draft.problemType,
          description: draft.description,
          priority: draft.priority,
          timeStart: draft.createdAt,
        });
        
        // Remove from local SQLite database on successful upload
        const db = getDB();
        db.runSync(`DELETE FROM offline_breakdowns WHERE id = ?`, [draft.id]);
        successCount++;
      } catch (err) {
        console.error('Failed syncing draft', draft.id, err);
      }
    }

    setLoading(false);
    Alert.alert('Sync Finished', `Successfully synchronized ${successCount} breakdowns to the server.`);
    fetchBreakdowns();
  };

  const filteredBreakdowns = breakdowns.filter(b => {
    // If local database format, status might be PENDING_SYNC
    if (b.status === 'PENDING_SYNC') return activeTab === 'PENDING_REVIEW';
    return b.status === activeTab;
  });

  return (
    <View style={styles.container}>
      {/* Custom Drawer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDrawerOpen}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsDrawerOpen(false)} 
          />
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerUser}>{user?.name || 'User'}</Text>
              <Text style={styles.drawerRole}>{String(user?.level || 'technician').toUpperCase()}</Text>
            </View>
            <ScrollView style={styles.drawerMenuItems}>
              {drawerItems
                .filter(item => hasPermission(user?.level || 'viewer', item.permission))
                .map(item => (
                  <TouchableOpacity
                    key={item.screen}
                    style={styles.drawerItem}
                    onPress={() => {
                      setIsDrawerOpen(false);
                      if (item.screen !== 'Dashboard') {
                        navigation.navigate(item.screen);
                      }
                    }}
                  >
                    <Text style={styles.drawerItemIcon}>{item.icon}</Text>
                    <Text style={styles.drawerItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>
            <TouchableOpacity style={styles.drawerLogout} onPress={() => { setIsDrawerOpen(false); logout(); }}>
              <Text style={styles.drawerLogoutText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Top Header Bar */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsDrawerOpen(true)}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parksons CMMS</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Network Status Banner */}
      {!isOnline && (
        <View style={[styles.networkBanner, { backgroundColor: COLORS.danger }]}>
          <Text style={styles.networkBannerText}>⚠️ Offline Mode (Drafts saved locally)</Text>
        </View>
      )}

      {isOnline && offlineCount > 0 && (
        <TouchableOpacity style={[styles.networkBanner, { backgroundColor: COLORS.warning }]} onPress={handleSync}>
          <Text style={styles.networkBannerText}>🔄 You have {offlineCount} unsynced drafts. Tap to Sync.</Text>
        </TouchableOpacity>
      )}

      {/* Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userText}>{user?.name || 'Technician'} ({user?.level})</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardVal}>{breakdowns.length}</Text>
          <Text style={styles.cardLabel}>All Tasks</Text>
        </View>
        <View style={[styles.card, { borderColor: COLORS.primary }]}>
          <Text style={styles.cardVal}>{unreadCount}</Text>
          <Text style={styles.cardLabel}>New Alerts</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={clearUnread} style={styles.clearBadge}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabsContainer}>
        {(['PENDING_REVIEW', 'IN_PROGRESS', 'APPROVED'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Breakdowns List */}
      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBreakdowns}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No breakdown reports found in this category.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.breakdownItem}
              onPress={() => navigation.navigate('BreakdownDetails', { breakdownId: item.id })}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.refIdText}>{item.breakdownNumber}</Text>
                <Text style={[styles.statusTag, { color: item.status === 'APPROVED' ? COLORS.success : COLORS.warning }]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.machineText}>Machine: {item.machine?.name || 'Unknown'}</Text>
              <Text style={styles.descText} numberOfLines={2}>{item.problemDescription}</Text>
              <Text style={styles.dateText}>
                Started: {new Date(item.timeStart || item.startTime).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: COLORS.secondary, marginRight: 12 }]} 
          onPress={() => navigation.navigate('QRScanner')}
        >
          <Text style={styles.fabText}>[QR]</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('BreakdownForm')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  networkBanner: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  userText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  cardVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  clearBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clearText: {
    color: COLORS.text,
    fontSize: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
  breakdownItem: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refIdText: {
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 15,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  machineText: {
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 4,
  },
  descText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
  },
  fab: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  menuButton: {
    padding: 4,
  },
  menuButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  drawerContent: {
    width: 280,
    backgroundColor: COLORS.card,
    height: '100%',
    paddingTop: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  drawerHeader: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  drawerUser: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  drawerRole: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  drawerMenuItems: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  drawerItemIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  drawerItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  drawerLogout: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 20,
  },
  drawerLogoutText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
});
