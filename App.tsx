import BudgetApp from 'main/budget-app';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from 'lib/ThemeContext';
import './global.css';

function AppContent() {
  const { colors } = useTheme();
  return (
    <SafeAreaProvider className='flex-1 w-full'>
      <BudgetApp/>
      <StatusBar style={colors.statusBarStyle === 'dark' ? 'dark' : 'light'} />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
