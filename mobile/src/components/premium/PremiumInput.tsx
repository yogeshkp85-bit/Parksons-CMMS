import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../components/Theme';

interface PremiumInputProps {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  style?: ViewStyle;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({ 
  label, value, onChangeText, placeholder, error, required, multiline, maxLength, style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        style={[
          styles.input, 
          multiline && styles.inputMultiline,
          error && styles.inputError
        ]}
      />
      {maxLength && (
        <Text style={[styles.charCount, value.length >= maxLength * 0.9 && styles.charCountWarn]}>
          {value.length} / {maxLength}
        </Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, position: 'relative' },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' },
  required: { color: COLORS.danger, marginLeft: 4, fontSize: 12 },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: 10, marginTop: 4, marginLeft: 4 },
  charCount: { position: 'absolute', right: 4, top: 0, fontSize: 10, color: COLORS.textMuted, fontWeight: 'bold' },
  charCountWarn: { color: COLORS.danger },
});
