export const COLORS = {
  background: '#0B1120', // Deeper Slate 900 for premium feel
  card: '#1E293B',       // Slate 800
  glassCard: 'rgba(30, 41, 59, 0.7)', // For glassmorphism
  text: '#F8FAFC',       // Slate 50
  textMuted: '#94A3B8',  // Slate 400
  primary: '#06B6D4',    // Premium Cyan 500 (Matches Web App)
  primaryDark: '#0891B2',// Cyan 600
  secondary: '#3B82F6',  // Blue 500
  success: '#10B981',    // Emerald 500
  warning: '#F59E0B',    // Amber 500
  danger: '#EF4444',     // Red 500
  border: '#334155',     // Slate 700
  divider: '#1E293B',
  placeholder: '#475569',
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  radius: 12,
  padding: 16,
  margin: 16,
};

export const SHADOWS = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  glow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  }
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  h3: {
    fontSize: SIZES.xl,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.lg,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  bodyMuted: {
    fontSize: SIZES.sm,
    color: COLORS.textMuted,
  },
  buttonText: {
    fontSize: SIZES.md,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
  },
};
