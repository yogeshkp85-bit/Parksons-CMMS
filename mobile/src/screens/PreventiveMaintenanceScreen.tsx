import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, TYPOGRAPHY } from '../components/Theme';
import { GlassCard, Badge } from '../components/premium';
import api from '../services/api';
import { Calendar } from 'react-native-calendars';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function PreventiveMaintenanceScreen({ navigation }: any) {
  const [activeMainTab, setActiveMainTab] = useState<'calendar' | 'schedules' | 'tasks' | 'frequencies' | 'compliance'>('calendar');
  
  // Data States
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [frequencies, setFrequencies] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  
  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeMainTab === 'schedules' || activeMainTab === 'calendar') {
        const res = await api.get('/pm/schedules');
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setSchedules(data.filter((s: any) => !s.deletedAt));
      } else if (activeMainTab === 'tasks') {
        const res = await api.get('/pm/tasks');
        setTasks(res.data || []);
      } else if (activeMainTab === 'frequencies') {
        const res = await api.get('/pm/frequencies');
        setFrequencies(res.data?.data || []);
      } else if (activeMainTab === 'compliance') {
        const res = await api.get('/pm/compliance');
        setCompliance(res.data?.data || null);
      }
    } catch (err) {
      console.log('Error fetching PM data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeMainTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Schedules processing
  const pendingCount = schedules.filter(s => s.status === 'PENDING').length;
  const completedCount = schedules.filter(s => s.status === 'COMPLETED').length;
  const overdueCount = schedules.filter(s => s.status === 'PENDING' && new Date(s.dueDate) < new Date()).length;
  const displayList = schedules.filter(s => s.status === scheduleTab).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const getUrgencyColor = (dateString: string) => {
    const due = new Date(dateString);
    const now = new Date();
    if (due < now) return COLORS.danger;
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 2) return COLORS.warning;
    return COLORS.success;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderScheduleCard = (schedule: any, idx: number, isListTabContext: boolean) => (
    <GlassCard key={idx} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Badge 
          text={schedule.pmTask?.frequency?.name || 'Task'} 
          color={schedule.status === 'COMPLETED' ? COLORS.success : getUrgencyColor(schedule.dueDate)} 
        />
        <Text style={styles.dateText}>
          {schedule.status === 'COMPLETED' ? `Completed: ${formatDate(schedule.completedAt)}` : `Due: ${formatDate(schedule.dueDate)}`}
        </Text>
      </View>
      
      <Text style={styles.machineName}>{schedule.machine?.name || 'Unknown Machine'}</Text>
      <Text style={styles.taskName}>{schedule.pmTask?.name || 'Maintenance Task'}</Text>
      
      {schedule.status === 'PENDING' && (
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('PMCompletion', { schedule })}
        >
          <Text style={styles.actionBtnText}>Start Execution</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preventive Maintenance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.mainTabsContainer}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {(['calendar', 'schedules', 'tasks', 'frequencies', 'compliance'] as const).map(t => (
          <TouchableOpacity 
            key={t}
            style={[styles.mainTabBtn, activeMainTab === t && styles.mainTabBtnActive]}
            onPress={() => setActiveMainTab(t)}
          >
            <Text style={[styles.mainTabText, activeMainTab === t && styles.mainTabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* SCHEDULES VIEW */}
            {activeMainTab === 'schedules' && (
              <>
                <View style={styles.kpiGrid}>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Pending</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.warning }]}>{pendingCount}</Text>
                  </GlassCard>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Overdue</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.danger }]}>{overdueCount}</Text>
                  </GlassCard>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Completed</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.success }]}>{completedCount}</Text>
                  </GlassCard>
                </View>

                <View style={styles.tabContainer}>
                  <TouchableOpacity 
                    style={[styles.tabBtn, scheduleTab === 'PENDING' && styles.tabBtnActive]} 
                    onPress={() => setScheduleTab('PENDING')}
                  >
                    <Text style={[styles.tabText, scheduleTab === 'PENDING' && styles.tabTextActive]}>Pending Tasks</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tabBtn, scheduleTab === 'COMPLETED' && styles.tabBtnActive]} 
                    onPress={() => setScheduleTab('COMPLETED')}
                  >
                    <Text style={[styles.tabText, scheduleTab === 'COMPLETED' && styles.tabTextActive]}>Completed Tasks</Text>
                  </TouchableOpacity>
                </View>

                {displayList.length === 0 ? (
                  <Text style={styles.emptyText}>No tasks found in this category.</Text>
                ) : (
                  displayList.map((s, idx) => renderScheduleCard(s, idx, true))
                )}
              </>
            )}

            {/* CALENDAR VIEW */}
            {activeMainTab === 'calendar' && (
              <View style={{ marginBottom: 20 }}>
                <Calendar
                  key={`cal-${schedules.length}-${selectedDate}`}
                  theme={{
                    backgroundColor: COLORS.card,
                    calendarBackground: COLORS.card,
                    textSectionTitleColor: COLORS.textMuted,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: COLORS.primary,
                    dayTextColor: COLORS.text,
                    textDisabledColor: COLORS.border,
                    dotColor: COLORS.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: COLORS.primary,
                    monthTextColor: COLORS.text,
                    indicatorColor: COLORS.primary,
                    textDayFontFamily: 'Inter-Medium',
                    textMonthFontFamily: 'Outfit-Bold',
                    textDayHeaderFontFamily: 'Inter-SemiBold',
                  }}
                  onDayPress={(day: any) => setSelectedDate(day.dateString)}
                  dayComponent={({ date, state }: any) => {
                    const daySchedules = schedules.filter(s => {
                      if (!s.dueDate) return false;
                      const d = new Date(s.dueDate);
                      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      return localDateStr === date.dateString || s.dueDate.startsWith(date.dateString);
                    });
                    const isSelected = date.dateString === selectedDate;
                    const isToday = date.dateString === new Date().toISOString().split('T')[0];
                    return (
                      <TouchableOpacity 
                        onPress={() => setSelectedDate(date.dateString)}
                        style={{
                          width: (screenWidth - 40) / 7,
                          minHeight: 65,
                          backgroundColor: isToday ? 'rgba(255,255,255,0.05)' : 'transparent',
                          borderWidth: isToday ? 1 : (isSelected ? 1 : 0),
                          borderColor: isToday ? COLORS.primary : (isSelected ? '#ffffff' : 'transparent'),
                          borderRadius: 6,
                          padding: 1,
                          overflow: 'hidden',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ 
                          color: state === 'disabled' ? COLORS.border : (isToday ? COLORS.primary : COLORS.text), 
                          fontFamily: 'Inter-SemiBold',
                          fontSize: 10,
                          marginBottom: 2
                        }}>
                          {date.day}
                        </Text>
                        <View style={{ width: '100%', paddingHorizontal: 1 }}>
                          {daySchedules.slice(0, 3).map((s, idx) => {
                            let bg = 'rgba(245,158,11,0.1)';
                            let border = 'rgba(245,158,11,0.3)';
                            let textC = COLORS.warning;
                            
                            if (s.status === 'COMPLETED') {
                              bg = 'rgba(16,185,129,0.1)'; border = 'rgba(16,185,129,0.3)'; textC = COLORS.success;
                            } else if (new Date(s.dueDate) < new Date()) {
                              bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.3)'; textC = COLORS.danger;
                            }
                            return (
                              <View key={idx} style={{ 
                                backgroundColor: bg, 
                                borderWidth: 1,
                                borderColor: border,
                                paddingVertical: 1,
                                paddingHorizontal: 2,
                                marginBottom: 2,
                                borderRadius: 3,
                                width: '100%'
                              }}>
                                <Text style={{ color: textC, fontSize: 6, fontFamily: 'Inter-SemiBold', lineHeight: 8 }} numberOfLines={1}>
                                  {s.machine?.name || s.machine?.machineName || 'PM'}
                                </Text>
                                <Text style={{ color: textC, fontSize: 5, opacity: 0.8, lineHeight: 6 }} numberOfLines={1}>
                                  {s.pmTask?.name || 'Task'}
                                </Text>
                              </View>
                            );
                          })}
                          {daySchedules.length > 3 && (
                            <Text style={{ color: COLORS.textMuted, fontSize: 6, textAlign: 'center' }}>+{daySchedules.length - 3}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                
                {selectedDate ? (
                  <View style={{ marginTop: 20 }}>
                    <Text style={{ color: COLORS.text, fontFamily: 'Outfit-Bold', fontSize: 16, marginBottom: 10 }}>
                      Tasks for {formatDate(selectedDate)}
                    </Text>
                    {schedules.filter(s => s.dueDate.startsWith(selectedDate)).length === 0 ? (
                       <Text style={styles.emptyText}>No tasks due on this date.</Text>
                    ) : (
                       schedules.filter(s => s.dueDate.startsWith(selectedDate)).map((s, idx) => renderScheduleCard(s, idx, false))
                    )}
                  </View>
                ) : null}
              </View>
            )}

            {/* TASKS VIEW */}
            {activeMainTab === 'tasks' && (
              <>
                {tasks.length === 0 ? (
                  <Text style={styles.emptyText}>No PM tasks found.</Text>
                ) : (
                  tasks.map((task, idx) => (
                    <GlassCard key={idx} style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <Badge text={task.frequency?.name || 'Freq'} color={COLORS.primary} />
                      </View>
                      <Text style={styles.machineName}>{task.name}</Text>
                      <Text style={styles.taskName}>{task.description || 'No description available'}</Text>
                      <Text style={styles.dateText}>Checkpoints: {task.checkpoints?.split('\n').length || 0}</Text>
                    </GlassCard>
                  ))
                )}
              </>
            )}

            {/* FREQUENCIES VIEW */}
            {activeMainTab === 'frequencies' && (
              <>
                {frequencies.length === 0 ? (
                  <Text style={styles.emptyText}>No frequencies found.</Text>
                ) : (
                  frequencies.map((freq, idx) => (
                    <GlassCard key={idx} style={styles.taskCard}>
                      <Text style={styles.machineName}>{freq.name} ({freq.code})</Text>
                      <Text style={styles.taskName}>Interval: {freq.intervalDays} Days</Text>
                    </GlassCard>
                  ))
                )}
              </>
            )}

            {/* COMPLIANCE VIEW */}
            {activeMainTab === 'compliance' && compliance && (
              <>
                <View style={styles.kpiGrid}>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Total Scheduled</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.text }]}>{compliance.totalScheduled}</Text>
                  </GlassCard>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Completed</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.success }]}>{compliance.completed || 0}</Text>
                  </GlassCard>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Overdue</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.danger }]}>{compliance.overdue || 0}</Text>
                  </GlassCard>
                  <GlassCard style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Compliance Rate</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.primary }]}>{compliance.complianceRate}%</Text>
                  </GlassCard>
                </View>

                <GlassCard style={[styles.taskCard, { alignItems: 'center' }]}>
                  <Text style={[styles.machineName, { marginBottom: 20 }]}>Status Distribution</Text>
                  <PieChart
                    data={[
                      { name: 'Completed', population: compliance.completed || 0, color: COLORS.success, legendFontColor: COLORS.text, legendFontSize: 12 },
                      { name: 'Pending', population: (compliance.pending || 0) - (compliance.overdue || 0), color: COLORS.warning, legendFontColor: COLORS.text, legendFontSize: 12 },
                      { name: 'Overdue', population: compliance.overdue || 0, color: COLORS.danger, legendFontColor: COLORS.text, legendFontSize: 12 }
                    ]}
                    width={screenWidth - 80}
                    height={160}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    center={[10, 0]}
                    absolute
                  />
                  <Text style={{ position: 'absolute', top: 110, left: (screenWidth-80)/2 - 40, color: COLORS.text, fontSize: 12, fontFamily: 'Outfit-Bold' }}>
                    {compliance.complianceRate}%
                  </Text>
                </GlassCard>

                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.machineName, { color: COLORS.danger, marginBottom: 10, fontSize: 16 }]}>
                    <Ionicons name="warning" size={16} color={COLORS.danger} /> Overdue Critical Schedules
                  </Text>
                  {compliance.schedules && compliance.schedules.filter((s: any) => s.status === 'PENDING' && new Date(s.dueDate) < new Date()).map((s: any, idx: number) => {
                    const diffDays = Math.ceil((new Date().getTime() - new Date(s.dueDate).getTime()) / (1000 * 3600 * 24));
                    return (
                      <GlassCard key={idx} style={[styles.taskCard, { borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Due: {formatDate(s.dueDate)}</Text>
                          <Text style={{ color: COLORS.danger, fontSize: 12, fontFamily: 'Outfit-Bold' }}>{diffDays} Days Overdue</Text>
                        </View>
                        <Text style={[styles.machineName, { fontSize: 16, marginTop: 5 }]}>{s.machine?.name || s.machine?.machineName || 'Unknown'}</Text>
                        <Text style={styles.taskName}>{s.pmTask?.name || 'General PM'}</Text>
                        <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: COLORS.success, marginTop: 10 }]} 
                          onPress={() => navigation.navigate('PMCompletion', { schedule: s })}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Mark Completed</Text>
                        </TouchableOpacity>
                      </GlassCard>
                    );
                  })}
                  {(!compliance.schedules || compliance.schedules.filter((s: any) => s.status === 'PENDING' && new Date(s.dueDate) < new Date()).length === 0) && (
                    <Text style={styles.emptyText}>No overdue schedules! Excellent work.</Text>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  menuBtn: { padding: 5 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontFamily: 'Outfit-Bold' },
  mainTabsContainer: {
    maxHeight: 50,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  mainTabBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 10,
  },
  mainTabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  mainTabText: {
    color: COLORS.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  mainTabTextActive: {
    color: COLORS.primary,
  },
  scroll: { padding: 20, paddingBottom: 100 },
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  kpiCard: { flex: 1, marginHorizontal: 5, padding: 15, alignItems: 'center' },
  kpiLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: 'Inter-Medium', marginBottom: 5 },
  kpiValue: { fontSize: 24, fontFamily: 'Outfit-Bold' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: COLORS.card },
  tabText: { color: COLORS.textMuted, fontFamily: 'Inter-SemiBold', fontSize: 14 },
  tabTextActive: { color: COLORS.primary },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter-Medium' },
  taskCard: { padding: 15, marginBottom: 15 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateText: { color: COLORS.textMuted, fontSize: 12, fontFamily: 'Inter-Medium' },
  machineName: { color: COLORS.primary, fontSize: 18, fontFamily: 'Outfit-Bold', marginBottom: 4 },
  taskName: { color: COLORS.text, fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 15 },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 14 }
});
