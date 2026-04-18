import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useState } from 'react';
import { supabase } from 'lib/supabase';
import { useTheme } from 'lib/ThemeContext';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
}

export default function LoginScreen({ onNavigateToSignup }: LoginScreenProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login Failed', error.message);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        Alert.alert('Google Login Failed', error.message);
        return;
      }
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          // Supabase may put tokens in the fragment (#) or query (?)
          const params = new URLSearchParams(url.hash.substring(1) || url.search.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Google Login Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 }}>
          {/* Logo / Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Image
              style={{ width: 100, height: 100, marginBottom: 16 }}
              source={require('../../assets/Spenda_logo.png')}
            />
            <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>Take control of your finances</Text>
          </View>

          {/* Login Card */}
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.borderPrimary }}>
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Welcome Back</Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>Email</Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgInput, color: colors.textPrimary,
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: 1, borderColor: colors.borderInput,
                }}
                placeholder="your@email.com"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>Password</Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgInput, color: colors.textPrimary,
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: 1, borderColor: colors.borderInput,
                }}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={{
                borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16,
                backgroundColor: loading ? (colors.accent + 'AA') : colors.btnPrimaryBg,
              }}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
              <Text style={{ color: colors.textMuted, marginHorizontal: 12, fontSize: 14 }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderInput,
                borderRadius: 12, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8,
              }}
              onPress={handleGoogleLogin}
              disabled={loading}>
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>G</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
            <Pressable onPress={onNavigateToSignup}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
