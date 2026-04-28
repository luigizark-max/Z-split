import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { subscribeToSession } from '../services/sessionService';

export const ShareBillScreen = ({ route, navigation }) => {
  const { session } = route.params;
  const [sessionData, setSessionData] = useState(session);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSession(session.joinCode, (data) => {
      if (data) setSessionData(data);
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
    const message = `Join my bill on Z-split!\n\nCode: ${session.joinCode}\n\nOpen: https://zsplit.app/join/${session.joinCode}`;
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Share', message);
    }
  };

  const handleStartSelecting = () => {
    navigation.replace('SharedBill', { sessionCode: session.joinCode });
  };

  const participantCount = sessionData?.participants ? Object.keys(sessionData.participants).length : 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Bill</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Success Message */}
        <View style={styles.successSection}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Bill Created!</Text>
          <Text style={styles.successSubtitle}>
            Share this code with your group to join
          </Text>
        </View>

        {/* Join Code */}
        <View style={styles.codeSection}>
          <Text style={styles.codeLabel}>Join Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{session.joinCode}</Text>
          </View>
          <Text style={styles.codeHint}>
            Type the code on the Z-split app to join
          </Text>
        </View>

        {/* Participant Count (Real-time) */}
        <View style={styles.participantSection}>
          <View style={styles.participantRow}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <Text style={styles.participantText}>
              {participantCount} {participantCount === 1 ? 'person' : 'people'} in this bill
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={24} color={Colors.surface} />
            <Text style={styles.actionButtonText}>
              {copied ? 'Copied!' : 'Copy Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleShareLink}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={24} color={Colors.primary} />
            <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
              Share Link
            </Text>
          </TouchableOpacity>
        </View>

        {/* Waiting Message */}
        <View style={styles.waitingSection}>
          {participantCount === 1 ? (
            <Text style={styles.waitingText}>
              Waiting for others to join...
            </Text>
          ) : (
            <Text style={styles.waitingText}>
              Everyone's here! Ready to start.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleStartSelecting}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {participantCount === 1 ? 'Start Anyway' : 'Start Selecting Items'}
          </Text>
          <Ionicons name="arrow-forward" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.surface
  },
  content: { flex: 1, backgroundColor: Colors.background },
  contentContainer: {
    padding: Spacing.lg,
    alignItems: 'center'
  },
  successSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl
  },
  checkCircle: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md
  },
  successTitle: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  successSubtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center'
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl
  },
  codeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  codeBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 40,
    paddingVertical: Spacing.lg
  },
  codeText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4
  },
  codeHint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm
  },
  participantSection: {
    width: '100%',
    marginBottom: Spacing.xl
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  participantText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg
  },
  secondaryButton: {
    backgroundColor: Colors.surface
  },
  actionButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.surface
  },
  waitingSection: {
    marginBottom: Spacing.lg
  },
  waitingText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
  bottomSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl
  },
  continueButtonText: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.surface
  }
});
