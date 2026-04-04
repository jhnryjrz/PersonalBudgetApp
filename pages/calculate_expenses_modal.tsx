import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

interface LogEntry {
  id: string;
  type: string;
  amount: number;
}

interface CalculateExpensesProps {
  modalCalExpensesVisible: boolean;
  setModalCalExpensesVisible: (visible: boolean) => void;
  newBalance: number;
  setNewBalance: (val: number) => void; // Fixed: needs to be a function
  balance: number;
  setBalance: (val: number | ((prev: number) => number)) => void; // Fixed
  log: LogEntry[]; // The state
  setLog: React.Dispatch<React.SetStateAction<LogEntry[]>>; // The setter
}
export default function CalculateExpenses({
  modalCalExpensesVisible,
  setModalCalExpensesVisible,
  newBalance,
  setNewBalance,
  balance,
  setBalance,
  log,
  setLog,
}: CalculateExpensesProps) {
  const subBalance = () => {
    const amountNum = Number(newBalance);
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      type: 'sub',
      amount: amountNum,
    };

    setLog((prevLog) => [newEntry, ...prevLog]);
    setBalance((prev) => prev - amountNum);
    setModalCalExpensesVisible(false);
    setNewBalance(0);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalCalExpensesVisible}
      onRequestClose={() => {
        Alert.alert('Modal has been closed.');
        setModalCalExpensesVisible(!modalCalExpensesVisible);
      }}>
      <SafeAreaProvider className="flex-1">
        <SafeAreaView className="w-full flex-1 bg-white p-5">
          <Pressable onPress={() => Keyboard.dismiss()} className="flex-1">
            <View className="flex flex-row gap-2">
              <View className="py-2 w-[15rem]">
                <Text className="text-lg">Name</Text>
                <TextInput
                  className="rounded-lg border border-gray-400 p-3"
                  onChangeText={(e) => setNewBalance(Number(e))}
                  placeholder="Ex. Food"></TextInput>
              </View>
              <View className="py-2">
                <Text className="text-lg">Amount</Text>
                <TextInput
                  className="rounded-lg border border-gray-400 p-3"
                  placeholder="Ex. 100"
                  inputMode="numeric"></TextInput>
              </View>
              <View className='flex items-center justify-end py-2'>
                <TouchableOpacity className="p-3.5 px-5 rounded-lg bg-[#3A9AFF] ">
                  <Text className='color-white'>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg bg-gray-500 p-3 px-5"
                onPress={() => setModalCalExpensesVisible(!modalCalExpensesVisible)}>
                <Text>Close</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-gray-500 p-3 px-5"
                onPress={() =>
                  newBalance > 0 ? subBalance() : Alert.alert('Amount cannot be empty')
                }>
                <Text>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
