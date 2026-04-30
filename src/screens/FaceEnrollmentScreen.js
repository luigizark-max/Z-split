import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { enrollFace, checkFaceIOStatus, setCurrentPhone } from '../services/faceAuth';
import { getCurrentUser } from '../services/auth';

export const FaceEnrollmentScreen = ({ navigation, route }) => {
  const [status, setStatus] = useState('initial'); // initial | checking | ready | enrolling | success | error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [faceAvailable, setFaceAvailable] = useState(false);

  useEffect(() => {
    checkFaceAvailability();
  }, []);

  const checkFaceAvailability = async () => {
    setStatus('checking');
    setMessage('Checking camera access...');
    
    const result = await checkFaceIOStatus();
    
    if (result.available && result.hasCamera) {
      setFaceAvailable(true);
      setStatus('ready');
      setMessage('Face unlock is available on this device');
    } else {
      setStatus('error');
      setError(result.error || 'Camera not available. Face unlock requires camera access.');
    }
  };

  const handleEnrollFace = async () => {
    setStatus('enrolling');
    setError('');
    setMessage('Position your face in the camera...');
    
    // Get phone from current user
    const user = getCurrentUser();
    if (!user || !user.phone) {
      setStatus('error');
      setError('No user session found. Please sign up again.');
      return;
    }
    
    // Set current phone for face auth
    setCurrentPhone(user.phone);
    
    try {
      await enrollFace(user.phone);
      setStatus('success');
      setMessage('Face enrolled successfully!');
      
      // Wait a moment then navigate to main app
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }, 1500);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const handleSkip = () => {
    // Skip face enrollment but still complete signup
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleRetry = () => {
    setError('');
    setStatus('ready');
    setMessage('Face unlock is available on this device');
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
            <Text style={styles.title}>Enable Face Unlock</Text>
            <Text style={styles.description}>
              Use your face as a second factor to secure your account. 
              Your face data stays on your device and is never uploaded.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleEnrollFace}>
              <Ionicons name="camera" size={22} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>Start Face Enrollment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        );

      case 'enrolling':
        return (
          <View style={styles.centerContent}>
            <View style={styles.cameraPreview}>
              <View style={styles.faceCircle}>
                <Ionicons name="person" size={60} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>Position Your Face</Text>
            <Text style={styles.description}>
              Look at your camera and position your face within the circle. 
              The system will automatically capture your face.
            </Text>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.statusText}>Scanning...</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centerContent}>
            <View style={[styles.iconContainer, styles.successIcon]}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
            <Text style={styles.title}>Face Enrolled!</Text>
            <Text style={styles.description}>
              Your face has been linked to your account. 
              Next time you sign in, you can use Face Unlock.
            </Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centerContent}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <Ionicons name="alert-circle" size={80} color={Colors.error} />
            </View>
            <Text style={styles.title}>Couldn't Set Up Face Unlock</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
              <Text style={styles.secondaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={handleSkip}>
              <Text style={styles.linkButtonText}>Continue without Face Unlock</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔐 Secure Your Account</Text>
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
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.surface,
    textAlign: 'center',
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
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.body,
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
