import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Button } from 'react-native';
import { getDB } from '../services/db';
import { COLORS, TYPOGRAPHY } from '../components/Theme';

export default function QRScannerScreen({ navigation }: { navigation: any }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Request mock permission or actual permissions if we want.
    // Since emulators don't have cameras, we provide quick testing buttons to simulate scans.
    setHasPermission(true);
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    processScannedData(data);
  };

  const processScannedData = (data: string) => {
    try {
      // Expecting QR payload format: "PKS-MCH-001" or a JSON format like: { "id": "uuid", "name": "PrintKBA1" }
      let machineId = data;
      let machineName = data;

      if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        machineId = parsed.id || data;
        machineName = parsed.name || data;
      } else {
        // Look up machine name from cached database if it's just an ID
        const db = getDB();
        const found = db.getFirstSync<any>(
          `SELECT name FROM machines_cache WHERE id = ? OR machineId = ?`,
          [data, data]
        );
        if (found) {
          machineName = found.name;
        }
      }

      Alert.alert(
        'Machine Found',
        `Scanned Machine: ${machineName}`,
        [
          {
            text: 'Proceed to Log',
            onPress: () => {
              navigation.navigate('BreakdownForm', {
                machineId,
                machineName,
              });
            },
          },
          { text: 'Cancel', onPress: () => setScanned(false) },
        ]
      );
    } catch (e) {
      Alert.alert('Scan Error', 'Invalid QR code schema.');
      setScanned(false);
    }
  };

  // Simulated scan triggers for testing on emulator
  const triggerMockScan = (machineName: string, id: string) => {
    processScannedData(JSON.stringify({ id, name: machineName }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Machine QR Code</Text>
      
      {/* Scanner Visual Frame Placeholder */}
      <View style={styles.scannerFrame}>
        <View style={styles.viewfinder}>
          <Text style={styles.viewfinderText}>Align QR code inside framework</Text>
        </View>
      </View>

      <Text style={styles.helpText}>
        Testing on emulator? Use the simulator options below to trigger scan simulations:
      </Text>

      {/* Mock simulator selectors */}
      <View style={styles.simBox}>
        <TouchableOpacity
          style={styles.simButton}
          onPress={() => triggerMockScan('KBA Printing Press 1', 'kba-print-1')}
        >
          <Text style={styles.simButtonText}>Simulate: KBA Press 1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.simButton}
          onPress={() => triggerMockScan('Bobst Die Cutter 3', 'bobst-cut-3')}
        >
          <Text style={styles.simButtonText}>Simulate: Bobst Cutter 3</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    color: COLORS.primary,
    marginBottom: 24,
  },
  scannerFrame: {
    height: 250,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  viewfinder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  helpText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  simBox: {
    marginBottom: 24,
  },
  simButton: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  simButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
  },
  backText: {
    color: COLORS.danger,
    fontWeight: 'bold',
  },
});
