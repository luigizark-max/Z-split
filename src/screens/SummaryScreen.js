import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { subscribeToSession } from '../services/sessionService';
import { getCurrentUser } from '../services/auth';

const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export const SummaryScreen = ({ route, navigation }) => {
  const { sessionCode } = route.params;
  const user = getCurrentUser();
  const [session, setSession] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSession(sessionCode, (data) => {
      if (data) setSession(data);
    });
    return () => unsubscribe();
  }, [sessionCode]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const getUserColor = (phone) => {
    const participants = session?.participants ? Object.values(session.participants) : [];
    const index = participants.findIndex(p => p.phone === phone);
    return userColors[(index >= 0 ? index : 0) % userColors.length];
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const myUser = session.participants?.[user.phone];
  const myItems = (session.items || []).filter(item => (item.selectedBy || []).includes(user.phone));
  const participants = session.participants ? Object.values(session.participants) : [];

  // Calculate tax & tip proportionally
  const taxPortion = myUser ? (myUser.totalOwed / session.totalAmount) * session.tax : 0;
  const tipPortion = myUser ? (myUser.totalOwed / session.totalAmount) * session.tip : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* My Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Items</Text>

          {myItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items selected yet</Text>
            </View>
          ) : (
            myItems.map((item) => {
              const splitCount = (item.selectedBy || []).length;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {splitCount > 1 && (
                      <Text style={styles.splitText}>
                        Split {splitCount} ways → ${(item.price / splitCount).toFixed(2)} each
                      </Text>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>
                    ${(item.price / splitCount).toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* My Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${myUser?.totalOwed?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>${taxPortion.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tip</Text>
            <Text style={styles.totalValue}>${tipPortion.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>My Total</Text>
            <Text style={styles.grandTotalValue}>
              ${((myUser?.totalOwed || 0) + taxPortion + tipPortion).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Everyone's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Everyone</Text>

          {participants.map((p) => (
            <View key={p.phone} style={styles.participantRow}>
              <View style={styles.participantLeft}>
                <View style={[styles.avatar, { backgroundColor: getUserColor(p.phone) }]}>
                  <Text style={styles.avatarText}>
                    {p.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.participantName}>
                    {p.name}
                    {p.isHost ? ' (Host)' : ''}
                  </Text>
                  <Text style={styles.itemCount}>
                    {p.totalOwed > 0 ? `$${p.totalOwed.toFixed(2)}` : 'No items'}
                  </Text>
                </View>
              </View>
              <View style={styles.participantRight}>
                <Text style={styles.participantTotal}>${p.totalOwed?.toFixed(2) || '0.00'}</Text>
                {p.isPaid && (
                  <View style={styles.paidBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.paidText}>Paid</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Bill Total */}
        <View style={styles.billTotalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.billTotalLabel}>Bill Total</Text>
            <Text style={styles.billTotalValue}>${session.grandTotal?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('PaymentSettlement', { sessionCode })}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FontSizes.h3, color: Colors.textSecondary },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  content: { flex: 1 },
  section: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  emptyState: { backgroundColor: Colors.surface,  padding: Spacing.lg, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.body },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface,  padding: Spacing.md, marginBottom: 8 },
  itemLeft: { flex: 1 },
  itemName: { fontSize: FontSizes.body, fontWeight: '500', color: Colors.textPrimary },
  splitText: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.textPrimary },
  totalSection: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg,  padding: Spacing.lg, marginBottom: Spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  totalValue: { fontSize: FontSizes.body, fontWeight: '500', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  grandTotalLabel: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary },
  grandTotalValue: { fontSize: FontSizes.h2, fontWeight: '700', color: Colors.primary },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface,  padding: Spacing.md, marginBottom: 8 },
  participantLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40,  alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.surface, fontWeight: '600', fontSize: 16 },
  participantName: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.textPrimary },
  itemCount: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  participantRight: { alignItems: 'flex-end' },
  participantTotal: { fontSize: FontSizes.body, fontWeight: '700', color: Colors.textPrimary },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  paidText: { fontSize: FontSizes.sm, color: Colors.success, fontWeight: '500' },
  billTotalSection: { backgroundColor: Colors.primary, marginHorizontal: Spacing.lg,  padding: Spacing.lg, marginBottom: Spacing.lg },
  billTotalLabel: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  billTotalValue: { fontSize: FontSizes.h1, fontWeight: '700', color: Colors.surface },
  bottomAction: { padding: Spacing.lg, backgroundColor: Colors.surface },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: Spacing.lg },
  continueBtnText: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface }
});
