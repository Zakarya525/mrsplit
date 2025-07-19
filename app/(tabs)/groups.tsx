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

      if (error) throw error;

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
    Alert.alert('Create Group', 'Group creation feature coming soon!');
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity onPress={() => handleGroupPress(item)}>
      <Card style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Users size={24} color="#007AFF" />
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
            <Settings size={20} color="#8E8E93" />
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Groups</Text>
        <TouchableOpacity onPress={handleCreateGroup} style={styles.createButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {groups.length > 0 ? (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Users size={64} color="#D1D1D6" />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyDescription}>
            Create a group to start splitting expenses with friends and family
          </Text>
          <Button
            title="Create Your First Group"
            onPress={handleCreateGroup}
            style={styles.createFirstButton}
          />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  settingsButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 32,
  },
  createFirstButton: {
    paddingHorizontal: 32,
  },
});