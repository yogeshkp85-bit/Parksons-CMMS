import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string | number;
  color?: string; // e.g., '#10b981' for emerald
}

export const Badge: React.FC<BadgeProps> = ({ label, color = '#3b82f6' }) => {
  return (
    <View style={[styles.container, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
