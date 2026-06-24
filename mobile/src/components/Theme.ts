export const COLORS = {
  background: '#0F172A', // Slate 900
  card: '#1E293B',       // Slate 800
  text: '#F8FAFC',       // Slate 50
  textMuted: '#94A3B8',  // Slate 400
  primary: '#F97316',    // Orange 500
  primaryDark: '#EA580C',// Orange 600
  secondary: '#3B82F6',  // Blue 500
  success: '#10B981',    // Emerald 500
  warning: '#F59E0B',    // Amber 500
  danger: '#EF4444',     // Red 500
  border: '#334155',     // Slate 700
  divider: '#1E293B',
  placeholder: '#475569',
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 14,
    color: COLORS.text,
  },
  bodyMuted: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
};
