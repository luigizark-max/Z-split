import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { subscribeToSession, setPaymentMethod, confirmCashReceived, confirmBankPayment } from '../services/sessionService';
import { getCurrentUser } from '../services/auth';

const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

export const PaymentSettlementScreen = ({ route, navigation }) => {
  const { sessionCode } = route.params;
  const user = getCurrentUser();
  const [session, setSession] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToSession(sessionCode, (data) => {
      if (data) {
        setSession(data);
        const me = data.participants?.[user.phone];
        if (me?.paymentMethod) {
          setSelectedPayment(me.paymentMethod);
        }
      }
    });
    return () => unsubscribe();
  }, [sessionCode]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSelectPayment = async (method) => {
    setSelectedPayment(method);
    const updated = await setPaymentMethod({ sessionCode, userPhone: user.phone, method });
    if (updated) setSession(updated);
  };

  const handleConfirmCashReceived = (participantPhone) => {
    const participant = session.participants?.[participantPhone];
    Alert.alert(
      'Confirm Cash Received',
      `Mark ${participant?.name}'s payment as received?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const updated = await confirmCashReceived({ sessionCode, userPhone: participantPhone });
            if (updated) setSession(updated);
          }
        },
      ]
    );
  };

  const getUserColor = (phone) => {
    const participants = session?.participants ? Object.values(session.participants) : [];
    const index = participants.findIndex(p => p.phone === phone);
    return userColors[(index >= 0 ? index : 0) % userColors.length];
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      </View>
    );
  }

  const isHost = session.hostPhone === user.phone;
  const myUser = session.participants?.[user.phone];
  const participants = session.participants ? Object.values(session.participants) : [];
  const allPaid = participants.every(p => p.isPaid);
  const isComplete = session.status === 'complete';

  // Calculate collected
  const collected = participants.reduce((sum, p) => p.isPaid ? sum + p.totalOwed : sum, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {isComplete && (
          <View style={styles.completeBanner}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.surface} />
            <Text style={styles.completeText}>All Payments Complete!</Text>
          </View>
        )}

        {/* My Payment */}
        {!isComplete && !myUser?.isHost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Payment</Text>
            <Text style={styles.myAmount}>${myUser?.totalOwed?.toFixed(2) || '0.00'}</Text>

            {!selectedPayment && (
              <View style={styles.paymentOptions}>
                <Text style={styles.optionLabel}>How are you paying?</Text>

                <TouchableOpacity style={styles.paymentOption} onPress={() => handleSelectPayment('cash')} activeOpacity={0.8}>
                  <View style={styles.paymentIcon}><Ionicons name="cash-outline" size={28} color={Colors.success} /></View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Pay in Cash</Text>
                    <Text style={styles.paymentDesc}>Give cash to the host</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.paymentOption} onPress={() => handleSelectPayment('bank')} activeOpacity={0.8}>
                  <View style={styles.paymentIcon}><Ionicons name="card-outline" size={28} color={Colors.primary} /></View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>Bank Transfer</Text>
                    <Text style={styles.paymentDesc}>Send via bank account</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {selectedPayment && (
              <View style={styles.selectedMethod}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.selectedText}>
                  {selectedPayment === 'cash'
                    ? `Cash payment selected — give $${myUser?.totalOwed?.toFixed(2)} to the host`
                    : `Bank transfer selected — send $${myUser?.totalOwed?.toFixed(2)} to host`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Host Section */}
        {isHost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Status</Text>
            <Text style={styles.hostInstructions}>
              You paid the full bill. Track who's paid below.
            </Text>

            {participants.filter(p => !p.isHost).map((p) => (
              <View key={p.phone} style={styles.personCard}>
                <View style={styles.personLeft}>
                  <View style={[styles.avatar, { backgroundColor: getUserColor(p.phone) }]}>
                    <Text style={styles.avatarText}>{p.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.personName}>{p.name}</Text>
                    <Text style={styles.personAmount}>Owes ${p.totalOwed?.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.personRight}>
                  {p.isPaid ? (
                    <View style={styles.paidBadge}><Ionicons name="checkmark-circle" size={20} color={Colors.success} /><Text style={styles.paidText}>Paid</Text></View>
                  ) : p.paymentMethod === 'cash' ? (
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirmCashReceived(p.phone)}>
                      <Text style={styles.confirmBtnText}>Got Cash</Text>
                    </TouchableOpacity>
                  ) : p.paymentMethod === 'bank' ? (
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmBankPayment({ sessionCode, userPhone: p.phone }).then(setSession)}>
                      <Text style={styles.confirmBtnText}>Confirm</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.pendingText}>Pending</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Non-host sees others */}
        {!isHost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Everyone's Status</Text>
            {participants.filter(p => !p.isHost).map((p) => (
              <View key={p.phone} style={styles.personCard}>
                <View style={styles.personLeft}>
                  <View style={[styles.avatar, { backgroundColor: getUserColor(p.phone) }]}>
                    <Text style={styles.avatarText}>{p.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.personName}>{p.name}</Text>
                    <Text style={styles.personAmount}>${p.totalOwed?.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.personRight}>
                  {p.isPaid ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  ) : p.paymentMethod === 'cash' ? (
                    <Text style={styles.pendingText}>Cash</Text>
                  ) : p.paymentMethod === 'bank' ? (
                    <Text style={styles.pendingText}>Bank</Text>
                  ) : (
                    <Text style={styles.pendingText}>...</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>${session.totalAmount?.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tax</Text><Text style={styles.summaryValue}>${session.tax?.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tip</Text><Text style={styles.summaryValue}>${session.tip?.toFixed(2)}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.grandLabel}>Total Paid</Text><Text style={styles.grandValue}>${session.grandTotal?.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Collected</Text><Text style={styles.collectedValue}>${collected.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.remainingValue, allPaid && { color: Colors.success }]}>
                ${(session.grandTotal - collected).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {isHost && allPaid && !isComplete && (
        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => Alert.alert('Close Session', 'Are you sure everyone has paid? This will close the bill.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Close Bill', onPress: () => navigation.navigate('Home') }])} activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={24} color={Colors.surface} />
            <Text style={styles.closeBtnText}>Close Bill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FontSizes.h3, color: Colors.textSecondary },
  header: { backgroundColor: Colors.primary, paddingTop: 60, paddingBottom: 16, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  content: { flex: 1 },
  completeBanner: { backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.lg, marginBottom: Spacing.md },
  completeText: { fontSize: FontSizes.h3, fontWeight: '700', color: Colors.surface },
  section: { padding: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  myAmount: { fontSize: 48, fontWeight: '700', color: Colors.primary, textAlign: 'center', marginBottom: Spacing.lg },
  paymentOptions: { gap: Spacing.md },
  optionLabel: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: 8 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg },
  paymentIcon: { width: 48, height: 48, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1, marginLeft: Spacing.md },
  paymentTitle: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.textPrimary },
  paymentDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  selectedMethod: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.md, gap: 12 },
  selectedText: { flex: 1, fontSize: FontSizes.body, color: Colors.textPrimary },
  hostInstructions: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: Spacing.lg, backgroundColor: Colors.surface,  padding: Spacing.md },
  personCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface,  padding: Spacing.md, marginBottom: 8 },
  personLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44,  alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: 18 },
  personName: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.textPrimary },
  personAmount: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  personRight: { alignItems: 'flex-end' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidText: { fontSize: FontSizes.sm, color: Colors.success, fontWeight: '600', marginLeft: 4 },
  pendingText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  confirmBtn: { backgroundColor: Colors.success, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  confirmBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.surface },
  summarySection: { padding: Spacing.lg },
  summaryCard: { backgroundColor: Colors.surface, padding: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSizes.body, fontWeight: '500', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  grandLabel: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary },
  grandValue: { fontSize: FontSizes.h3, fontWeight: '700', color: Colors.textPrimary },
  collectedValue: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.success },
  remainingValue: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.error },
  bottomAction: { padding: Spacing.lg, backgroundColor: Colors.surface },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.success, paddingVertical: Spacing.lg },
  closeBtnText: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface }
});
