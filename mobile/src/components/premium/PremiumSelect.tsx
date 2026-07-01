import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../components/Theme';

interface PremiumSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const PremiumSelect: React.FC<PremiumSelectProps> = ({ 
  label, value, options, onSelect, placeholder = 'Select...', error, required, disabled, style 
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TouchableOpacity 
        style={[styles.inputBox, error && styles.inputError, disabled && styles.disabled]} 
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value ? selectedLabel : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item, index) => item.value + index}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.optionItem, value === item.value && styles.optionSelected]}
                  onPress={() => {
                    onSelect(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, value === item.value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' },
  required: { color: COLORS.danger, marginLeft: 4, fontSize: 12 },
  inputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputError: { borderColor: COLORS.danger },
  disabled: { opacity: 0.5 },
  inputText: { color: COLORS.text, fontSize: 14 },
  placeholderText: { color: COLORS.textMuted },
  errorText: { color: COLORS.danger, fontSize: 10, marginTop: 4, marginLeft: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: COLORS.card, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  optionSelected: { backgroundColor: `${COLORS.primary}10` },
  optionText: { color: COLORS.text, fontSize: 14 },
  optionTextSelected: { color: COLORS.primary, fontWeight: 'bold' },
});
