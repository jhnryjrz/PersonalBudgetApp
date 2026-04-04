import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Keyboard,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import Header from 'components/header';
import CalculateExpenses from './calculate_expenses_modal';

type ItemProps = {
  amount: number;
  type: string;
};

const Item = ({ amount, type }: ItemProps) => (
  <View className="mb-2 flex-row rounded-md border border-gray-300 p-5">
    <Text className="">
      {type === 'add' ? `Added ${amount} to your balance` : `Subtracted ${amount} to your balance`}
    </Text>
    {type === 'sub' ? (
      <Pressable className="ml-auto">
        <Text className="color-gray-400">View</Text>
      </Pressable>
    ) : null}
  </View>
);

export default function Homepage() {
  const [balance, setBalance] = useState(4000);
  const [newBalance, setNewBalance] = useState(0);
  const [modalAddBalanceVisible, setModalAddBalanceVisible] = useState(false);
  const [modalCalExpensesVisible, setModalCalExpensesVisible] = useState(false);
  const [log, setLog] = useState<{ id: string; type: string; amount: number }[]>([]);

  const addBalance = () => {
    const amountNum = Number(newBalance);
    const newEntry = {
      id: Date.now().toString(),
      type: 'add',
      amount: amountNum,
    };
    setLog((prevLog) => [newEntry, ...prevLog]);
    setBalance((b) => b + amountNum);
    setModalAddBalanceVisible(!modalAddBalanceVisible);
    setNewBalance(0);
  };

  return (
    <View className="flex-1 gap-5">
      <Header />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalAddBalanceVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalAddBalanceVisible(!modalAddBalanceVisible);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
            }}
            className="flex-1 items-center justify-center bg-black/30 ">
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
              }}
              className="flex w-[80%] justify-center rounded-2xl bg-white p-5">
              <View className="p-2">
                <Text className="text-lg">Amount</Text>
                <TextInput
                  className="h-[2.5rem] rounded-lg border border-gray-400"
                  onChangeText={(e) => setNewBalance(Number(e))}
                  inputMode="numeric"
                  placeholder="ex. 45"></TextInput>
              </View>
              <View className="mt-[30%] flex-row justify-end gap-2">
                <Pressable
                  className="rounded-lg bg-gray-500 p-3 px-5"
                  onPress={() => setModalAddBalanceVisible(!modalAddBalanceVisible)}>
                  <Text>Close</Text>
                </Pressable>
                <Pressable
                  className="rounded-lg bg-gray-500 p-3 px-5"
                  onPress={() =>
                    newBalance > 0 ? addBalance() : Alert.alert('Amount cannot be empty')
                  }>
                  <Text>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {modalCalExpensesVisible ? (
        <CalculateExpenses
          modalCalExpensesVisible={modalCalExpensesVisible}
          setModalCalExpensesVisible={setModalCalExpensesVisible}
          newBalance={newBalance}
          setNewBalance={setNewBalance}
          balance={balance}
          setBalance={setBalance}
          log={log}
          setLog={setLog}
        />
      ) : null}

      <View className="mx-5 flex-1 gap-5">
        <View className="items-center justify-center rounded-lg border border-gray-300 bg-white p-6">
          <Text className="text-center text-[3rem] text-gray-800">₱ {balance}</Text>
        </View>
        <View className="flex-row justify-evenly">
          <TouchableOpacity
            className="rounded-lg bg-black p-2"
            onPress={() => setModalAddBalanceVisible(true)}>
            <Text className="text-white">Add balance</Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-lg bg-black p-2" onPress={() => setModalCalExpensesVisible(true)}>
            <Text className="text-white">Calculate expenses</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 rounded-lg border border-gray-300">
          <View className="flex-1 items-center gap-5">
            <Text className="text-lg font-bold">Log</Text>
            <FlatList
              data={log}
              keyExtractor={(item) => item.id} // FIX 4: Added keyExtractor
              renderItem={({ item }) => <Item amount={item.amount} type={item.type} />}
              ListEmptyComponent={
                <Text className="mt-10 text-center text-gray-400">No transactions yet.</Text>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
              className="w-full flex-1 p-5"
            />
          </View>
        </View>
      </View>
    </View>
  );
}
