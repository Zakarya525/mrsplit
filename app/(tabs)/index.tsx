import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { Plus, DollarSign, TrendingUp, Users } from 'lucide-react-native';

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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch user's balance calculation
      const { data: splits, error: splitsError } = await supabase
        .from('splits')
        .select(`
          share_amount,
          expense:expenses!inner(
            amount,
            payer_id,
            group_id
          )
        `)
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
        .select(`
          id,
          title,
          amount,
          created_at,
          payer:users!payer_id(name),
          group:groups!group_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (expensesError) throw expensesError;

      const formattedExpenses = expenses?.map((expense) => ({
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
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
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

  const renderExpenseItem = ({ item }: { item: RecentExpense }) => (
    <Card style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseAmount}>
          {formatCurrency(parseFloat(item.amount))}
        </Text>
      </View>
      <Text style={styles.expenseDetails}>
        Paid by {item.payer_name} • {item.group_name}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Your expense overview</Text>
        </View>

        {/* Balance Overview */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <DollarSign size={24} color="#007AFF" />
            <Text style={styles.balanceTitle}>Your Balance</Text>
          </View>
          
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>You owe</Text>
              <Text style={[styles.balanceValue, styles.negativeBalance]}>
                {formatCurrency(balance.totalOwing)}
              </Text>
            </View>
            
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>You're owed</Text>
              <Text style={[styles.balanceValue, styles.positiveBalance]}>
                {formatCurrency(balance.totalOwed)}
              </Text>
            </View>
          </View>
          
          <View style={styles.netBalanceContainer}>
            <Text style={styles.netBalanceLabel}>Net Balance</Text>
            <Text style={[
              styles.netBalanceValue,
              balance.netBalance >= 0 ? styles.positiveBalance : styles.negativeBalance
            ]}>
              {formatCurrency(Math.abs(balance.netBalance))}
            </Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Users size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {recentExpenses.length > 0 ? (
            <FlatList
              data={recentExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Card>
              <Text style={styles.emptyText}>No recent expenses</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  positiveBalance: {
    color: '#34C759',
  },
  negativeBalance: {
    color: '#FF3B30',
  },
  netBalanceContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netBalanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  netBalanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  expenseCard: {
    marginBottom: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  expenseDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    padding: 20,
  },
});