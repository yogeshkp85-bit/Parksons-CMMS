import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, TYPOGRAPHY } from '../components/Theme';
import { GlassCard, GlowButton } from '../components/premium';

export default function MenuScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const menuItems = [
    { title: 'Report Breakdown', icon: 'warning', route: 'BreakdownForm', color: COLORS.danger },
    { title: 'Preventive Maintenance', icon: 'calendar', route: 'PreventiveMaintenance', color: COLORS.primary },
    { title: 'Admin Approval Queue', icon: 'checkmark-circle', route: 'AdminApproval', color: COLORS.success },
    { title: 'Analytics & Reports', icon: 'bar-chart', route: 'Reports', color: COLORS.secondary },
    { title: 'Machine Master', icon: 'hardware-chip', route: 'MachineMaster', color: COLORS.warning },
    { title: 'User Management', icon: 'people', route: 'UserManagement', color: '#a855f7' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.h1}>Menu</Text>
        <Text style={styles.subtitle}>Access all CMMS modules</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.cardWrapper}
            onPress={() => navigation.navigate(item.route)}
          >
            <GlassCard style={styles.card} glowColor={item.color}>
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutWrapper}>
        <GlowButton 
          title="Log Out" 
          color={COLORS.danger} 
          onPress={logout}
          style={{ paddingVertical: 14 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    padding: SIZES.padding,
    paddingTop: SIZES.padding * 3,
    paddingBottom: SIZES.padding * 1.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SIZES.padding / 2,
  },
  cardWrapper: {
    width: '50%',
    padding: SIZES.padding / 2,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    minHeight: 140,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  logoutWrapper: {
    padding: SIZES.padding,
    marginTop: 20,
    marginBottom: 40,
  }
});
