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
import { DollarSign, Users, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';

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
      
      // Fetch recent expenses from user's groups
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          title,
          amount,
          created_at,
          payer:users!payer_id(name),
          group:groups!group_id(name),
          group_members!inner(group_id)
        `)
        .eq('group_members.user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (expensesError) throw expensesError;

      // Format activities
      const formattedActivities: ActivityItem[] = expenses?.map((expense) => ({
        id: expense.id,
        type: 'expense_added',
        title: 'Expense Added',
        description: `${(expense.payer as any)?.name} added "${expense.title}"`,
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
        return <DollarSign size={20} color="#007AFF" />;
      case 'settlement':
        return <CheckCircle size={20} color="#34C759" />;
      case 'group_joined':
        return <Users size={20} color="#FF9500" />;
      default:
        return <Clock size={20} color="#8E8E93" />;
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
        <View style={styles.activityIcon}>
          {getActivityIcon(item.type)}
        </View>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading activity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Feed</Text>
      </View>

      {activities.length > 0 ? (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Clock size={64} color="#D1D1D6" />
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyDescription}>
            Activity from your groups will appear here
          </Text>
        </View>
      )}
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
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
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
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#8E8E93',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});