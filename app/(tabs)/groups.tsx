import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Plus, Users, Settings } from 'lucide-react-native';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, radii, font } from '@/components/ui/theme';

interface Group {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
  role: string;
}

export default function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          role,
          group:groups!inner(
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching groups:', error);
        Alert.alert('Error', 'Failed to load groups');
        return;
      }

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        data?.map(async (item) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', (item.group as any).id);

          return {
            id: (item.group as any).id,
            name: (item.group as any).name,
            description: (item.group as any).description,
            member_count: count || 0,
            created_at: (item.group as any).created_at,
            role: item.role,
          };
        }) || []
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity onPress={() => handleGroupPress(item)}>
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Users size={24} color={colors.primary} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.groupDescription}>{item.description}</Text>
            )}
            <Text style={styles.groupMeta}>
              {item.member_count} members • {item.role}
            </Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const handleGroupPress = (group: Group) => {
    Alert.alert('Group Details', `Selected: ${group.name}`);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.loadingContainer}
      >
        <View style={styles.loadingContent}>
          <Users size={32} color={colors.white} />
          <Text style={styles.loadingText}>Loading groups...</Text>
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
            <Text style={styles.title}>Your Groups</Text>
            <TouchableOpacity
              onPress={handleCreateGroup}
              style={styles.createButton}
            >
              <LinearGradient
                colors={colors.gradientDanger}
                style={styles.createButtonGradient}
              >
                <Plus size={24} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
      {groups.length > 0 ? (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
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
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyDescription}>
            Create a group to start splitting expenses with friends and family
          </Text>
          <TouchableOpacity onPress={handleCreateGroup}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.createFirstButton}
            >
              <Text style={styles.createFirstButtonText}>
                Create Your First Group
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      )}
      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={fetchGroups}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonGradient: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  groupCard: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: font.size.lg,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: font.size.sm,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: font.size.xs,
    color: colors.textTertiary,
  },
  settingsButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  createFirstButton: {
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  createFirstButtonText: {
    color: colors.white,
    fontSize: font.size.md,
    fontWeight: '700',
    textAlign: 'center',
  },
});
