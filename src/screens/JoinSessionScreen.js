import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { joinSession } from '../services/sessionService';
import { getCurrentUser } from '../services/auth';

export const JoinSessionScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (joinCode.trim().length < 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-character code');
      return;
    }

    setIsJoining(true);
    try {
      const session = await joinSession({
        joinCode: joinCode.toUpperCase().trim(),
        name: user.name,
        phone: user.phone
      });

      navigation.replace('Lobby', { session, isJoining: true });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Update code as user types - only allow valid characters
  const handleCodeChange = (text) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setJoinCode(cleaned);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Bill</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <View style={styles.iconSection}>
          <Text style={styles.title}>Enter Join Code</Text>
          <Text style={styles.subtitle}>
            Get the code from the person who created the bill
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.codeInput}
            placeholder="XXXXXX"
            placeholderTextColor={Colors.textSecondary}
            value={joinCode}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            keyboardType="ascii-capable"
          />
          <Text style={styles.hint}>
            {joinCode.length}/6 characters
          </Text>
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[
            styles.joinButton,
            joinCode.length < 6 && styles.buttonDisabled,
          ]}
          onPress={handleJoin}
          disabled={joinCode.length < 6 || isJoining}
          activeOpacity={0.8}
        >
          <Ionicons name="log-in-outline" size={24} color={Colors.surface} />
          <Text style={styles.joinButtonText}>
            {isJoining ? 'Joining...' : 'Join Bill'}
          </Text>
        </TouchableOpacity>

        {/* Or divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.qrButton]}
          onPress={() => Alert.alert('Coming Soon', 'QR scanning will be available soon')}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
          <Text style={styles.qrButtonText}>Scan QR Code</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: {
    padding: 8
  },
  headerTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.surface
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background
  },
  contentContainer: {
    padding: Spacing.lg,
    alignItems: 'center'
  },
  iconSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl
  },
  iconContainer: {
    width: 120,
    height: 120,
        backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg





  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg
  },
  inputSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl
  },
  codeInput: {
    backgroundColor: Colors.surface,
        paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%'
          },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 8
  },
  joinButton: {
    backgroundColor: Colors.primary,
        paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl * 2,
    alignItems: 'center',
    width: '100%'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  joinButtonText: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.surface
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    width: '100%'
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600'
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
        paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
            width: '100%'
  },
  qrButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.primary
  }
});
