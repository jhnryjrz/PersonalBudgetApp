import Homepage from 'pages/homepage';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BudgetApp() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Homepage />
    </SafeAreaView>
  );
}