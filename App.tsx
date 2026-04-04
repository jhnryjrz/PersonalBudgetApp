import BudgetApp from 'main/budget-app';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';

export default function App() {
  return (
    <SafeAreaProvider className='flex-1 w-full'>
      <BudgetApp/>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
