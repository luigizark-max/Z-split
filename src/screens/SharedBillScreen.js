import React, { useState, useEffect, useCallback } from 'react';
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
import { subscribeToSession, updateItemSelection } from '../services/sessionService';
import { getCurrentUser } from '../services/auth';

const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export const SharedBillScreen = ({ route, navigation }) => {
  const { sessionCode } = route.params;
  const user = getCurrentUser();
  const [session, setSession] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [myTotal, setMyTotal] = useState(0);

  // Subscribe to real-time session updates
  useEffect(() => {
    const unsubscribe = subscribeToSession(sessionCode, (data) => {
      if (data) {
        setSession(data);

        // Calculate my total
        const me = data.participants?.[user.phone];
        if (me) {
          setMyTotal(me.totalOwed || 0);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionCode, user.phone]);

  // Handle item tap
  const handleItemTap = async (itemId) => {
    await updateItemSelection({
      sessionCode,
      itemId,
      userPhone: user.phone
    });
  };

  // Get user color
  const getUserColor = (phone) => {
    const participants = session?.participants ? Object.values(session.participants) : [];
    const index = participants.findIndex(p => p.phone === phone);
    return userColors[(index >= 0 ? index : 0) % userColors.length];
  };

  // Get user initial
  const getUserInitial = (phone) => {
    const participant = session?.participants?.[phone];
    return participant?.name?.charAt(0).toUpperCase() || '?';
  };

  // Get participant list
  const getParticipants = () => {
    if (!session?.participants) return [];
    return Object.values(session.participants);
  };

  // Refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
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

  const isHost = session.hostPhone === user.phone;
  const isComplete = session.status === 'complete' || session.status === 'payment';
  const participants = getParticipants();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Splitting Bill</Text>
          <Text style={styles.headerCode}>{sessionCode}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Summary', { sessionCode })}
          style={styles.summaryBtn}
        >
          <Ionicons name="receipt-outline" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Participants Bar */}
      <View style={styles.participantsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {participants.map((p) => (
            <View key={p.phone} style={styles.participantChip}>
              <View style={[styles.participantAvatar, { backgroundColor: getUserColor(p.phone) }]}>
                <Text style={styles.participantInitial}>
                  {p.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={styles.participantName} numberOfLines={1}>
                {p.name}
                {p.isHost ? ' 👑' : ''}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* My Total */}
      <View style={styles.myTotalBar}>
        <View>
          <Text style={styles.myTotalLabel}>My Total</Text>
          <Text style={styles.myTotalAmount}>${myTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewSummaryBtn}
          onPress={() => navigation.navigate('Summary', { sessionCode })}
        >
          <Text style={styles.viewSummaryText}>View Summary</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <ScrollView
        style={styles.itemsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Tap items you ordered</Text>

        {(session.items || []).map((item) => {
          const isSelected = (item.selectedBy || []).includes(user.phone);
          const hasOthers = (item.selectedBy || []).length > 1;
          const splitCount = (item.selectedBy || []).length;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                isSelected && styles.itemCardSelected,
              ]}
              onPress={() => handleItemTap(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={[
                  styles.checkCircle,
                  isSelected && styles.checkCircleSelected,
                ]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={Colors.surface} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[
                    styles.itemName,
                    isSelected && styles.itemNameSelected,
                  ]}>
                    {item.name}
                  </Text>
                  {hasOthers && (
                    <Text style={styles.splitInfo}>
                      Split {splitCount} ways (${(item.price / splitCount).toFixed(2)} each)
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.itemRight}>
                <Text style={[
                  styles.itemPrice,
                  isSelected && styles.itemPriceSelected,
                ]}>
                  ${item.price.toFixed(2)}
                </Text>

                {/* Avatars of who selected */}
                {(item.selectedBy || []).length > 0 && (
                  <View style={styles.selectedAvatars}>
                    {(item.selectedBy || []).map((phone) => (
                      <View
                        key={phone}
                        style={[
                          styles.miniAvatar,
                          { backgroundColor: getUserColor(phone) },
                        ]}
                      >
                        <Text style={styles.miniAvatarText}>
                          {getUserInitial(phone)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {isHost && (
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => navigation.navigate('PaymentSettlement', { sessionCode })}
            activeOpacity={0.8}
          >
            <Text style={styles.finishBtnText}>Start Payment</Text>
            <Ionicons name="arrow-forward" size={24} color={Colors.surface} />
          </TouchableOpacity>
        )}
        {!isHost && (
          <View style={styles.waitingBanner}>
            <Text style={styles.waitingText}>Waiting for host to start payment...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: FontSizes.h3,
    color: Colors.textSecondary
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: {
    padding: 8
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.surface
  },
  headerCode: {
    fontSize: FontSizes.sm,
    color: Colors.surface,
    opacity: 0.8
  },
  summaryBtn: {
    padding: 8
  },
  participantsBar: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md
          },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    gap: 6
  },
  participantAvatar: {
    width: 28,
    height: 28,
        alignItems: 'center',
    justifyContent: 'center'
  },
  participantInitial: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 12
  },
  participantName: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    maxWidth: 80
  },
  myTotalBar: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
          },
  myTotalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary
  },
  myTotalAmount: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.primary
  },
  viewSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  viewSummaryText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.primary
  },
  itemsList: {
    flex: 1,
    padding: Spacing.md
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
        padding: Spacing.md,
    marginBottom: 8
          },
  itemCardSelected: {
        backgroundColor: '#F5F3FF'
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  checkCircle: {
    width: 24,
    height: 24,
                alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md
  },
  checkCircleSelected: {
    backgroundColor: Colors.primary
      },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: FontSizes.body,
    fontWeight: '500',
    color: Colors.textPrimary
  },
  itemNameSelected: {
    color: Colors.primary,
    fontWeight: '600'
  },
  splitInfo: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2
  },
  itemRight: {
    alignItems: 'flex-end'
  },
  itemPrice: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  itemPriceSelected: {
    color: Colors.primary
  },
  selectedAvatars: {
    flexDirection: 'row',
    marginTop: 4
  },
  miniAvatar: {
    width: 20,
    height: 20,
        alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6
          },
  miniAvatarText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 9
  },
  bottomAction: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface
          },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
        paddingVertical: Spacing.lg
  },
  finishBtnText: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.surface
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
        paddingVertical: Spacing.lg
  },
  waitingText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontWeight: '500'
  }
});
