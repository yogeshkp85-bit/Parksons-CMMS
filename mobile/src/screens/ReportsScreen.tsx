import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import api from '../services/api';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

const MONTH_ORDER = [
  'Apr-23','May-23','Jun-23','Jul-23','Aug-23','Sep-23','Oct-23','Nov-23','Dec-23',
  'Jan-24','Feb-24','Mar-24','Apr-24','May-24','Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24',
  'Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25',
  'Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26'
];

export default function ReportsScreen() {
  const [allRows, setAllRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [fFY, setFFY] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fDept, setFDept] = useState('');
  const [fMachine, setFMachine] = useState('');
  const [fShift, setFShift] = useState('');
  const [fCat, setFCat] = useState('');
  const [fPerson, setFPerson] = useState('');

  // Dropdown options
  const [filterOptions, setFilterOptions] = useState<any>({
    fys: [], months: [], depts: [], machines: [], shifts: [], cats: [], persons: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const reportsRes = await api.get('/reports/dashboard');
      if (reportsRes.data?.data) {
        const { rows } = reportsRes.data.data;
        const rowsWithFY = rows.map((r: any) => {
          let fy = 'Unknown';
          if (r.date) {
            const parts = r.date.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[1], 10);
              const year = parseInt(parts[2], 10);
              if (month >= 4) {
                fy = `FY ${year}-${year + 1}`;
              } else {
                fy = `FY ${year - 1}-${year}`;
              }
            }
          }
          return { ...r, fy };
        });
        setAllRows(rowsWithFY);
        computeOptions(rowsWithFY);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load report datasets.');
    } finally {
      setLoading(false);
    }
  };

  const computeOptions = (rows: any[]) => {
    const fys = new Set<string>();
    const months = new Set<string>();
    const depts = new Set<string>();
    const machines = new Set<string>();
    const shifts = new Set<string>();
    const cats = new Set<string>();
    const persons = new Set<string>();

    rows.forEach((r) => {
      if (r.fy) fys.add(r.fy);
      if (r.monthYear) months.add(r.monthYear);
      if (r.machineType) depts.add(r.machineType);
      if (r.machineName) machines.add(r.machineName);
      if (r.shift) shifts.add(r.shift);
      if (r.category) cats.add(r.category);
      if (r.attendedBy) persons.add(r.attendedBy);
    });

    const sortMonthOptions = (arr: string[]) => {
      return arr.sort((a, b) => {
        const ia = MONTH_ORDER.indexOf(a);
        const ib = MONTH_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    };

    setFilterOptions({
      fys: Array.from(fys).sort().reverse(),
      months: sortMonthOptions(Array.from(months)),
      depts: Array.from(depts).sort(),
      machines: Array.from(machines).sort(),
      shifts: Array.from(shifts).sort(),
      cats: Array.from(cats).sort(),
      persons: Array.from(persons).sort()
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      return (
        (!fFY || r.fy === fFY) &&
        (!fMonth || r.monthYear === fMonth) &&
        (!fDept || r.machineType === fDept) &&
        (!fMachine || r.machineName === fMachine) &&
        (!fShift || r.shift === fShift) &&
        (!fCat || r.category === fCat) &&
        (!fPerson || r.attendedBy === fPerson)
      );
    });
  }, [allRows, fFY, fMonth, fDept, fMachine, fShift, fCat, fPerson]);

  const kpis = useMemo(() => {
    const rows = filteredRows;
    const bd = rows.filter((r) => r.category === 'Breakdown' || r.category === 'Breakdown Log');
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
    Object.keys(mm).forEach((k) => {
      const m = mm[k];
      if (m.bc > 0) mtbfL.push((m.av - m.bm) / m.bc);
    });
    const mtbf = mtbfL.length > 0 ? mtbfL.reduce((a, b) => a + b, 0) / mtbfL.length : 0;

    const ad: Record<string, { d: number; a: number }> = {};
    rows.forEach((r) => {
      const k = `${r.machineName}|${r.monthYear}`;
      if (!ad[k]) ad[k] = { d: 0, a: r.availableMin || 44640 };
      ad[k].d += r.minutes || 0;
    });
    const al = Object.keys(ad).map((k) => {
      const m = ad[k];
      return Math.min(100, Math.max(0, ((m.a - m.d) / m.a) * 100));
    });
    const avgA = al.length > 0 ? al.reduce((a, b) => a + b, 0) / al.length : 100;
    const bdPct = (mtbf + mttr) > 0 ? (mttr / (mtbf + mttr)) * 100 : 0;

    return {
      mttr: mttr > 0 ? `${Math.round(mttr)} min` : '--',
      mtbf: mtbf > 0 ? `${(mtbf / 60).toFixed(1)} hrs` : '--',
      downtime: `${(totMin / 60).toFixed(1)} hrs`,
      bdCount: bdc,
      availability: `${avgA.toFixed(2)}%`,
      bdPct: (mtbf + mttr) > 0 ? `${bdPct.toFixed(1)}%` : '--',
    };
  }, [filteredRows]);

  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    if (Platform.OS !== 'web') {
      Alert.alert('Download CSV', 'CSV Reports download is supported via web browser.');
      return;
    }

    const headers = [
      'Ref ID', 'Date', 'Month Year', 'Shift', 'Machine Type', 
      'Machine Name', 'Unit', 'Problem Type', 'Category', 
      'Description', 'Action Taken', 'Root Cause', 'Time Start', 
      'Time End', 'Duration (Min)', 'Attended By'
    ];
    const csvRows = [
      headers.join(','),
      ...filteredRows.map(row => {
        const values = [
          row.refId, row.date, row.monthYear, row.shift, row.machineType,
          row.machineName, row.unit, row.problemType, row.category,
          `"${(row.description || '').replace(/"/g, '""')}"`,
          `"${(row.actionTaken || '').replace(/"/g, '""')}"`,
          `"${(row.rootCause || '').replace(/"/g, '""')}"`,
          row.timeStart, row.timeEnd, row.minutes, row.attendedBy
        ];
        return values.join(',');
      })
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cmms_reliability_report_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Controls Bar */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Reliability Analytics</Text>
            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.csvBtn} onPress={handleExportCSV}>
                <Text style={styles.csvBtnText}>💾 Export CSV</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filters */}
          <Text style={styles.sectionTitle}>Apply Filters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* FY Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Financial Year</Text>
              <ScrollView style={styles.chipList} horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={[styles.miniChip, !fFY && styles.activeMiniChip]} onPress={() => setFFY('')}>
                  <Text style={[styles.miniChipText, !fFY && styles.activeMiniChipText]}>All</Text>
                </TouchableOpacity>
                {filterOptions.fys.map((f: string) => (
                  <TouchableOpacity key={f} style={[styles.miniChip, fFY === f && styles.activeMiniChip]} onPress={() => setFFY(f)}>
                    <Text style={[styles.miniChipText, fFY === f && styles.activeMiniChipText]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Department / Category Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Machine Category</Text>
              <ScrollView style={styles.chipList} horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={[styles.miniChip, !fDept && styles.activeMiniChip]} onPress={() => setFDept('')}>
                  <Text style={[styles.miniChipText, !fDept && styles.activeMiniChipText]}>All</Text>
                </TouchableOpacity>
                {filterOptions.depts.map((d: string) => (
                  <TouchableOpacity key={d} style={[styles.miniChip, fDept === d && styles.activeMiniChip]} onPress={() => setFDept(d)}>
                    <Text style={[styles.miniChipText, fDept === d && styles.activeMiniChipText]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* KPI CARDS GRID */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.availability}</Text>
              <Text style={styles.kpiLabel}>Availability %</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.mtbf}</Text>
              <Text style={styles.kpiLabel}>MTBF</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.mttr}</Text>
              <Text style={styles.kpiLabel}>MTTR</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.downtime}</Text>
              <Text style={styles.kpiLabel}>Total Downtime</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.bdCount}</Text>
              <Text style={styles.kpiLabel}>Breakdown Count</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.bdPct}</Text>
              <Text style={styles.kpiLabel}>Breakdown Rate</Text>
            </View>
          </View>

          {/* Highest Downtime logs */}
          <Text style={styles.sectionTitle}>Critical Downtime Events</Text>
          {filteredRows
            .sort((a, b) => (b.minutes || 0) - (a.minutes || 0))
            .slice(0, 10)
            .map((item, idx) => (
              <View key={idx} style={styles.logCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.logRef}>{item.refId}</Text>
                  <Text style={styles.logDuration}>{item.minutes} mins</Text>
                </View>
                <Text style={styles.logText}><Text style={styles.bold}>Machine:</Text> {item.machineName}</Text>
                <Text style={styles.logText}><Text style={styles.bold}>Category:</Text> {item.category}</Text>
                <Text style={styles.logText}><Text style={styles.bold}>Problem:</Text> {item.description}</Text>
              </View>
            ))}
        </ScrollView>
      )}
    </View>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
  },
  csvBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  csvBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filtersScroll: {
    marginBottom: 10,
  },
  filterGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 300,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  chipList: {
    flexDirection: 'row',
  },
  miniChip: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeMiniChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  miniChipText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  activeMiniChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  kpiCard: {
    backgroundColor: COLORS.card,
    width: '48%',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  kpiLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logRef: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  logDuration: {
    color: COLORS.warning,
    fontWeight: 'bold',
    fontSize: 12,
  },
  logText: {
    color: COLORS.text,
    fontSize: 12,
    marginBottom: 2,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
});
