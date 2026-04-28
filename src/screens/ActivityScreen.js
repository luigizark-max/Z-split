import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getCurrentUser } from '../services/auth';

// Demo data for past bills
const DEMO_BILLS = [
  {
    id: '1',
    name: 'Dinner at Olive Garden',
    date: '2026-04-25',
    total: 87.50,
    status: 'settled',
    participants: 4
  },
  {
    id: '2',
    name: 'Weekend Trip - Airbnb',
    date: '2026-04-20',
    total: 240.00,
    status: 'pending',
    participants: 6
  },
  {
    id: '3',
    name: 'Birthday Party - Drinks',
    date: '2026-04-15',
    total: 156.00,
    status: 'settled',
    participants: 8
  },
  {
    id: '4',
    name: 'Office Lunch',
    date: '2026-04-10',
    total: 45.00,
    status: 'settled',
    participants: 3
  }
];

export const ActivityScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState(DEMO_BILLS);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate fetch - in real app this would call your backend
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return status === 'settled' ? Colors.success : Colors.warning;
  };

  const getStatusIcon = (status) => {
    return status === 'settled' ? 'checkmark-circle' : 'time-outline';
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleBillPress = (bill) => {
    Alert.alert(
      bill.name,
      `${bill.participants} participants\nTotal: ${formatCurrency(bill.total)}\nStatus: ${bill.status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => {
            // Navigate to summary screen with bill data
            // navigation.navigate('Summary', { session: billData });
          }
        }
      ]
    );
  };

  const renderBillItem = ({ item }) => (
    <TouchableOpacity
      style={styles.billCard}
      onPress={() => handleBillPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.billHeader}>
        <View style={styles.billIcon}>
          <Ionicons name="receipt-outline" size={24} color={Colors.primary} />
        </View>
        <View style={styles.billInfo}>
          <Text style={styles.billName}>{item.name}</Text>
          <Text style={styles.billDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.billStatus}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={20}
            color={getStatusColor(item.status)}
          />
        </View>
      </View>

      <View style={styles.billFooter}>
        <View style={styles.billParticipants}>
          <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.participantsText}>{item.participants} people</Text>
        </View>
        <Text style={styles.billTotal}>{formatCurrency(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No bills yet</Text>
      <Text style={styles.emptySubtitle}>
        Your bill history will appear here once you create or join a bill
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{bills.length}</Text>
            <Text style={styles.summaryLabel}>Total Bills</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatCurrency(bills.reduce((sum, b) => sum + b.total, 0))}
            </Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {bills.filter(b => b.status === 'settled').length}
            </Text>
            <Text style={styles.summaryLabel}>Settled</Text>
          </View>
        </View>
      </View>

      {/* Bills List */}
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        renderItem={renderBillItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg
  },
  headerTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.surface
  },
  summarySection: {
    padding: Spacing.lg
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.background
  },
  summaryValue: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.primary
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0
  },
  billCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  billIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  billInfo: {
    flex: 1,
    marginLeft: Spacing.md
  },
  billName: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  billDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2
  },
  billStatus: {
    padding: 4
  },
  billFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  billParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  participantsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary
  },
  billTotal: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.primary
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2
  },
  emptyTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.lg
  },
  emptySubtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl
  }
});
