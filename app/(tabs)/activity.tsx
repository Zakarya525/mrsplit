import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  Users,
  CircleCheck as CheckCircle,
  Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radii, font } from '@/components/ui/theme';

interface ActivityItem {
  id: string;
  type: 'expense_added' | 'settlement' | 'group_joined';
  title: string;
  description: string;
  amount?: number;
  group_name: string;
  created_at: string;
  user_name: string;
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // First get user's groups
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user?.id);

      if (groupsError) throw groupsError;

      const groupIds = userGroups?.map((g) => g.group_id) || [];

      if (groupIds.length === 0) {
        setActivities([]);
        return;
      }

      // Fetch recent expenses from user's groups
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
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (expensesError) throw expensesError;

      // Format activities
      const formattedActivities: ActivityItem[] =
        expenses?.map((expense) => ({
          id: expense.id,
          type: 'expense_added',
          title: 'Expense Added',
          description: `${(expense.payer as any)?.name} added "${
            expense.title
          }"`,
          amount: parseFloat(expense.amount),
          group_name: (expense.group as any)?.name || 'Unknown Group',
          created_at: expense.created_at,
          user_name: (expense.payer as any)?.name || 'Unknown User',
        })) || [];

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
        return <DollarSign size={20} color={colors.primary} />;
      case 'settlement':
        return <CheckCircle size={20} color={colors.primary} />;
      case 'group_joined':
        return <Users size={20} color={colors.warning} />;
      default:
        return <Clock size={20} color={colors.textTertiary} />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityIcon}>{getActivityIcon(item.type)}</View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityDescription}>{item.description}</Text>
          <View style={styles.activityMeta}>
            <Text style={styles.groupName}>{item.group_name}</Text>
            <Text style={styles.timeAgo}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>
        </View>
        {item.amount && (
          <Text style={styles.activityAmount}>
            {formatCurrency(item.amount)}
          </Text>
        )}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingContent}>
          <Users size={32} color={colors.white} />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <Text style={styles.title}>Activity Feed</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
      {activities.length > 0 ? (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <LinearGradient
          colors={colors.gradientCard}
          style={styles.emptyContainer}
        >
          <Users size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyDescription}>
            Activity from your groups will appear here
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.white,
    fontSize: font.size.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: '800',
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: font.size.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: font.size.sm,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: font.size.xs,
    color: colors.error,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: font.size.xs,
    color: colors.textTertiary,
  },
  activityAmount: {
    fontSize: font.size.md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radii.lg,
    margin: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: font.size.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyDescription: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: font.size.md,
    fontWeight: '500',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
});
