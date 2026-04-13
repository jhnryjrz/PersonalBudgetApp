import { useState } from 'react';
import { View } from 'react-native';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

export default function AuthNavigator() {
  const [screen, setScreen] = useState<'login' | 'signup'>('login');

  return (
    <View className="flex-1">
      {screen === 'login' ? (
        <LoginScreen onNavigateToSignup={() => setScreen('signup')} />
      ) : (
        <SignupScreen onNavigateToLogin={() => setScreen('login')} />
      )}
    </View>
  );
}
