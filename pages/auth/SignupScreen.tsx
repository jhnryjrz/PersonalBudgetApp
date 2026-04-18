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

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else if (data.user && !data.session) {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to your email. Please verify to continue.',
        [{ text: 'OK', onPress: onNavigateToLogin }]
      );
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
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
        Alert.alert('Google Sign Up Failed', error.message);
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
      Alert.alert('Google Sign Up Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, backgroundColor: colors.bgPrimary, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 }}>
          {/* Logo / Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image
              style={{ width: 100, height: 100, marginBottom: 16 }}
              source={require('../../assets/Spenda_logo.png')}
            />
            <Text style={{ fontSize: 30, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: -0.5 }}>Create Account</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>Start budgeting smarter today</Text>
          </View>

          {/* Signup Card */}
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.borderPrimary }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>Full Name</Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgInput, color: colors.textPrimary,
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: 1, borderColor: colors.borderInput,
                }}
                placeholder="John Doe"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

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

            <View style={{ marginBottom: 16 }}>
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

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>Confirm Password</Text>
              <TextInput
                style={{
                  backgroundColor: colors.bgInput, color: colors.textPrimary,
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                  borderWidth: 1, borderColor: colors.borderInput,
                }}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={{
                borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16,
                backgroundColor: loading ? (colors.accent + 'AA') : colors.btnPrimaryBg,
              }}
              onPress={handleSignup}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
              <Text style={{ color: colors.textMuted, marginHorizontal: 12, fontSize: 14 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.borderPrimary }} />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.borderInput,
                borderRadius: 12, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onPress={handleGoogleSignup}
              disabled={loading}>
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>G</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Sign up with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
            <Pressable onPress={onNavigateToLogin}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
