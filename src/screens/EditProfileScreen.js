import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getCurrentUser, updateProfile } from '../services/auth';

const validateName = (name) => {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  return null;
};

const validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'Phone number is required';
  if (digits.length < 10) return 'Phone number must be at least 10 digits';
  return null;
};

export const EditProfileScreen = ({ navigation }) => {
  const user = getCurrentUser();

  // Parse phone into country code + local number
  const parsePhone = (fullPhone) => {
    if (!fullPhone) return { code: '+1', local: '' };
    const match = fullPhone.match(/^(\+\d+)(\d+)$/);
    if (match) return { code: match[1], local: match[2] };
    return { code: '+1', local: fullPhone };
  };

  const { code: initialCode, local: initialLocal } = parsePhone(user?.phone);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(initialLocal);
  const [email, setEmail] = useState(user?.email || '');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const clearErrors = () => setErrors({});

  const fullPhone = () => initialCode + phone.replace(/\D/g, '');

  const handleSave = async () => {
    clearErrors();

    const nameError = validateName(name);
    const phoneError = validatePhone(phone);

    if (nameError) { setErrors({ name: nameError }); return; }
    if (phoneError) { setErrors({ phone: phoneError }); return; }

    setIsLoading(true);
    try {
      const updates = {
        name: name.trim(),
        phone: fullPhone(),
        email: email.trim(),
      };
      await updateProfile(updates);
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return (
      <Text style={styles.errorText}>
        <Ionicons name="alert-circle" size={12} color={Colors.error} /> {errors[field]}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputErrorBorder]}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) clearErrors();
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {renderError('name')}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={[styles.countrySelector, errors.phone && styles.inputErrorBorder]}>
                <Text style={styles.countryFlagSmall}>{'🇺🇸'}</Text>
                <Text style={styles.countryCodeSmall}>{initialCode}</Text>
              </View>
              <View style={[styles.phoneInputContainer, errors.phone && styles.inputErrorBorder]}>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="1234567890"
                  placeholderTextColor={Colors.textSecondary}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) clearErrors();
                  }}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                />
              </View>
            </View>
            {renderError('phone')}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={22} color={Colors.surface} />
          <Text style={styles.saveBtnText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  inputErrorBorder: { borderWidth: 1, borderColor: Colors.error },
  input: { flex: 1, padding: Spacing.md, fontSize: FontSizes.body, color: Colors.textPrimary },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minWidth: 90,
    gap: 4,
    borderRadius: BorderRadius.md,
  },
  countryFlagSmall: { fontSize: 18 },
  countryCodeSmall: { fontSize: FontSizes.body, color: Colors.textPrimary, fontWeight: '500' },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  phoneInput: { flex: 1 },
  errorText: { fontSize: FontSizes.sm, color: Colors.error, marginTop: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.surface, fontSize: FontSizes.body, fontWeight: '600' },
});
