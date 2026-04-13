import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from 'lib/supabase';
import { useTheme } from 'lib/ThemeContext';
import { User } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

const EXPENSE_CATEGORIES = [
  { label: '🍔 Food', value: 'Food' },
  { label: '🚌 Transportation', value: 'Transportation' },
  { label: '🏠 Housing', value: 'Housing' },
  { label: '💊 Health', value: 'Health' },
  { label: '🎮 Entertainment', value: 'Entertainment' },
  { label: '👕 Clothing', value: 'Clothing' },
  { label: '📱 Utilities', value: 'Utilities' },
  { label: '📚 Education', value: 'Education' },
  { label: '💰 Savings', value: 'Savings' },
  { label: '🛒 Others', value: 'Others' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Transportation: '#3b82f6',
  Housing: '#8b5cf6',
  Health: '#ef4444',
  Entertainment: '#ec4899',
  Clothing: '#14b8a6',
  Utilities: '#f59e0b',
  Education: '#6366f1',
  Savings: '#22c55e',
  Others: '#94a3b8',
};

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  expense_date: string;
  created_at: string;
}

interface AnalyticsScreenProps {
  user: User;
}

type FilterPeriod = 'daily' | 'weekly' | 'monthly';

export default function AnalyticsScreen({ user }: AnalyticsScreenProps) {
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const getFilteredExpenses = (): Expense[] => {
    const d = new Date(selectedDate);

    if (filter === 'daily') {
      const dayStr = d.toISOString().split('T')[0];
      return expenses.filter((e) => e.expense_date === dayStr);
    }

    if (filter === 'weekly') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay()); // Sunday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      return expenses.filter((e) => e.expense_date >= startStr && e.expense_date <= endStr);
    }

    if (filter === 'monthly') {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      return expenses.filter((e) => e.expense_date.startsWith(prefix));
    }

    return expenses;
  };

  const filtered = getFilteredExpenses();
  const totalFiltered = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  filtered.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // Bar chart data - group by day/date
  const getBarData = () => {
    if (filter === 'daily') {
      const hours: Record<string, number> = {
        'Morning': 0, 'Noon': 0, 'Afternoon': 0, 'Evening': 0
      };
      filtered.forEach((e) => {
        const hr = new Date(e.created_at).getHours();
        if (hr < 9) hours['Morning'] += Number(e.amount);
        else if (hr < 13) hours['Noon'] += Number(e.amount);
        else if (hr < 17) hours['Afternoon'] += Number(e.amount);
        else hours['Evening'] += Number(e.amount);
      });
      return Object.entries(hours).map(([label, value]) => ({ label, value }));
    }

    if (filter === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const data: Record<string, number> = {};
      const d = new Date(selectedDate);
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        data[days[i]] = 0;
        filtered.forEach((e) => {
          if (e.expense_date === dayStr) data[days[i]] += Number(e.amount);
        });
      }
      return Object.entries(data).map(([label, value]) => ({ label, value }));
    }

    if (filter === 'monthly') {
      const d = new Date(selectedDate);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const weeklyData: Record<string, number> = {};
      for (let week = 1; week <= 5; week++) weeklyData[`W${week}`] = 0;
      filtered.forEach((e) => {
        const day = new Date(e.expense_date + 'T00:00:00').getDate();
        const week = Math.ceil(day / 7);
        const key = `W${Math.min(week, 5)}`;
        weeklyData[key] += Number(e.amount);
      });
      return Object.entries(weeklyData).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }));
    }

    return [];
  };

  const barData = getBarData();
  const maxBarValue = Math.max(...barData.map((d) => d.value), 1);

  const navigatePeriod = (dir: -1 | 1) => {
    const d = new Date(selectedDate);
    if (filter === 'daily') d.setDate(d.getDate() + dir);
    else if (filter === 'weekly') d.setDate(d.getDate() + dir * 7);
    else if (filter === 'monthly') d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const getPeriodLabel = () => {
    const d = selectedDate;
    if (filter === 'daily') {
      return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (filter === 'weekly') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (filter === 'monthly') {
      return d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const formatCurrency = (val: number) =>
    `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>Analytics</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Track your spending patterns</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Filter Pills */}
        <View style={{
          flexDirection: 'row', marginHorizontal: 20,
          backgroundColor: colors.tabBg, borderRadius: 16,
          padding: 4, marginBottom: 16,
          borderWidth: 1, borderColor: colors.borderPrimary,
        }}>
          {(['daily', 'weekly', 'monthly'] as FilterPeriod[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                backgroundColor: filter === f ? colors.tabActiveBg : 'transparent',
              }}
              onPress={() => setFilter(f)}>
              <Text style={{
                fontWeight: '600', fontSize: 14, textTransform: 'capitalize',
                color: filter === f ? colors.tabActiveText : colors.tabInactiveText,
              }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigator */}
        <View style={{
          marginHorizontal: 20, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.bgCard, borderRadius: 16,
          paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
          borderWidth: 1, borderColor: colors.borderPrimary,
        }}>
          <TouchableOpacity onPress={() => navigatePeriod(-1)} style={{ padding: 8 }}>
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: 'bold' }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center', flex: 1 }}>{getPeriodLabel()}</Text>
          <TouchableOpacity onPress={() => navigatePeriod(1)} style={{ padding: 8 }}>
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: 'bold' }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Total Card */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.borderPrimary }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>Total Spent</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 30, fontWeight: 'bold' }}>{formatCurrency(totalFiltered)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{filtered.length} transactions</Text>
          </View>
        </View>

        {/* Bar Chart */}
        {barData.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.borderPrimary }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', marginBottom: 16 }}>Spending Overview</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 }}>
                {barData.map((item, idx) => {
                  const barHeight = maxBarValue > 0 ? (item.value / maxBarValue) * 100 : 0;
                  return (
                    <View key={idx} style={{ alignItems: 'center', flex: 1, marginHorizontal: 2 }}>
                      {item.value > 0 && (
                        <Text style={{ color: colors.textMuted, fontSize: 8, marginBottom: 4 }}>
                          ₱{(item.value / 1000 >= 1 ? (item.value / 1000).toFixed(1) + 'k' : item.value.toFixed(0))}
                        </Text>
                      )}
                      <View
                        style={{
                          borderTopLeftRadius: 6, borderTopRightRadius: 6, width: '100%',
                          height: Math.max(barHeight, item.value > 0 ? 4 : 2),
                          backgroundColor: item.value > 0 ? colors.barFill : colors.barEmpty,
                        }}
                      />
                      <Text style={{ color: colors.textMuted, fontSize: 9, marginTop: 6 }}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {sortedCategories.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.borderPrimary }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', marginBottom: 16 }}>By Category</Text>
              {sortedCategories.map(([category, amount]) => {
                const pct = totalFiltered > 0 ? (amount / totalFiltered) * 100 : 0;
                const catObj = EXPENSE_CATEGORIES.find((c) => c.value === category);
                const color = CATEGORY_COLORS[category] || '#94a3b8';
                return (
                  <View key={category} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 14 }}>{catObj?.label.split(' ')[0] || '💸'}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '500' }}>{category}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{formatCurrency(amount)}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{pct.toFixed(1)}%</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: colors.progressBg, borderRadius: 99, height: 8 }}>
                      <View
                        style={{ borderRadius: 99, height: 8, width: `${pct}%`, backgroundColor: color }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📊</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No expenses found for this period</Text>
          </View>
        )}

        {/* Expense List */}
        {filtered.length > 0 && (
          <View style={{ marginHorizontal: 20 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold', marginBottom: 12 }}>Transactions</Text>
            {filtered.map((expense) => (
              <View
                key={expense.id}
                style={{
                  backgroundColor: colors.bgCard, borderRadius: 16,
                  padding: 16, marginBottom: 8,
                  borderWidth: 1, borderColor: colors.borderPrimary,
                  flexDirection: 'row', alignItems: 'center',
                }}>
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    backgroundColor: (CATEGORY_COLORS[expense.category] || '#94a3b8') + '20',
                  }}>
                  <Text style={{ fontSize: 14 }}>
                    {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label.split(' ')[0] || '💸'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>{expense.description || expense.category}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {expense.category} · {new Date(expense.expense_date + 'T00:00:00').toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric'
                    })}
                  </Text>
                </View>
                <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>-{formatCurrency(expense.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
