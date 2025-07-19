import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { X, Check } from 'lucide-react-native';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

interface Group {
  id: string;
  name: string;
}

interface GroupMember {
  id: string;
  name: string;
  user_id: string;
}

export function AddExpenseModal({ visible, onClose, onExpenseAdded }: AddExpenseModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPayer, setSelectedPayer] = useState<GroupMember | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Group selection, 2: Expense details

  useEffect(() => {
    if (visible) {
      fetchUserGroups();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers();
    }
  }, [selectedGroup]);

  const fetchUserGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group:groups!inner(
            id,
            name
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const userGroups = data?.map((item) => ({
        id: (item.group as any).id,
        name: (item.group as any).name,
      })) || [];

      setGroups(userGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchGroupMembers = async () => {
    if (!selectedGroup) return;

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user:users!inner(
            id,
            name
          )
        `)
        .eq('group_id', selectedGroup.id);

      if (error) throw error;

      const members = data?.map((item) => ({
        id: item.id,
        name: (item.user as any).name,
        user_id: (item.user as any).id,
      })) || [];

      setGroupMembers(members);
      
      // Auto-select current user as payer
      const currentUserMember = members.find(m => m.user_id === user?.id);
      if (currentUserMember) {
        setSelectedPayer(currentUserMember);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!title.trim() || !amount.trim() || !selectedGroup || !selectedPayer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Create the expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: selectedGroup.id,
          title: title.trim(),
          amount: expenseAmount.toFixed(2),
          payer_id: selectedPayer.user_id,
          description: description.trim() || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create equal splits for all group members
      const splitAmount = expenseAmount / groupMembers.length;
      const splits = groupMembers.map(member => ({
        expense_id: expense.id,
        user_id: member.user_id,
        share_amount: splitAmount.toFixed(2),
      }));

      const { error: splitsError } = await supabase
        .from('splits')
        .insert(splits);

      if (splitsError) throw splitsError;

      Alert.alert('Success', 'Expense added successfully!');
      resetForm();
      onExpenseAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDescription('');
    setSelectedGroup(null);
    setSelectedPayer(null);
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedGroup(item);
        setStep(2);
      }}
      style={styles.groupItem}
    >
      <Card style={styles.groupCard}>
        <Text style={styles.groupName}>{item.name}</Text>
      </Card>
    </TouchableOpacity>
  );

  const renderPayerItem = ({ item }: { item: GroupMember }) => (
    <TouchableOpacity
      onPress={() => setSelectedPayer(item)}
      style={styles.payerItem}
    >
      <View style={[
        styles.payerCard,
        selectedPayer?.id === item.id && styles.selectedPayerCard
      ]}>
        <Text style={[
          styles.payerName,
          selectedPayer?.id === item.id && styles.selectedPayerName
        ]}>
          {item.name}
        </Text>
        {selectedPayer?.id === item.id && (
          <Check size={20} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 1 ? 'Select Group' : 'Add Expense'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {step === 1 ? (
          <View style={styles.content}>
            <Text style={styles.subtitle}>Choose a group to add the expense to:</Text>
            <FlatList
              data={groups}
              renderItem={renderGroupItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <View style={styles.content}>
            <Card style={styles.formCard}>
              <Text style={styles.selectedGroupText}>
                Group: {selectedGroup?.name}
              </Text>
              
              <Input
                label="Expense Title"
                value={title}
                onChangeText={setTitle}
                placeholder="What did you spend on?"
                autoCapitalize="words"
              />
              
              <Input
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
              
              <Input
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="Add details..."
                multiline
                numberOfLines={2}
                style={styles.descriptionInput}
              />

              <Text style={styles.payerLabel}>Who paid?</Text>
              <FlatList
                data={groupMembers}
                renderItem={renderPayerItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.payerList}
              />
              
              <View style={styles.buttonRow}>
                <Button
                  title="Back"
                  onPress={() => setStep(1)}
                  variant="secondary"
                  style={styles.backButton}
                />
                <Button
                  title="Add Expense"
                  onPress={handleAddExpense}
                  loading={loading}
                  style={styles.addButton}
                />
              </View>
            </Card>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  groupItem: {
    marginBottom: 12,
  },
  groupCard: {
    marginBottom: 0,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  formCard: {
    marginBottom: 0,
  },
  selectedGroupText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  descriptionInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  payerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    marginTop: 8,
  },
  payerList: {
    marginBottom: 24,
  },
  payerItem: {
    marginRight: 12,
  },
  payerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPayerCard: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  payerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  selectedPayerName: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  addButton: {
    flex: 2,
  },
});