import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getCurrentUser, logout } from '../services/auth';

export const AccountScreen = ({ navigation }) => {
  const user = getCurrentUser();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profilePhone}>{user?.phone || 'No phone'}</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Full Name</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.infoValue}>{user?.name || 'Not set'}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />


            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <View style={styles.infoRight}>
                <Text style={styles.infoValue}>{user?.email || 'Not added'}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoLabel}>About Z-split</Text>
              </View>
              <Text style={styles.infoValue}>v1.0.0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: Spacing.lg
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 28,
    fontWeight: '700'
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1
  },
  profileName: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.textPrimary
  },
  profilePhone: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: 4
  },
  section: {
    marginBottom: Spacing.xl
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexWrap: 'wrap',
    minHeight: 56
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0
  },
  infoLabel: {
    fontSize: FontSizes.body,
    color: Colors.textPrimary
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flexShrink: 0
  },
  editBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flexShrink: 0
  },
  editBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  infoValue: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    flexShrink: 1
  },
  divider: {
    height: 1,
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error
  },
  logoutText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    color: Colors.error
  }
});
