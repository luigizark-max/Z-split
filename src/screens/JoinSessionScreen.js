import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { joinSession } from '../services/sessionService';
import { getCurrentUser } from '../services/auth';

export const JoinSessionScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState(null);

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

  // Open QR scanner
  const handleOpenQRScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to scan QR codes.');
        return;
      }
    }
    setScannedCode(null);
    setShowQRScanner(true);
  };

  // Handle QR code scanned
  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scannedCode) return; // Prevent multiple scans

    const data = result.data;
    // Try to extract join code from QR data
    // Expected formats:
    // - zsplit.app/join/XXXXXX
    // - XXXXXX (direct code)
    // - https://zsplit.app?code=XXXXXX

    let extractedCode = '';
    try {
      const url = new URL(data);
      if (url.hostname.includes('zsplit')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts[pathParts.length - 1]?.length === 6) {
          extractedCode = pathParts[pathParts.length - 1];
        } else if (url.searchParams.has('code')) {
          extractedCode = url.searchParams.get('code');
        }
      }
    } catch {
      // Not a URL, check if it's a raw 6-char code
      if (data.length === 6 && /^[A-Z0-9]+$/i.test(data)) {
        extractedCode = data.toUpperCase();
      }
    }

    if (extractedCode) {
      setScannedCode(extractedCode);
      setJoinCode(extractedCode);
      setShowQRScanner(false);
      setTimeout(() => {
        Alert.alert('Code Scanned!', `Join code "${extractedCode}" has been entered.`);
      }, 100);
    } else {
      Alert.alert('Invalid QR', 'This QR code is not a valid Z-split join code.');
    }
  };

  // QR Scanner view
  if (showQRScanner) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scannedCode ? undefined : handleBarCodeScanned}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.cameraCloseBtn}
              onPress={() => setShowQRScanner(false)}
            >
              <Ionicons name="close" size={30} color={Colors.surface} />
            </TouchableOpacity>

            <View style={styles.scanGuide}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanGuideText}>
                Position the QR code within the frame
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowQRScanner(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

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

        {/* QR Scan Button */}
        <TouchableOpacity
          style={[styles.qrButton]}
          onPress={handleOpenQRScanner}
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
    fontSize: FontSizes.h2,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: 8
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.surface,
    opacity: 0.8,
    textAlign: 'center'
  },
  inputSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.lg
  },
  codeInput: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 20,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 12,
    color: Colors.textPrimary,
    textAlign: 'center',
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 280
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.surface,
    opacity: 0.6,
    marginTop: Spacing.sm
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 280
  },
  joinButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.h3,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    width: '100%',
    maxWidth: 280
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surface,
    opacity: 0.3
  },
  dividerText: {
    color: Colors.surface,
    opacity: 0.6,
    marginHorizontal: Spacing.md,
    fontSize: FontSizes.sm,
    fontWeight: '600'
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 280
  },
  qrButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.h3,
    fontWeight: '600'
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 80
  },
  cameraCloseBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.surface
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8
  },
  scanGuideText: {
    color: Colors.surface,
    fontSize: FontSizes.body,
    textAlign: 'center',
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md
  },
  cancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg
  },
  cancelBtnText: {
    color: Colors.surface,
    fontSize: FontSizes.body,
    fontWeight: '600'
  }
});
