import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgInput: string;
  bgTabBar: string;
  bgModal: string;
  bgOverlay: string;

  // Borders
  borderPrimary: string;
  borderInput: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Accent
  accent: string;
  accentLight: string;
  accentMuted: string;

  // Status
  success: string;
  danger: string;
  dangerLight: string;
  warning: string;

  // Balance card
  balanceCardBg: string;
  balanceCardLabel: string;
  balanceCardDivider: string;
  balanceCardCircle: string;

  // Progress bar
  progressBg: string;

  // Tab pills
  tabBg: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;

  // Button
  btnPrimaryBg: string;
  btnSecondaryBg: string;
  btnDangerBg: string;

  // Modal handle
  modalHandle: string;

  // Placeholder
  placeholder: string;

  // Bar chart
  barEmpty: string;
  barFill: string;

  // Category chip
  chipBg: string;
  chipBorder: string;
  chipActiveBg: string;
  chipActiveBorder: string;
  chipActiveText: string;
  chipText: string;

  // Sign out button
  signOutBg: string;
  signOutBorder: string;
  signOutText: string;

  // StatusBar
  statusBarStyle: 'light' | 'dark';
}

const lightTheme: ThemeColors = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FA',
  bgCard: '#FFFFFF',
  bgInput: '#F3F4F6',
  bgTabBar: '#FFFFFF',
  bgModal: '#FFFFFF',
  bgOverlay: 'rgba(0,0,0,0.35)',

  borderPrimary: '#E5E7EB',
  borderInput: '#E5E7EB',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  accent: '#2563EB',
  accentLight: '#DBEAFE',
  accentMuted: '#93C5FD',

  success: '#16A34A',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',

  balanceCardBg: '#1E1B4B',
  balanceCardLabel: '#A5B4FC',
  balanceCardDivider: 'rgba(255, 255, 255, 0.1)',
  balanceCardCircle: '#4F46E5',

  progressBg: '#E5E7EB',

  tabBg: '#F3F4F6',
  tabActiveBg: '#2563EB',
  tabActiveText: '#FFFFFF',
  tabInactiveText: '#6B7280',

  btnPrimaryBg: '#2563EB',
  btnSecondaryBg: '#E5E7EB',
  btnDangerBg: '#DC2626',

  modalHandle: '#D1D5DB',

  placeholder: '#9CA3AF',

  barEmpty: '#F3F4F6',
  barFill: '#2563EB',

  chipBg: '#F3F4F6',
  chipBorder: '#E5E7EB',
  chipActiveBg: '#DBEAFE',
  chipActiveBorder: '#2563EB',
  chipActiveText: '#2563EB',
  chipText: '#374151',

  signOutBg: '#F3F4F6',
  signOutBorder: '#E5E7EB',
  signOutText: '#374151',

  statusBarStyle: 'dark',
};

const darkTheme: ThemeColors = {
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgCard: '#1E293B',
  bgInput: '#1E293B',
  bgTabBar: '#1E293B',
  bgModal: '#1E293B',
  bgOverlay: 'rgba(0,0,0,0.6)',

  borderPrimary: '#334155',
  borderInput: '#334155',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  accent: '#3B82F6',
  accentLight: '#1E3A5F',
  accentMuted: '#60A5FA',

  success: '#22C55E',
  danger: '#EF4444',
  dangerLight: '#7F1D1D',
  warning: '#F59E0B',
  //2E1065
  balanceCardBg: '#242F49',
  balanceCardLabel: '#D8B4FE',
  balanceCardDivider: 'rgba(255, 255, 255, 0.1)',
  balanceCardCircle: '#7C3AED',

  progressBg: '#334155',

  tabBg: '#1E293B',
  tabActiveBg: '#3B82F6',
  tabActiveText: '#FFFFFF',
  tabInactiveText: '#64748B',

  btnPrimaryBg: '#3B82F6',
  btnSecondaryBg: '#334155',
  btnDangerBg: '#EF4444',

  modalHandle: '#475569',

  placeholder: '#64748B',

  barEmpty: '#1E293B',
  barFill: '#3B82F6',

  chipBg: '#1E293B',
  chipBorder: '#334155',
  chipActiveBg: '#1E3A5F',
  chipActiveBorder: '#3B82F6',
  chipActiveText: '#93C5FD',
  chipText: '#CBD5E1',

  signOutBg: '#1E293B',
  signOutBorder: '#334155',
  signOutText: '#CBD5E1',

  statusBarStyle: 'light',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightTheme,
  toggleTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === 'light' ? lightTheme : darkTheme,
      toggleTheme,
      isDark: mode === 'dark',
    }),
    [mode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
