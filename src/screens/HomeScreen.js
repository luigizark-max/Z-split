import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { logout as authLogout, getCurrentUser } from '../services/auth';

export const HomeScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reload user data or refresh state
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      authLogout();
      window.location.reload();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
          <Text style={styles.subtitle}>Ready to split some bills?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Main Actions */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.sectionTitle}>What would you like to do?</Text>

        {/* Create Bill - Host */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ScanReceipt')}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Scan & Split Receipt</Text>
            <Text style={styles.cardSubtitle}>Create a new bill as host</Text>
          </View>
        </TouchableOpacity>

        {/* Join Bill */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('JoinSession')}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Join a Bill</Text>
            <Text style={styles.cardSubtitle}>Enter a code to join an existing bill</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Z-split © 2026</Text>
      </View>
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
    paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
          },
  greeting: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.surface
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.surface,
    opacity: 0.8,
    marginTop: 4
  },
  logoutBtn: {
    padding: 8
  },
  content: {
    flex: 1,
    marginTop: 20
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
        padding: Spacing.lg,
    marginBottom: Spacing.md





  },
  iconContainer: {
    width: 56,
    height: 56,
        alignItems: 'center',
    justifyContent: 'center'
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md
  },
  cardTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '600',
    color: Colors.textPrimary
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center'
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary
  }
});
