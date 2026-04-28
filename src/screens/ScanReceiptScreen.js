import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Tesseract from 'tesseract.js';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { getDemoReceiptItems, createSession } from '../services/sessionService';
import { getCurrentUser } from '../services/auth';

export const ScanReceiptScreen = ({ navigation }) => {
  const user = getCurrentUser();
  const [items, setItems] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [subtotal, setSubtotal] = useState('0.00');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [scanError, setScanError] = useState('');

  const cameraRef = useRef(null);

  // ─── Auto-scan when photo is captured ──────────────────────────────
  useEffect(() => {
    if (!capturedImage) return;

    let cancelled = false;

    const processImage = async () => {
      setIsProcessingImage(true);
      setOcrProgress(0);
      setScanError('');

      try {
        const result = await Tesseract.recognize(capturedImage.uri, 'eng', {
          logger: m => {
            if (!cancelled && m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });

        if (cancelled) return;

        const { items: newItems, tax: detectedTax, tip: detectedTip } = parseReceiptText(result.data.text);

        if (newItems.length === 0) {
          setScanError('No items found. Try a clearer photo or add items manually.');
          setIsProcessingImage(false);
        } else {
          setItems(prev => {
            const merged = [...prev, ...newItems];
            const computedSubtotal = merged.reduce((sum, item) => sum + item.price, 0);
            setSubtotal(computedSubtotal.toFixed(2));
            return merged;
          });
          if (detectedTax !== null) setTax(detectedTax.toFixed(2));
          if (detectedTip !== null) setTip(detectedTip.toFixed(2));
          setCapturedImage(null);
          setIsProcessingImage(false);
        }
      } catch (err) {
        if (!cancelled) {
          setScanError('Could not read receipt. Make sure the photo is clear and well-lit.');
          setIsProcessingImage(false);
        }
      }
    };

    processImage();

    return () => { cancelled = true; };
  }, [capturedImage]);

  const handleOpenCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to scan receipts.');
        return;
      }
    }
    setShowCamera(true);
    setCapturedImage(null);
    setScanError('');
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, base64: false });
      setCapturedImage(photo);
      setShowCamera(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  // ─── OCR Parser ─────────────────────────────────────────────────────
  // Returns { items[], tax?, tip? }
  const parseReceiptText = useCallback((text) => {
    if (!text || text.trim().length < 10) return { items: [], tax: null, tip: null };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const extractedItems = [];
    let detectedTax = null;
    let detectedTip = null;

    // Match prices: $14.99 / 14.99 / 14,99
    const priceRegex = /\$?\s*(\d+)[.,](\d{2})\b/g;
    // Detect tax/tip lines
    const taxTipRegex = /(tax|gratuity|tip|service charge)[^\d]*(\$?\s*\d+[.,]\d{2})/gi;

    // Pass 1: find tax and tip amounts
    const taxTipMatches = [...text.matchAll(taxTipRegex)];
    for (const match of taxTipMatches) {
      const val = parseFloat(match[2].replace(/[^\d.]/g, ''));
      if (isNaN(val) || val <= 0 || val > 200) continue;
      const label = match[1].toLowerCase();
      if ((label.includes('tax') || label.includes('gratuity') || label.includes('service')) && detectedTax === null) {
        detectedTax = val;
      } else if (label.includes('tip') && detectedTip === null) {
        detectedTip = val;
      }
    }

    // Pass 2: extract line items
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const lowerLine = line.toLowerCase();

      // Skip pure numbers
      if (/^\d+$/.test(line)) continue;
      // Skip short garbage lines
      if (line.length < 2) continue;

      // Aggressive skip for known non-item words
      const hardSkip = ['subtotal', 'sub total', 'sub-total', 'balance', 'change', 'cash', 'card', 'visa', 'mastercard',
        'amex', 'discover', 'receipt', 'thank', 'welcome', 'visit', 'phone', 'address',
        'date', 'time', 'table', 'guest', 'server', 'payment', 'signature', 'order #',
        'check #', 'table #', 'order:', 'payment method', 'tax', 'tip', 'gratuity', 'service charge',
        'total', 'grand total', 'amount due', 'due'];
      const skip = hardSkip.some(w => lowerLine.includes(w));
      if (skip) continue;

      // Look for prices in this line
      const matches = [...line.matchAll(priceRegex)];
      if (matches.length === 0) continue;

      for (const match of matches) {
        const price = parseFloat(match[1] + '.' + match[2]);

        // Skip tiny or huge amounts (those are tax/tip/metadata, not items)
        if (price < 0.15 || price > 600) continue;

        // Item name = text BEFORE the price
        let itemName = line.substring(0, match.index)
          .replace(/[#*\-–_]+/g, ' ')
          .replace(/\d+$/, '')
          .replace(/[\$\d.,]+/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Fallback: remove all prices and clean up
        if (!itemName || itemName.length < 1) {
          itemName = line.replace(/[\$\d.,]+/g, ' ').replace(/\s+/g, ' ').trim();
        }
        // Strip trailing punctuation from OCR artifacts
        itemName = itemName.replace(/[^a-zA-Z0-9\s\-&']+$/, '').trim();
        itemName = itemName.replace(/^\W+|\W+$/g, '').trim();

        if (!itemName || itemName.length < 1 || itemName.length > 50) continue;
        // Skip if name is essentially all numbers
        if (/^\d+$/.test(itemName)) continue;

        extractedItems.push({ name: itemName, price: parseFloat(price.toFixed(2)) });
        console.log('[OCR] +', itemName, '→', price.toFixed(2));
      }
    }

    console.log('[OCR] Extracted:', extractedItems.length, 'items | tax:', detectedTax, '| tip:', detectedTip);
    return { items: extractedItems, tax: detectedTax, tip: detectedTip };
  }, []);

  // Manual add item
  const handleAddItem = () => {
    if (!newItemName.trim()) { Alert.alert('Error', 'Please enter item name'); return; }
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) { Alert.alert('Error', 'Please enter a valid price'); return; }
    const newItems = [...items, { name: newItemName.trim(), price }];
    setItems(newItems);
    const computedSubtotal = newItems.reduce((sum, item) => sum + item.price, 0);
    setSubtotal(computedSubtotal.toFixed(2));
    setNewItemName('');
    setNewItemPrice('');
    setShowAddItem(false);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const computedSubtotal = newItems.reduce((sum, item) => sum + item.price, 0);
    setSubtotal(computedSubtotal.toFixed(2));
  };

  const getGrandTotal = () => {
    const taxAmount = parseFloat(tax) || 0;
    const tipAmount = parseFloat(tip) || 0;
    return (parseFloat(subtotal) + taxAmount + tipAmount).toFixed(2);
  };

  const handleStartBill = async () => {
    if (items.length === 0) { Alert.alert('Error', 'Please add at least one item'); return; }
    setIsCreating(true);
    try {
      const session = await createSession({
        hostName: user.name,
        hostPhone: user.phone,
        items,
        totalAmount: parseFloat(subtotal),
        tax: parseFloat(tax) || 0,
        tip: parseFloat(tip) || 0,
      });
      navigation.navigate('Lobby', { session });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Camera view
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={30} color={Colors.surface} />
            </TouchableOpacity>
            <View style={styles.cameraGuide}>
              <Text style={styles.cameraGuideText}>Position receipt within the frame</Text>
            </View>
            <TouchableOpacity style={styles.captureBtn} onPress={handleTakePhoto} activeOpacity={0.7}>
              <View style={styles.captureBtnInner} />
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
        <Text style={styles.headerTitle}>Scan Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Scanning state */}
        {isProcessingImage && (
          <View style={styles.scanningSection}>
            <View style={styles.scanAnimation}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.scanningTitle}>Scanning receipt...</Text>
            <Text style={styles.scanningSubtitle}>
              {ocrProgress > 0 ? `Reading text — ${ocrProgress}%` : 'Identifying items and prices'}
            </Text>
            {capturedImage && (
              <Image source={{ uri: capturedImage.uri }} style={styles.scanningPreview} />
            )}
          </View>
        )}

        {/* Error state */}
        {!isProcessingImage && scanError && (
          <View style={styles.errorSection}>
            <Ionicons name="warning-outline" size={48} color={Colors.error} />
            <Text style={styles.errorText}>{scanError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { setScanError(''); setCapturedImage(null); setShowCamera(true); }}>
              <Ionicons name="camera" size={20} color={Colors.surface} />
              <Text style={styles.retryButtonText}>Take New Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualButton} onPress={() => setShowAddItem(true)}>
              <Text style={styles.manualButtonText}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {items.length === 0 && !isProcessingImage && !scanError && !capturedImage && (
          <View style={styles.scanSection}>
            <View style={styles.receiptIcon}>
              <Ionicons name="receipt-outline" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Add Receipt Items</Text>
            <Text style={styles.sectionSubtitle}>
              Take a photo of your receipt — we'll automatically extract all items and prices
            </Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleOpenCamera} activeOpacity={0.8}>
              <Ionicons name="camera" size={28} color={Colors.surface} />
              <Text style={styles.scanButtonText}>Take Photo of Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scanButton, styles.secondaryButton]} onPress={() => setShowAddItem(true)} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={28} color={Colors.primary} />
              <Text style={[styles.scanButtonText, { color: Colors.primary }]}>Add Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Items list */}
        {items.length > 0 && !isProcessingImage && (
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Receipt Items ({items.length})</Text>
              <View style={styles.itemsHeaderActions}>
                <TouchableOpacity onPress={handleOpenCamera} style={styles.iconBtn}>
                  <Ionicons name="camera" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowAddItem(true)}>
                  <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>${subtotal}</Text>
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.totalLabel}>Tax ($)</Text>
                <TextInput style={styles.totalInput} placeholder="0.00" keyboardType="decimal-pad" value={tax} onChangeText={setTax} placeholderTextColor={Colors.textSecondary} />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.totalLabel}>Tip ($)</Text>
                <TextInput style={styles.totalInput} placeholder="0.00" keyboardType="decimal-pad" value={tip} onChangeText={setTip} placeholderTextColor={Colors.textSecondary} />
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>${getGrandTotal()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addMoreButton} onPress={() => setShowAddItem(true)}>
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addMoreText}>Add another item</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {items.length > 0 && !isProcessingImage && (
        <View style={styles.bottomSection}>
          <TouchableOpacity style={[styles.startButton, isCreating && styles.buttonDisabled]} onPress={handleStartBill} disabled={isCreating} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>
              {isCreating ? 'Creating...' : `Start Bill — $${getGrandTotal()}`}
            </Text>
            {!isCreating && <Ionicons name="chevron-forward" size={24} color={Colors.surface} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Add Item Modal */}
      <Modal visible={showAddItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity onPress={() => setShowAddItem(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Grilled Salmon" value={newItemName} onChangeText={setNewItemName} placeholderTextColor={Colors.textSecondary} />
              <Text style={styles.inputLabel}>Price ($)</Text>
              <TextInput style={styles.textInput} placeholder="0.00" keyboardType="decimal-pad" value={newItemPrice} onChangeText={setNewItemPrice} placeholderTextColor={Colors.textSecondary} />
              <TouchableOpacity style={styles.addButton} onPress={handleAddItem} activeOpacity={0.8}>
                <Text style={styles.addButtonText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22 },
  headerTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  content: { flex: 1 },
  scanSection: { padding: Spacing.lg, alignItems: 'center', paddingTop: 80 },
  receiptIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: FontSizes.h2, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  sectionSubtitle: { fontSize: FontSizes.body, color: Colors.textSecondary, marginBottom: Spacing.xl, textAlign: 'center', lineHeight: 22 },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.primary, padding: Spacing.lg, marginBottom: Spacing.md, width: '100%' },
  secondaryButton: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary },
  scanButtonText: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  scanningSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, paddingTop: 60, minHeight: 400 },
  scanAnimation: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  scanningTitle: { fontSize: FontSizes.h2, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  scanningSubtitle: { fontSize: FontSizes.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  scanningPreview: { width: 200, height: 150, borderRadius: 12, opacity: 0.5, borderWidth: 2, borderColor: Colors.primary },
  errorSection: { alignItems: 'center', padding: Spacing.xl, paddingTop: 80 },
  errorText: { fontSize: FontSizes.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl, lineHeight: 22 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, padding: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  retryButtonText: { color: Colors.surface, fontWeight: '600', fontSize: FontSizes.body },
  manualButton: { padding: Spacing.md },
  manualButtonText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.body },
  itemsSection: { padding: Spacing.lg },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  itemsHeaderActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { marginRight: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: Spacing.md, marginBottom: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSizes.body, fontWeight: '500', color: Colors.textPrimary },
  itemPrice: { fontSize: FontSizes.body, color: Colors.textSecondary, marginTop: 2 },
  totalsSection: { backgroundColor: Colors.surface, padding: Spacing.lg, marginTop: Spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { fontSize: FontSizes.body, color: Colors.textSecondary },
  totalValue: { fontSize: FontSizes.body, fontWeight: '500', color: Colors.textPrimary },
  totalInput: { backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingVertical: 8, width: 100, textAlign: 'right', fontSize: FontSizes.body, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  grandTotalLabel: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary },
  grandTotalValue: { fontSize: FontSizes.h2, fontWeight: '700', color: Colors.primary },
  addMoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.md, marginTop: Spacing.sm },
  addMoreText: { color: Colors.primary, fontWeight: '500', fontSize: FontSizes.body },
  bottomSection: { padding: Spacing.lg, backgroundColor: Colors.surface },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, padding: Spacing.lg },
  buttonDisabled: { opacity: 0.6 },
  startButtonText: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.surface },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  modalTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary },
  modalBody: { padding: Spacing.lg },
  inputLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  textInput: { backgroundColor: Colors.background, padding: Spacing.md, fontSize: FontSizes.body, color: Colors.textPrimary, marginBottom: Spacing.md },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, padding: Spacing.md, marginTop: Spacing.sm },
  addButtonText: { fontSize: FontSizes.body, fontWeight: '600', color: Colors.surface },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between', padding: Spacing.xl },
  cameraCloseBtn: { alignSelf: 'flex-end', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  cameraGuide: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: 12 },
  cameraGuideText: { color: Colors.surface, fontSize: FontSizes.body },
  captureBtn: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.surface },
});