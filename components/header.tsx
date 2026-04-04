import { View, Text } from 'react-native';

export default function Header() {
  return (
    <View className='p-10 rounded-b-2xl bg-black'>
      <Text className='font-bold text-lg tracking-tight text-white'>This is a Header</Text>
    </View>
  );
}