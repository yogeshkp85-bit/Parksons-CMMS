import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, glowColor }) => {
  return (
    <View style={[
      styles.card, 
      glowColor && { 
        borderColor: `${glowColor}50`, 
        shadowColor: glowColor,
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10
      },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // slate-900 with opacity
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    overflow: 'hidden',
  }
});
