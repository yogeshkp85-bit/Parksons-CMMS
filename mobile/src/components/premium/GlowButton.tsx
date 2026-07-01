import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({ 
  title, 
  onPress, 
  color = '#06b6d4', // cyan-500
  style, 
  textStyle,
  disabled 
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button, 
        { 
          backgroundColor: `${color}15`, 
          borderColor: `${color}40`,
          shadowColor: color,
        },
        disabled && styles.disabled,
        style
      ]}
    >
      <Text style={[styles.text, { color }, disabled && styles.disabledText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  }
});
