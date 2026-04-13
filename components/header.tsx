import { View, Text } from 'react-native';
import { useTheme } from 'lib/ThemeContext';

export default function Header() {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 40, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, backgroundColor: colors.bgCard }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, letterSpacing: -0.5, color: colors.textPrimary }}>This is a Header</Text>
    </View>
  );
}