import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { verifyFace, hasEnrolledFace, setCurrentPhone } from '../services/faceAuth';
import { getCurrentUser } from '../services/auth';

export const FaceLoginScreen = ({ navigation, route }) => {
  const [status, setStatus] = useState('initial'); // initial | checking | scanning | success | error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hasFace, setHasFace] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    checkFaceEnrollment();
  }, []);

  // Countdown timer for success screen
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (status === 'success' && countdown === 0) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [status, countdown]);

  const checkFaceEnrollment = async () => {
    setStatus('checking');
    setMessage('Checking face unlock...');
    
    try {
      // Get the phone from the user who just logged in
      const user = getCurrentUser();
      if (!user || !user.phone) {
        setStatus('error');
        setError('No user session found. Please sign in again.');
        return;
      }
      
      // Set current phone for face auth
      setCurrentPhone(user.phone);
      
      const hasFaceData = hasEnrolledFace(user.phone);
      setHasFace(hasFaceData);
      
      if (!hasFaceData) {
        setStatus('error');
        setError('No face enrolled for this account. Please create an account and enroll your face.');
        return;
      }
      
      setStatus('ready');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setError('Failed to check face enrollment. Please try again.');
    }
  };

  const handleVerifyFace = async () => {
    setStatus('scanning');
    setError('');
    setMessage('Looking for your face...');
    
    try {
      const user = getCurrentUser();
      if (!user || !user.phone) {
        setStatus('error');
        setError('Session expired. Please sign in again.');
        return;
      }
      
      await verifyFace(user.phone);
      setStatus('success');
      setMessage('Face verified!');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const handleSkip = () => {
    // Fallback to phone-only login
    navigation.replace('Main');
  };

  const handleRetry = () => {
    setError('');
    setStatus('ready');
  };

  const handleGoToSignup = () => {
    // User needs to create an account with face enrolled
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        );

      case 'ready':
        return (
          <View style={styles.centerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="scan-circle" size={80} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Unlock with Face</Text>
            <Text style={styles.description}>
              Look at your camera to verify your identity and access your account.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyFace}>
              <Ionicons name="scan" size={22} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>Scan Face</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={handleSkip}>
              <Text style={styles.linkButtonText}>Use phone only</Text>
            </TouchableOpacity>
          </View>
        );

      case 'scanning':
        return (
          <View style={styles.centerContent}>
            <View style={styles.cameraPreview}>
              <View style={styles.faceCircle}>
                <Ionicons name="eye" size={60} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>Scanning...</Text>
            <Text style={styles.description}>
              Look directly at the camera and stay still
            </Text>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.statusText}>Verifying face...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centerContent}>
            <View style={[styles.iconContainer, styles.successIcon]}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.description}>
              Face verified successfully. You're being logged in...
            </Text>
            <Text style={styles.countdownText}>Redirecting in {countdown}s</Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centerContent}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <Ionicons name="alert-circle" size={80} color={Colors.error} />
            </View>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            {error.includes('No face enrolled') ? (
              <>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleGoToSignup}>
                  <Text style={styles.secondaryButtonText}>Create Account with Face</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={handleSkip}>
                  <Text style={styles.linkButtonText}>Continue with phone only</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
                  <Text style={styles.secondaryButtonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={handleSkip}>
                  <Text style={styles.linkButtonText}>Use phone only</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔐 Face 2FA</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.surface,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  successIcon: {
    backgroundColor: Colors.success + '20',
    borderRadius: 60,
    padding: 20,
  },
  errorIcon: {
    backgroundColor: Colors.error + '20',
    borderRadius: 60,
    padding: 20,
  },
  title: {
    fontSize: FontSizes.h3,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  messageText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSizes.body,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  statusText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  countdownText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  cameraPreview: {
    width: 200,
    height: 200,
    backgroundColor: Colors.background,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  faceCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    marginBottom: Spacing.md,
    width: '100%',
    maxWidth: 300,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    marginBottom: Spacing.md,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: Spacing.sm,
  },
  linkButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});
