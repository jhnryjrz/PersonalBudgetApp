import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from 'lib/supabase';
import { useTheme } from 'lib/ThemeContext';
import AuthNavigator from 'pages/auth/AuthNavigator';
import Homepage from 'pages/homepage';
import AnalyticsScreen from 'pages/AnalyticsScreen';
import { Ionicons } from '@expo/vector-icons';

type TabName = 'home' | 'analytics';

export default function BudgetApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const { colors, isDark } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <Image 
            source={require('../assets/Spenda_logo.png')} 
            style={{ width: 120, height: 120, marginBottom: 24 }} 
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <AuthNavigator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top', 'left', 'right']}>
      {/* Screen Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'home' ? (
          <Homepage user={session.user} />
        ) : (
          <AnalyticsScreen user={session.user} />
        )}
      </View>

      {/* Bottom Tab Bar Container */}
      <View style={{
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        height: 68,
        backgroundColor: isDark ? '#171717' : '#FFFFFF',
        borderRadius: 34,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        // Shadow / Elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 1,
        borderColor: isDark ? '#262626' : colors.borderPrimary,
      }}>
        {/* Home Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          style={{
            height: 50,
            width: 100,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeTab === 'home' 
              ? (isDark ? '#262626' : '#F3F4F6') 
              : 'transparent',
            marginHorizontal: 4,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons 
              name={activeTab === 'home' ? 'home' : 'home-outline'} 
              size={22} 
              color={activeTab === 'home' ? colors.accent : (isDark ? '#9CA3AF' : colors.textMuted)} 
            />
            <Text style={{ 
              color: activeTab === 'home' ? (isDark ? '#FFFFFF' : colors.textPrimary) : (isDark ? '#9CA3AF' : colors.textMuted),
              fontWeight: '600',
              fontSize: 14
            }}>Home</Text>
          </View>
        </TouchableOpacity>

        {/* Analytics Tab */}
        <TouchableOpacity
          onPress={() => setActiveTab('analytics')}
          style={{
            height: 50,
            width: 110,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: activeTab === 'analytics' 
              ? (isDark ? '#262626' : '#F3F4F6') 
              : 'transparent',
            marginHorizontal: 4,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons 
              name={activeTab === 'analytics' ? 'stats-chart' : 'stats-chart-outline'} 
              size={22} 
              color={activeTab === 'analytics' ? colors.accent : (isDark ? '#9CA3AF' : colors.textMuted)} 
            />
            <Text style={{ 
              color: activeTab === 'analytics' ? (isDark ? '#FFFFFF' : colors.textPrimary) : (isDark ? '#9CA3AF' : colors.textMuted),
              fontWeight: '600',
              fontSize: 14
            }}>Analytics</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}