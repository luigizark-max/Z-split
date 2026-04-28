import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { subscribeToSession } from '../services/sessionService';
import QRCode from 'react-native-qrcode-svg';

export const LobbyScreen = ({ route, navigation }) => {
  const { session } = route.params;
  const [sessionData, setSessionData] = useState(session);
  const [copied, setCopied] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const { subscribeToSession } = require('../services/sessionService');
    const unsubscribe = subscribeToSession(session.joinCode, (data) => {
      if (data) {
        setSessionData(data);
      }
      setRefreshing(false);
    });
    return () => {
      unsubscribe();
      setRefreshing(false);
    };
  }, [session.joinCode]);

  useEffect(() => {
    const unsubscribe = subscribeToSession(session.joinCode, (data) => {
      if (data) {
        setSessionData(data);

        // Non-host: when session goes to "selecting" phase, move to bill
        if (data.status === 'selecting') {
          navigation.replace('SharedBill', { sessionCode: session.joinCode });
        }
      }
    });
    return () => unsubscribe();
  }, [session.joinCode]);

  const handleCopyCode = async () => {
    try {
      await Share.share({ message: session.joinCode });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Join Code', session.joinCode);
    }
  };

  const handleShareLink = async () => {
    const message = `Join my bill on Z-split!\n\nCode: ${session.joinCode}\n\nOpen: https://zsplit.app/join`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Share', message);
    }
  };

  const handleStart = async () => {
    const { updateSessionStatus } = await import('../services/sessionService');
    await updateSessionStatus(session.joinCode, 'selecting');
    navigation.replace('SharedBill', { sessionCode: session.joinCode });
  };

  const participants = sessionData?.participants ? Object.values(sessionData.participants) : [];
  const participantCount = participants.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lobby</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink}>
          <Ionicons name="share-social-outline" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Big Code Display */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.surface} />
        }
      >
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>Your Join Code</Text>
          <TouchableOpacity style={styles.codeBox} onPress={() => setShowCodeModal(true)}>
            <Text style={styles.codeText}>{session.joinCode}</Text>
            <Ionicons name="expand-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.codeHint}>Tap to enlarge and share</Text>
        </View>


        {/* Participants */}
        <View style={styles.participantsSection}>
          <View style={styles.participantsHeader}>
            <Text style={styles.participantsTitle}>Who's Here</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{participantCount}</Text>
            </View>
          </View>


          <Text style={styles.joinedText}>
            {participantCount === 1 ? '1 person joined' : `${participantCount} people joined`}
          </Text>

          <FlatList
            data={participants}
            keyExtractor={(p, index) => p.phone || index.toString()}
            renderItem={({ item, index }) => (
              <View key={item.phone} style={styles.participantCard}>
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}>
                  <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{item.name}</Text>
                  <Text style={styles.participantStatus}>✓ Joined</Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Ionicons name="arrow-forward-circle" size={24} color={Colors.surface} />
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </View>

      {/* Code Modal */}
      <Modal visible={showCodeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCodeModal(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share this code</Text>
            <View style={styles.modalCodeBox}>
              <Text style={styles.modalCodeText}>{session.joinCode}</Text>
            </View>
            
            {/* QR Code Display */}
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>Scan to join</Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={`https://zsplit.app/join/${session.joinCode}`}
                  size={200}
                  backgroundColor={Colors.surface}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.qrHint}>Or scan this QR code</Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleCopyCode}>
                <Ionicons name="copy-outline" size={24} color={Colors.surface} />
                <Text style={styles.modalBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSecondary]} onPress={handleShareLink}>
                <Ionicons name="share-outline" size={24} color={Colors.primary} />
                <Text style={[styles.modalBtnText, { color: Colors.primary }]}>Share</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>Send this to people you want to join</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getAvatarColor = (index) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  shareBtn: { padding: 8 },
  scrollContent: { flex: 1 },
  scrollContentContainer: { paddingBottom: Spacing.lg },
  codeSection: { backgroundColor: Colors.background, alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  codeLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.surface, opacity: 0.8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  codeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 40, paddingVertical: 24, gap: 12 },
  codeText: { fontSize: 48, fontWeight: '700', color: Colors.primary, letterSpacing: 8 },
  codeHint: { fontSize: FontSizes.sm, color: Colors.surface, opacity: 0.6, marginTop: 12 },
  participantsSection: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  participantsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  participantsTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary },
  countBadge: { backgroundColor: Colors.primary,  paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: Colors.surface, fontWeight: '600', fontSize: 14 },
  joinedText: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  participantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.md, marginBottom: 8, gap: 12 },
  avatar: { width: 44, height: 44,  alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.surface, fontWeight: '700', fontSize: 18 },
  participantInfo: { flex: 1 },
  participantName: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.textPrimary },
  participantStatus: { fontSize: FontSizes.sm, color: Colors.success },
  bottomAction: { padding: Spacing.lg, backgroundColor: Colors.surface },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.success, paddingVertical: Spacing.lg },
  startButtonText: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  qrSection: { alignItems: 'center', marginVertical: Spacing.lg },
  qrLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  qrContainer: { padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg },
  qrHint: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  modalContent: { backgroundColor: Colors.background, padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: FontSizes.h2, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  modalCodeBox: { backgroundColor: Colors.surface, paddingHorizontal: 40, paddingVertical: 24, marginBottom: Spacing.md },
  modalCodeText: { fontSize: 48, fontWeight: '700', color: Colors.primary, letterSpacing: 8 },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: Spacing.md },
  modalBtnSecondary: { backgroundColor: Colors.surface },
  modalBtnText: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.surface },
  modalHint: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' }
});
