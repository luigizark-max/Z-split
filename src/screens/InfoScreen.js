import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';

const TERMS_OF_SERVICE = `Terms of Service

Last updated: April 30, 2026

1. Acceptance of Terms
By using Z-split, you agree to these terms. If you do not agree, please do not use the app.

2. Description of Service
Z-split allows you to create and join bill splitting sessions with friends, family, or colleagues. All participants must consent to joining a session.

3. User Accounts
You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.

4. Privacy
Your privacy is important to us. We collect only the information necessary to provide our service, including your name, phone number, and email (optional). We never sell your personal data.

5. Limitation of Liability
Z-split is provided "as is." While we strive for accuracy in bill splitting calculations, final responsibility for payments lies with all participants.

6. Prohibited Use
You agree not to use Z-split for any illegal purpose or in violation of any local, state, national, or international laws.

7. Changes to Terms
We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.

8. Contact
For questions about these terms, please contact us at support@zsplit.app`;

const PRIVACY_POLICY = `Privacy Policy

Last updated: April 30, 2026

1. Information We Collect
We collect the following information when you sign up:
• Name (required)
• Phone number (required)
• Email address (optional)

2. How We Use Your Information
We use your information to:
• Create and manage your account
• Facilitate bill splitting sessions
• Send you session-related notifications

3. Information Sharing
We share your information only with other participants in sessions you join. We do not sell, trade, or otherwise transfer your personal information to outside parties.

4. Data Storage
Your data is stored securely. You can request deletion of your account data at any time by contacting support@zsplit.app.

5. Cookies
We do not use cookies or tracking technologies.

6. Security
We take reasonable measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.

7. Your Rights
You have the right to:
• Access your personal data
• Correct inaccurate data
• Request deletion of your data
• Opt out of communications

8. Children's Privacy
Z-split is not intended for users under 18 years of age.

9. Contact
For privacy concerns, contact us at support@zsplit.app`;

const ABOUT_ZSPLIT = `Z-split v1.0.0

Z-split is a bill splitting app designed to make sharing expenses simple and fair.

Features:
• Scan and split receipts with friends
• Create or join bill sessions
• Real-time participant tracking
• Fair cost distribution
• QR code sharing

Built with React Native and Expo.

© 2026 Z-split. All rights reserved.

Support: support@zsplit.app`;

export const InfoScreen = ({ route, navigation }) => {
  const { type } = route.params;

  const getContent = () => {
    switch (type) {
      case 'terms':
        return { title: 'Terms of Service', content: TERMS_OF_SERVICE, icon: 'document-text-outline' };
      case 'privacy':
        return { title: 'Privacy Policy', content: PRIVACY_POLICY, icon: 'shield-checkmark-outline' };
      case 'about':
        return { title: 'About Z-split', content: ABOUT_ZSPLIT, icon: 'information-circle-outline' };
      default:
        return { title: 'Info', content: '', icon: 'information-circle-outline' };
    }
  };

  const { title, content, icon } = getContent();

  const handleContact = () => {
    Linking.openURL('mailto:support@zsplit.app');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={48} color={Colors.primary} />
        </View>

        <Text style={styles.contentText}>{content}</Text>

        {type !== 'about' && (
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <Ionicons name="mail-outline" size={20} color={Colors.surface} />
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  placeholder: { width: 40 },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.lg },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  contentText: {
    fontSize: FontSizes.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  contactBtnText: {
    color: Colors.surface,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
