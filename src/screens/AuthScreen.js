import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { countryCodes, defaultCountryCode } from '../constants/countryCodes';
import { createAccount, signIn } from '../services/auth';

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

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountryCode);
  const [generalError, setGeneralError] = useState('');

  const clearErrors = () => {
    setErrors({});
    setGeneralError('');
  };

  const fullPhone = () => selectedCountry.code + phone;

  const handleSubmit = async () => {
    clearErrors();

    const nameError = isLogin ? null : validateName(name);
    const phoneError = validatePhone(phone);

    if (nameError) { setErrors({ name: nameError }); return; }
    if (phoneError) { setErrors({ phone: phoneError }); return; }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn({ phone: fullPhone() });
      } else {
        await createAccount({ name, phone: fullPhone(), email });
      }
    } catch (err) {
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsLogin(!isLogin);
    clearErrors();
    setName('');
    setPhone('');
    setEmail('');
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return (
      <Text style={styles.errorText}>
        <Ionicons name="alert-circle" size={12} color={Colors.error} /> {errors[field]}
      </Text>
    );
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry.code === item.code && selectedCountry.country === item.country && styles.countryItemSelected,
      ]}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
      <Text style={styles.countryName}>{item.country}</Text>
      {selectedCountry.code === item.code && selectedCountry.country === item.country && (
        <Ionicons name="checkmark" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Z-split</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.card}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputContainer, errors.name && styles.inputErrorBorder]}>
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
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={[styles.countrySelector, errors.phone && styles.inputErrorBorder]}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.countryFlagSmall}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCodeSmall}>{selectedCountry.code}</Text>
                </TouchableOpacity>

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

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email (optional)</Text>
                <View style={styles.inputContainer}>
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
            )}

            {generalError ? (
              <View style={styles.generalError}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name={isLogin ? 'log-in-outline' : 'person-add-outline'} size={22} color={Colors.surface} />
              <Text style={styles.buttonText}>
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchMode} onPress={handleSwitchMode}>
              <Text style={styles.switchModeText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.link}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code + item.country}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
  },
  title: { fontSize: 36, fontWeight: '700', color: Colors.surface },
  subtitle: { fontSize: FontSizes.body, color: Colors.surface, opacity: 0.8, marginTop: 8 },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 32,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  card: { backgroundColor: Colors.surface, padding: Spacing.lg },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
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
  },
  countryFlagSmall: { fontSize: 18 },
  countryCodeSmall: { fontSize: FontSizes.body, color: Colors.textPrimary, fontWeight: '500' },
  phoneInputContainer: { flex: 1, backgroundColor: Colors.background },
  errorText: { fontSize: FontSizes.sm, color: Colors.error, marginTop: 4 },
  generalError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  generalErrorText: { color: Colors.error, marginLeft: 8, flex: 1 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: Spacing.md + 4,
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.surface, fontSize: FontSizes.body, fontWeight: '600' },
  switchMode: { marginTop: Spacing.lg, alignItems: 'center' },
  switchModeText: { color: Colors.textSecondary, fontSize: FontSizes.body },
  link: { color: Colors.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, maxHeight: '70%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: FontSizes.h3, fontWeight: '600', color: Colors.textPrimary },
  countryItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  countryItemSelected: { backgroundColor: Colors.background },
  countryFlag: { fontSize: 24 },
  countryCode: { fontSize: FontSizes.body, color: Colors.textPrimary, fontWeight: '500', minWidth: 50 },
  countryName: { flex: 1, fontSize: FontSizes.body, color: Colors.textSecondary },
});