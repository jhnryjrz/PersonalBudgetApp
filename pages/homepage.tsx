import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from 'lib/supabase';
import { useTheme } from 'lib/ThemeContext';
import { User } from '@supabase/supabase-js';

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

interface Budget {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

interface SpendingLimit {
  id: string;
  period: 'daily' | 'weekly';
  amount: number;
}

interface HomepageProps {
  user: User;
}

export default function Homepage({ user }: HomepageProps) {
  const { colors, toggleTheme, isDark } = useTheme();
  const [profileName, setProfileName] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  // Add budget form
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetDesc, setBudgetDesc] = useState('');

  // Add expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Others');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Spending limits form
  const [dailyLimit, setDailyLimit] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');

  // Tab: 'history' | 'budgets'
  const [activeTab, setActiveTab] = useState<'history' | 'budgets'>('history');

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    if (data?.full_name) setProfileName(data.full_name);
    else setProfileName(user.email?.split('@')[0] || 'User');
  }, [user]);

  const fetchBudgets = useCallback(async () => {
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setBudgets(data);
      const total = data.reduce((sum: number, b: Budget) => sum + Number(b.amount), 0);
      setTotalBalance(total);
    }
  }, [user]);

  const fetchExpenses = useCallback(async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setExpenses(data);
  }, [user]);

  const fetchSpendingLimits = useCallback(async () => {
    const { data } = await supabase
      .from('spending_limits')
      .select('*')
      .eq('user_id', user.id);
    if (data) setSpendingLimits(data);
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchBudgets(), fetchExpenses(), fetchSpendingLimits()]);
    setLoading(false);
  }, [fetchProfile, fetchBudgets, fetchExpenses, fetchSpendingLimits]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currentBalance = totalBalance - totalExpenses;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses
    .filter((e) => e.expense_date === todayStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const getWeekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };
  const weekStart = getWeekStart();
  const weeklyExpenses = expenses
    .filter((e) => e.expense_date >= weekStart)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const dailyLimitObj = spendingLimits.find((l) => l.period === 'daily');
  const weeklyLimitObj = spendingLimits.find((l) => l.period === 'weekly');

  const handleAddBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      amount,
      description: budgetDesc || 'Budget',
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setBudgetAmount('');
    setBudgetDesc('');
    setShowAddBudget(false);
    fetchBudgets();
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check daily limit
    if (dailyLimitObj) {
      const newTodayTotal = todayExpenses + amount;
      if (newTodayTotal > dailyLimitObj.amount) {
        Alert.alert(
          'Daily Limit Exceeded',
          `Adding ₱${amount.toFixed(2)} will exceed your daily limit of ₱${dailyLimitObj.amount.toFixed(2)}. Today's total would be ₱${newTodayTotal.toFixed(2)}.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Anyway', onPress: () => _submitExpense(amount) },
          ]
        );
        return;
      }
    }

    _submitExpense(amount);
  };

  const _submitExpense = async (amount: number) => {
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount,
      description: expenseDesc || expenseCategory,
      category: expenseCategory,
      expense_date: expenseDate,
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseCategory('Others');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowAddExpense(false);
    fetchExpenses();
  };

  const handleSaveLimits = async () => {
    const ops = [];
    if (dailyLimit) {
      const existing = spendingLimits.find((l) => l.period === 'daily');
      if (existing) {
        ops.push(
          supabase.from('spending_limits').update({ amount: parseFloat(dailyLimit), updated_at: new Date().toISOString() }).eq('id', existing.id)
        );
      } else {
        ops.push(
          supabase.from('spending_limits').insert({ user_id: user.id, period: 'daily', amount: parseFloat(dailyLimit) })
        );
      }
    }
    if (weeklyLimit) {
      const existing = spendingLimits.find((l) => l.period === 'weekly');
      if (existing) {
        ops.push(
          supabase.from('spending_limits').update({ amount: parseFloat(weeklyLimit), updated_at: new Date().toISOString() }).eq('id', existing.id)
        );
      } else {
        ops.push(
          supabase.from('spending_limits').insert({ user_id: user.id, period: 'weekly', amount: parseFloat(weeklyLimit) })
        );
      }
    }
    await Promise.all(ops);
    setDailyLimit('');
    setWeeklyLimit('');
    setShowLimits(false);
    fetchSpendingLimits();
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const formatCurrency = (val: number) =>
    `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading your budget...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Good day,</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>{profileName} 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              backgroundColor: colors.signOutBg,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.signOutBorder,
            }}>
            <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: colors.signOutBg,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.signOutBorder,
            }}>
            <Text style={{ color: colors.signOutText, fontSize: 14 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Balance Card */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ 
            borderRadius: 24, 
            padding: 24, 
            overflow: 'hidden', 
            backgroundColor: colors.balanceCardBg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}>

            <View style={{ position: 'relative' }}>
              <Text style={{ color: colors.balanceCardLabel, fontSize: 13, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>CURRENT BALANCE</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 38, fontWeight: 'bold', marginBottom: 4 }}>{formatCurrency(currentBalance)}</Text>
              
              <View style={{ height: 1, backgroundColor: colors.balanceCardDivider, marginVertical: 16 }} />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: colors.balanceCardLabel, fontSize: 11, fontWeight: '500', marginBottom: 2 }}>TOTAL ADDED</Text>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{formatCurrency(totalBalance)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.balanceCardLabel, fontSize: 11, fontWeight: '500', marginBottom: 2 }}>TOTAL SPENT</Text>
                  <Text style={{ color: isDark ? '#FDA4AF' : '#FCA5A5', fontWeight: '700', fontSize: 16 }}>{formatCurrency(totalExpenses)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Spending Limits Card */}
        {(dailyLimitObj || weeklyLimitObj) && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.borderPrimary }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>Spending Limits</Text>
                <TouchableOpacity onPress={() => setShowLimits(true)}>
                  <Text style={{ color: colors.accent, fontSize: 14 }}>Edit</Text>
                </TouchableOpacity>
              </View>
              {dailyLimitObj && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Daily</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {formatCurrency(todayExpenses)} / {formatCurrency(dailyLimitObj.amount)}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: colors.progressBg, borderRadius: 99, height: 8 }}>
                    <View
                      style={{
                        borderRadius: 99, height: 8,
                        backgroundColor: todayExpenses / dailyLimitObj.amount > 0.8 ? colors.danger : colors.accent,
                        width: `${Math.min((todayExpenses / dailyLimitObj.amount) * 100, 100)}%`,
                      }}
                    />
                  </View>
                  <Text style={{
                    fontSize: 12, marginTop: 4,
                    color: todayExpenses >= dailyLimitObj.amount ? colors.danger : colors.success,
                  }}>
                    {todayExpenses >= dailyLimitObj.amount
                      ? `⚠️ Limit reached! Over by ${formatCurrency(todayExpenses - dailyLimitObj.amount)}`
                      : `✓ ${formatCurrency(dailyLimitObj.amount - todayExpenses)} remaining today`}
                  </Text>
                </View>
              )}
              {weeklyLimitObj && (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Weekly</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {formatCurrency(weeklyExpenses)} / {formatCurrency(weeklyLimitObj.amount)}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: colors.progressBg, borderRadius: 99, height: 8 }}>
                    <View
                      style={{
                        borderRadius: 99, height: 8,
                        backgroundColor: weeklyExpenses / weeklyLimitObj.amount > 0.8 ? colors.danger : '#8b5cf6',
                        width: `${Math.min((weeklyExpenses / weeklyLimitObj.amount) * 100, 100)}%`,
                      }}
                    />
                  </View>
                  <Text style={{
                    fontSize: 12, marginTop: 4,
                    color: weeklyExpenses >= weeklyLimitObj.amount ? colors.danger : colors.success,
                  }}>
                    {weeklyExpenses >= weeklyLimitObj.amount
                      ? `⚠️ Limit reached! Over by ${formatCurrency(weeklyExpenses - weeklyLimitObj.amount)}`
                      : `✓ ${formatCurrency(weeklyLimitObj.amount - weeklyExpenses)} remaining this week`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ marginHorizontal: 20, flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.btnPrimaryBg, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            onPress={() => setShowAddBudget(true)}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>💵</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Add Budget</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.btnDangerBg, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            onPress={() => setShowAddExpense(true)}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🛒</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.btnSecondaryBg, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
            onPress={() => setShowLimits(true)}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🎯</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>Set Limits</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{
          marginHorizontal: 20, flexDirection: 'row',
          backgroundColor: colors.tabBg, borderRadius: 16,
          padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.borderPrimary,
        }}>
          <TouchableOpacity
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
              backgroundColor: activeTab === 'history' ? colors.tabActiveBg : 'transparent',
            }}
            onPress={() => setActiveTab('history')}>
            <Text style={{
              fontWeight: '600', fontSize: 14,
              color: activeTab === 'history' ? colors.tabActiveText : colors.tabInactiveText,
            }}>
              Expense History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
              backgroundColor: activeTab === 'budgets' ? colors.tabActiveBg : 'transparent',
            }}
            onPress={() => setActiveTab('budgets')}>
            <Text style={{
              fontWeight: '600', fontSize: 14,
              color: activeTab === 'budgets' ? colors.tabActiveText : colors.tabInactiveText,
            }}>
              Budget Entries
            </Text>
          </TouchableOpacity>
        </View>

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={{ marginHorizontal: 20 }}>
            {expenses.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🧾</Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No expenses recorded yet</Text>
              </View>
            ) : (
              expenses.map((expense) => (
                <View
                  key={expense.id}
                  style={{
                    backgroundColor: colors.bgCard, borderRadius: 16,
                    padding: 16, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.borderPrimary,
                    flexDirection: 'row', alignItems: 'center',
                  }}>
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                      backgroundColor: (CATEGORY_COLORS[expense.category] || '#94a3b8') + '20',
                    }}>
                    <Text style={{ fontSize: 16 }}>
                      {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)?.label.split(' ')[0] || '💸'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                      {expense.description || expense.category}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {expense.category} · {formatDate(expense.expense_date)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.danger, fontWeight: 'bold' }}>-{formatCurrency(expense.amount)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <View style={{ marginHorizontal: 20 }}>
            {budgets.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>💰</Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No budget entries yet. Add your first budget!</Text>
              </View>
            ) : (
              budgets.map((budget) => (
                <View
                  key={budget.id}
                  style={{
                    backgroundColor: colors.bgCard, borderRadius: 16,
                    padding: 16, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.borderPrimary,
                    flexDirection: 'row', alignItems: 'center',
                  }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: colors.accentLight,
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 16 }}>💵</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{budget.description || 'Budget'}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      Added on{' '}
                      {new Date(budget.created_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={{ color: colors.success, fontWeight: 'bold' }}>+{formatCurrency(budget.amount)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ADD BUDGET MODAL */}
      <Modal visible={showAddBudget} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: colors.bgOverlay, justifyContent: 'flex-end' }} onPress={() => setShowAddBudget(false)}>
            <Pressable onPress={Keyboard.dismiss}>
              <View style={{ backgroundColor: colors.bgModal, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderTopColor: colors.borderPrimary }}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.modalHandle, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add Budget</Text>

                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Amount (₱)</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.bgInput, color: colors.textPrimary,
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                    borderWidth: 1, borderColor: colors.borderInput, marginBottom: 16, fontSize: 18,
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="numeric"
                />

                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Description (optional)</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.bgInput, color: colors.textPrimary,
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                    borderWidth: 1, borderColor: colors.borderInput, marginBottom: 24,
                  }}
                  placeholder="e.g. Monthly salary"
                  placeholderTextColor={colors.placeholder}
                  value={budgetDesc}
                  onChangeText={setBudgetDesc}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.btnSecondaryBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                    onPress={() => setShowAddBudget(false)}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.btnPrimaryBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                    onPress={handleAddBudget}>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Add Budget</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ADD EXPENSE MODAL */}
      <Modal visible={showAddExpense} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: colors.bgOverlay, justifyContent: 'flex-end' }} onPress={() => setShowAddExpense(false)}>
            <Pressable onPress={Keyboard.dismiss}>
              <View style={{ backgroundColor: colors.bgModal, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderTopWidth: 1, borderTopColor: colors.borderPrimary, maxHeight: '90%' }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ width: 40, height: 4, backgroundColor: colors.modalHandle, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Add Expense</Text>

                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Amount (₱)</Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.bgInput, color: colors.textPrimary,
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                      borderWidth: 1, borderColor: colors.borderInput, marginBottom: 16, fontSize: 18,
                    }}
                    placeholder="0.00"
                    placeholderTextColor={colors.placeholder}
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                    keyboardType="numeric"
                  />

                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Description (optional)</Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.bgInput, color: colors.textPrimary,
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                      borderWidth: 1, borderColor: colors.borderInput, marginBottom: 16,
                    }}
                    placeholder="What did you buy?"
                    placeholderTextColor={colors.placeholder}
                    value={expenseDesc}
                    onChangeText={setExpenseDesc}
                  />

                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8, marginLeft: 4 }}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.value}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 8,
                            borderRadius: 12, borderWidth: 1,
                            borderColor: expenseCategory === cat.value ? colors.chipActiveBorder : colors.chipBorder,
                            backgroundColor: expenseCategory === cat.value ? colors.chipActiveBg : colors.chipBg,
                          }}
                          onPress={() => setExpenseCategory(cat.value)}>
                          <Text style={{
                            fontSize: 14,
                            color: expenseCategory === cat.value ? colors.chipActiveText : colors.chipText,
                          }}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.bgInput, color: colors.textPrimary,
                      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                      borderWidth: 1, borderColor: colors.borderInput, marginBottom: 24,
                    }}
                    placeholder="2025-01-01"
                    placeholderTextColor={colors.placeholder}
                    value={expenseDate}
                    onChangeText={setExpenseDate}
                  />

                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: colors.btnSecondaryBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                      onPress={() => setShowAddExpense(false)}>
                      <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: colors.btnDangerBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                      onPress={handleAddExpense}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Add Expense</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* SPENDING LIMITS MODAL */}
      <Modal visible={showLimits} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: colors.bgOverlay, justifyContent: 'flex-end' }} onPress={() => setShowLimits(false)}>
            <Pressable onPress={Keyboard.dismiss}>
              <View style={{ backgroundColor: colors.bgModal, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderTopColor: colors.borderPrimary }}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.modalHandle, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Spending Limits</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
                  Set daily and weekly spending limits to stay on track.
                </Text>

                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Daily Limit (₱)</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.bgInput, color: colors.textPrimary,
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                    borderWidth: 1, borderColor: colors.borderInput, marginBottom: 16,
                  }}
                  placeholder={dailyLimitObj ? `Current: ₱${dailyLimitObj.amount}` : '0.00'}
                  placeholderTextColor={colors.placeholder}
                  value={dailyLimit}
                  onChangeText={setDailyLimit}
                  keyboardType="numeric"
                />

                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 6, marginLeft: 4 }}>Weekly Limit (₱)</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.bgInput, color: colors.textPrimary,
                    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                    borderWidth: 1, borderColor: colors.borderInput, marginBottom: 24,
                  }}
                  placeholder={weeklyLimitObj ? `Current: ₱${weeklyLimitObj.amount}` : '0.00'}
                  placeholderTextColor={colors.placeholder}
                  value={weeklyLimit}
                  onChangeText={setWeeklyLimit}
                  keyboardType="numeric"
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.btnSecondaryBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                    onPress={() => setShowLimits(false)}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.btnPrimaryBg, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                    onPress={handleSaveLimits}>
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Save Limits</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
