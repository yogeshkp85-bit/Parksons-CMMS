import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, TYPOGRAPHY, SIZES } from '../components/Theme';
import { GlassCard, Badge, PremiumSelect, GlowButton } from '../components/premium';

const screenWidth = Dimensions.get('window').width;

const MONTH_ORDER = [
  'Apr-23','May-23','Jun-23','Jul-23','Aug-23','Sep-23','Oct-23','Nov-23','Dec-23',
  'Jan-24','Feb-24','Mar-24','Apr-24','May-24','Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24',
  'Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25',
  'Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26'
];

const CATEGORY_COLORS: Record<string, string> = {
  'Breakdown': '#e84040',
  'Preventive': '#3b82f6',
  'Corrective': '#f59e0b',
  'Operational': '#10b981',
  'Predictive': '#8b5cf6',
  'Planning': '#64748b'
};

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [genTime, setGenTime] = useState('');

  // Filters State
  const [fFY, setFFY] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fDept, setFDept] = useState('');
  const [fMachine, setFMachine] = useState('');
  const [fCat, setFCat] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      if (res.data?.data) {
        const rows = res.data.data.rows || [];
        // Map FY to rows
        const rowsWithFY = rows.map((r: any) => {
          let fy = 'Unknown';
          if (r.date) {
            const parts = r.date.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              fy = month >= 4 ? `FY ${year}-${year + 1}` : `FY ${year - 1}-${year}`;
            }
          }
          return { ...r, fy };
        });

        setAllRows(rowsWithFY);
        if (res.data.data.generated) {
          setGenTime(new Date(res.data.data.generated).toLocaleString('en-IN', {
            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  // Extract dynamic filter options from dataset
  const filterOptions = useMemo(() => {
    const fys = new Set<string>();
    const months = new Set<string>();
    const depts = new Set<string>();
    const machines = new Set<string>();
    const cats = new Set<string>();

    allRows.forEach((r) => {
      if (r.fy) fys.add(r.fy);
      if (r.monthYear) months.add(r.monthYear);
      if (r.machineType) depts.add(r.machineType);
      if (r.machineName) machines.add(r.machineName);
      if (r.category) cats.add(r.category);
    });

    const sortMonthOptions = (arr: string[]) => {
      return arr.sort((a, b) => {
        const ia = MONTH_ORDER.indexOf(a);
        const ib = MONTH_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    };

    return {
      fys: Array.from(fys).sort().reverse(),
      months: sortMonthOptions(Array.from(months)),
      depts: Array.from(depts).sort(),
      machines: Array.from(machines).sort(),
      cats: Array.from(cats).sort(),
    };
  }, [allRows]);

  // Apply filters
  const rows = useMemo(() => {
    return allRows.filter((r) => {
      return (
        (!fFY || r.fy === fFY) &&
        (!fMonth || r.monthYear === fMonth) &&
        (!fDept || r.machineType === fDept) &&
        (!fMachine || r.machineName === fMachine) &&
        (!fCat || r.category === fCat)
      );
    });
  }, [allRows, fFY, fMonth, fDept, fMachine, fCat]);

  const resetFilters = () => {
    setFFY(''); setFMonth(''); setFDept(''); setFMachine(''); setFCat('');
  };

  const hasActiveFilters = fFY || fMonth || fDept || fMachine || fCat;

  // KPIs Math
  const kpis = useMemo(() => {
    const bd = rows.filter(r => r.category === 'Breakdown' || r.category === 'Breakdown Log');
    const bdc = bd.length;
    const totMin = rows.reduce((s, r) => s + (r.minutes || 0), 0);
    const bdMin = bd.reduce((s, r) => s + (r.minutes || 0), 0);
    
    const mttr = bdc > 0 ? bdMin / bdc : 0;

    const mm: Record<string, { av: number; bm: number; bc: number }> = {};
    rows.forEach((r) => {
      const k = `${r.machineName}|${r.monthYear}`;
      if (!mm[k]) mm[k] = { av: r.availableMin || 44640, bm: 0, bc: 0 };
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        mm[k].bm += r.minutes;
        mm[k].bc++;
      }
    });
    
    const mtbfL: number[] = [];
    Object.keys(mm).forEach(k => {
      if (mm[k].bc > 0) mtbfL.push((mm[k].av - mm[k].bm) / mm[k].bc);
    });
    const mtbf = mtbfL.length > 0 ? mtbfL.reduce((a, b) => a + b, 0) / mtbfL.length : 0;

    const ad: Record<string, { d: number; a: number }> = {};
    rows.forEach((r) => {
      const k = `${r.machineName}|${r.monthYear}`;
      if (!ad[k]) ad[k] = { d: 0, a: r.availableMin || 44640 };
      ad[k].d += r.minutes || 0;
    });
    
    const al = Object.keys(ad).map(k => Math.min(100, Math.max(0, ((ad[k].a - ad[k].d) / ad[k].a) * 100)));
    const avgA = al.length > 0 ? al.reduce((a, b) => a + b, 0) / al.length : 100;

    const bdPct = (mtbf + mttr) > 0 ? (mttr / (mtbf + mttr)) * 100 : 0;

    return {
      mttr: mttr > 0 ? Math.round(mttr) : 0,
      mtbf: mtbf > 0 ? (mtbf / 60).toFixed(1) : 0,
      downtime: (totMin / 60).toFixed(1),
      bdCount: bdc,
      availability: avgA.toFixed(2),
      bdPct: (mtbf + mttr) > 0 ? bdPct.toFixed(1) : 0,
    };
  }, [rows]);

  // Lists
  const recentTable = useMemo(() => [...rows].reverse().slice(0, 50), [rows]);
  const topDownTable = useMemo(() => [...rows].sort((a, b) => (b.minutes || 0) - (a.minutes || 0)).slice(0, 50), [rows]);

  // Chart Data
  const charts = useMemo(() => {
    const md: Record<string, number> = {};
    const bdc: Record<string, number> = {};
    rows.forEach(r => {
      const m = r.monthYear || 'Unknown';
      md[m] = (md[m] || 0) + ((r.minutes || 0) / 60);
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        bdc[m] = (bdc[m] || 0) + 1;
      }
    });
    const sortedMonths = Object.keys(md).sort((a,b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)).slice(-6);
    
    const catMap: Record<string, number> = {};
    rows.forEach(r => { if(r.category) catMap[r.category] = (catMap[r.category] || 0) + 1; });
    const pieData = Object.keys(catMap).map((k) => ({
      name: k,
      population: catMap[k],
      color: CATEGORY_COLORS[k] || '#94a3b8',
      legendFontColor: '#cbd5e1',
      legendFontSize: 10
    }));

    const mach: Record<string, number> = {};
    rows.forEach(r => {
      if (r.category === 'Breakdown' || r.category === 'Breakdown Log') {
        const mc = r.machineName || '--';
        mach[mc] = (mach[mc] || 0) + 1;
      }
    });
    const topMachs = Object.keys(mach).sort((a,b) => mach[b] - mach[a]).slice(0,5);

    return {
      months: sortedMonths.length ? sortedMonths : ['None'],
      downtimeValues: sortedMonths.length ? sortedMonths.map(m => md[m]) : [0],
      bdCountValues: sortedMonths.length ? sortedMonths.map(m => bdc[m] || 0) : [0],
      pieData: pieData.length ? pieData : [{name: 'No Data', population: 1, color: '#334155', legendFontColor: '#fff', legendFontSize: 12}],
      machLabels: topMachs.length ? topMachs.map(m => m.substring(0, 8)) : ['None'],
      machValues: topMachs.length ? topMachs.map(m => mach[m]) : [0]
    };
  }, [rows]);

  const chartConfig = {
    backgroundColor: '#0f172a',
    backgroundGradientFrom: '#0f172a',
    backgroundGradientTo: '#1e293b',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#06b6d4" }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CMMS Intelligence</Text>
          <Text style={styles.subtitle}>{genTime ? `Refreshed: ${genTime}` : 'Pulling data...'}</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity 
            style={[styles.syncBtn, hasActiveFilters && { borderColor: COLORS.warning, backgroundColor: `${COLORS.warning}15` }]} 
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color={hasActiveFilters ? COLORS.warning : COLORS.primary} />
          </TouchableOpacity>
          <View style={{width: 8}} />
          <TouchableOpacity style={styles.syncBtn} onPress={loadDashboard}>
            <Ionicons name="sync" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dashboard Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: SIZES.padding }}>
              <PremiumSelect 
                label="Financial Year" value={fFY} 
                options={[{label: 'All FYs', value: ''}, ...filterOptions.fys.map(f => ({label: f, value: f}))]} 
                onSelect={setFFY} 
              />
              <PremiumSelect 
                label="Month" value={fMonth} 
                options={[{label: 'All Months', value: ''}, ...filterOptions.months.map(m => ({label: m, value: m}))]} 
                onSelect={setFMonth} 
              />
              <PremiumSelect 
                label="Department" value={fDept} 
                options={[{label: 'All Departments', value: ''}, ...filterOptions.depts.map(d => ({label: d, value: d}))]} 
                onSelect={setFDept} 
              />
              <PremiumSelect 
                label="Machine" value={fMachine} 
                options={[{label: 'All Machines', value: ''}, ...filterOptions.machines.map(m => ({label: m, value: m}))]} 
                onSelect={setFMachine} 
              />
              <PremiumSelect 
                label="Category" value={fCat} 
                options={[{label: 'All Categories', value: ''}, ...filterOptions.cats.map(c => ({label: c, value: c}))]} 
                onSelect={setFCat} 
              />
              
              <View style={{ flexDirection: 'row', marginTop: 10, paddingBottom: 40 }}>
                <GlowButton title="Reset" onPress={resetFilters} color={COLORS.textMuted} style={{ flex: 1, marginRight: 8 }} />
                <GlowButton title="Apply" onPress={() => setShowFilters(false)} color={COLORS.primary} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* KPI GRID */}
            <View style={styles.kpiGrid}>
              <GlassCard style={styles.kpiCard} glowColor={COLORS.danger}>
                <Ionicons name="warning" size={16} color={COLORS.danger} />
                <Text style={styles.kpiValue}>{kpis.bdCount}</Text>
                <Text style={styles.kpiLabel}>Breakdowns</Text>
              </GlassCard>
              <GlassCard style={styles.kpiCard} glowColor={COLORS.warning}>
                <Ionicons name="time" size={16} color={COLORS.warning} />
                <Text style={styles.kpiValue}>{kpis.downtime}h</Text>
                <Text style={styles.kpiLabel}>Total Downtime</Text>
              </GlassCard>
              <GlassCard style={styles.kpiCard} glowColor={COLORS.primary}>
                <Ionicons name="build" size={16} color={COLORS.primary} />
                <Text style={styles.kpiValue}>{kpis.mttr}m</Text>
                <Text style={styles.kpiLabel}>Avg MTTR</Text>
              </GlassCard>
              <GlassCard style={styles.kpiCard} glowColor={COLORS.primary}>
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
                <Text style={styles.kpiValue}>{kpis.mtbf}h</Text>
                <Text style={styles.kpiLabel}>Avg MTBF</Text>
              </GlassCard>
              <GlassCard style={styles.kpiCard} glowColor={COLORS.danger}>
                <Ionicons name="pie-chart" size={16} color={COLORS.danger} />
                <Text style={styles.kpiValue}>{kpis.bdPct}%</Text>
                <Text style={styles.kpiLabel}>Breakdown %</Text>
              </GlassCard>
              <GlassCard style={styles.kpiCard} glowColor={COLORS.success}>
                <Ionicons name="pulse" size={16} color={COLORS.success} />
                <Text style={styles.kpiValue}>{kpis.availability}%</Text>
                <Text style={styles.kpiLabel}>Availability</Text>
              </GlassCard>
            </View>

            {/* CHARTS */}
            <Text style={styles.sectionTitle}>Performance Analytics</Text>
            
            <GlassCard style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>Downtime Trend (Hrs)</Text>
              <BarChart
                data={{ labels: charts.months, datasets: [{ data: charts.downtimeValues }] }}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix="h"
                chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`}}
                style={{ borderRadius: 12, marginVertical: 8 }}
                showValuesOnTopOfBars
              />
            </GlassCard>

            <GlassCard style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>Breakdown Frequency</Text>
              <LineChart
                data={{ labels: charts.months, datasets: [{ data: charts.bdCountValues }] }}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`}}
                style={{ borderRadius: 12, marginVertical: 8 }}
                bezier
              />
            </GlassCard>

            <GlassCard style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>Category Distribution</Text>
              <PieChart
                data={charts.pieData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                absolute
              />
            </GlassCard>

            <GlassCard style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>Top 5 Problem Machines</Text>
              <BarChart
                data={{ labels: charts.machLabels, datasets: [{ data: charts.machValues }] }}
                width={screenWidth - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`}}
                style={{ borderRadius: 12, marginVertical: 8 }}
                verticalLabelRotation={30}
              />
            </GlassCard>

            {/* CAROUSELS */}
            <Text style={styles.sectionTitle}>Highest Downtime Events (Top 50)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {topDownTable.slice(0, 15).map((item, idx) => (
                <TouchableOpacity key={idx} onPress={() => navigation.navigate('BreakdownDetails', { breakdown: item })}>
                  <GlassCard style={styles.carouselCard} glowColor={COLORS.danger}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardId}>{item.refId}</Text>
                      <Badge label={`${item.minutes} min`} color={COLORS.danger} />
                    </View>
                    <Text style={styles.cardTitle}>{item.machineName}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.problemType || item.description}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Recent Logs (Last 50)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {recentTable.slice(0, 15).map((item, idx) => (
                <TouchableOpacity key={idx} onPress={() => navigation.navigate('BreakdownDetails', { breakdown: item })}>
                  <GlassCard style={styles.carouselCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardId}>{item.refId}</Text>
                      <Text style={styles.cardDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.machineName}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.problemType || item.description}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </ScrollView>

          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 2.5,
    paddingBottom: SIZES.padding,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  title: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5 },
  subtitle: { color: COLORS.textMuted, fontSize: 10, marginTop: 4, fontFamily: 'monospace' },
  headerBtns: { flexDirection: 'row' },
  syncBtn: { padding: 8, backgroundColor: `${COLORS.primary}15`, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.primary}40` },
  scrollContent: { padding: SIZES.padding, paddingBottom: 100 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  kpiCard: { width: '31%', marginBottom: 12, padding: 10, alignItems: 'center' },
  kpiValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  kpiLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 12, letterSpacing: 0.5 },
  
  chartWrapper: { marginBottom: 16, padding: 12 },
  chartTitle: { color: COLORS.text, fontSize: 13, fontWeight: 'bold', marginBottom: 8, opacity: 0.9 },
  
  carousel: { paddingBottom: 16, marginHorizontal: -SIZES.padding, paddingHorizontal: SIZES.padding },
  carouselCard: { width: 260, marginRight: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
  cardDate: { color: COLORS.textMuted, fontSize: 10 },
  cardTitle: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  cardDesc: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
});
