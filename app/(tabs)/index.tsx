import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react-native';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';

const { width } = Dimensions.get('window');

interface Balance {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
}

interface RecentExpense {
  id: string;
  title: string;
  amount: string;
  payer_name: string;
  group_name: string;
  created_at: string;
}

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [balance, setBalance] = useState<Balance>({
    totalOwed: 0,
    totalOwing: 0,
    netBalance: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      startAnimations();
    }
  }, [user]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);

      // Fetch user's balance calculation
      const { data: splits, error: splitsError } = await supabase
        .from('splits')
        .select(
          `
          share_amount,
          expense:expenses!inner(
            amount,
            payer_id,
            group_id
          )
        `
        )
        .eq('user_id', user?.id);

      if (splitsError) throw splitsError;

      let totalOwed = 0;
      let totalOwing = 0;

      splits?.forEach((split) => {
        const expense = split.expense as any;
        const shareAmount = parseFloat(split.share_amount);

        if (expense.payer_id === user?.id) {
          // User paid, others owe them
          totalOwed += parseFloat(expense.amount) - shareAmount;
        } else {
          // User owes the payer
          totalOwing += shareAmount;
        }
      });

      setBalance({
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing,
      });

      // Fetch recent expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(
          `
          id,
          title,
          amount,
          created_at,
          payer:users!payer_id(name),
          group:groups!group_id(name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      if (expensesError) throw expensesError;

      const formattedExpenses =
        expenses?.map((expense) => ({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          payer_name: (expense.payer as any)?.name || 'Unknown',
          group_name: (expense.group as any)?.name || 'Unknown',
          created_at: expense.created_at,
        })) || [];

      setRecentExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingContent}>
          <Sparkles size={32} color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderExpenseItem = ({
    item,
    index,
  }: {
    item: RecentExpense;
    index: number;
  }) => (
    <Animated.View
      style={[
        styles.expenseCardContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index * 10],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.expenseCardGradient}
      >
        <View style={styles.expenseIconContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.expenseIcon}
          >
            <DollarSign size={16} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <View style={styles.expenseContent}>
          <View style={styles.expenseHeader}>
            <Text style={styles.expenseTitle}>{item.title}</Text>
            <Text style={styles.expenseAmount}>
              {formatCurrency(parseFloat(item.amount))}
            </Text>
          </View>
          <Text style={styles.expenseDetails}>
            Paid by {item.payer_name} • {item.group_name}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Text style={styles.title}>Welcome back!</Text>
              <Text style={styles.subtitle}>Your expense overview</Text>
            </View>
            <View style={styles.headerIcon}>
              <Sparkles size={24} color="#FFFFFF" />
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Overview */}
        <Animated.View
          style={[
            styles.balanceCardContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={0} style={styles.balanceCardBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)']}
              style={styles.balanceCardGradient}
            >
              <View style={styles.balanceHeader}>
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.balanceIconContainer}
                >
                  <DollarSign size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.balanceTitle}>Your Balance</Text>
              </View>

              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <View style={styles.balanceItemHeader}>
                    <ArrowDown size={16} color="#FF6B6B" />
                    <Text style={styles.balanceLabel}>You owe</Text>
                  </View>
                  <Text style={[styles.balanceValue, styles.negativeBalance]}>
                    {formatCurrency(balance.totalOwing)}
                  </Text>
                </View>

                <View style={styles.balanceItem}>
                  <View style={styles.balanceItemHeader}>
                    <ArrowUp size={16} color="#4ECDC4" />
                    <Text style={styles.balanceLabel}>You're owed</Text>
                  </View>
                  <Text style={[styles.balanceValue, styles.positiveBalance]}>
                    {formatCurrency(balance.totalOwed)}
                  </Text>
                </View>
              </View>

              <View style={styles.netBalanceContainer}>
                <LinearGradient
                  colors={
                    balance.netBalance >= 0
                      ? ['#4ECDC4', '#44A08D']
                      : ['#FF6B6B', '#FF5252']
                  }
                  style={styles.netBalanceGradient}
                >
                  <View style={styles.netBalanceContent}>
                    <Text style={styles.netBalanceLabel}>Net Balance</Text>
                    <Text style={styles.netBalanceValue}>
                      {formatCurrency(Math.abs(balance.netBalance))}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActions,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddExpense(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF5252']}
              style={styles.actionButtonGradient}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateGroup(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
            >
              <Users size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Create Group</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Expenses */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <ArrowUp
                size={16}
                color="#667eea"
                style={{ transform: [{ rotate: '45deg' }] }}
              />
            </TouchableOpacity>
          </View>

          {recentExpenses.length > 0 ? (
            <FlatList
              data={recentExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.emptyStateGradient}
            >
              <Sparkles size={32} color="#C7C7CC" />
              <Text style={styles.emptyText}>No recent expenses</Text>
              <Text style={styles.emptySubtext}>
                Start by adding your first expense
              </Text>
            </LinearGradient>
          )}
        </Animated.View>
      </ScrollView>

      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={fetchDashboardData}
      />

      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onExpenseAdded={fetchDashboardData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  headerGradient: {
    paddingBottom: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerIcon: {
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  balanceCardContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    marginTop: 10,
  },
  balanceCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  balanceCardGradient: {
    padding: 24,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceItem: {
    flex: 1,
    paddingHorizontal: 8,
  },
  balanceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  positiveBalance: {
    color: '#4ECDC4',
  },
  negativeBalance: {
    color: '#FF6B6B',
  },
  netBalanceContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 147, 0.2)',
    paddingTop: 16,
  },
  netBalanceGradient: {
    borderRadius: 12,
    padding: 16,
  },
  netBalanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netBalanceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  netBalanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  expenseCardContainer: {
    marginBottom: 12,
  },
  expenseCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  expenseIconContainer: {
    marginRight: 16,
  },
  expenseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseContent: {
    flex: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  expenseDetails: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#C7C7CC',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
});
