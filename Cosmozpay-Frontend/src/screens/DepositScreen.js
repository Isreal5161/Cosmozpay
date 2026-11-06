import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';
import { createVirtualAccount } from '../services/mockPaymentService';
import * as Clipboard from 'expo-clipboard';

const { height } = Dimensions.get('window');

export default function DepositScreen({ visible = false, onClose = () => {}, themeMode = 'dark', user = null, generatedAccount: externalAccount = null, onGenerateAccount = () => {} }) {
  const translateY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const palette = getPalette(themeMode);
  const [copied, setCopied] = useState(false);
  const [internalAccount, setInternalAccount] = useState(null);
  const [nin, setNin] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0.5, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: height, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOpacity, translateY]);

  const handleGenerateAccount = async () => {
    const digits = nin.replace(/\D/g, '');
    if (digits.length < 4) {
      setErrorMessage('Enter a valid NIN with at least 4 digits.');
      return;
    }

    try {
      const account = await createVirtualAccount({ nin: digits, fullName });
      if (typeof onGenerateAccount === 'function') onGenerateAccount(account);
      setInternalAccount(account);
      setErrorMessage('');
    } catch (e) {
      setErrorMessage('Failed to create account. Try again.');
    }
  };

  const copyToClipboard = async (value) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { backgroundColor: '#000', opacity: overlayOpacity }]} />

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: palette.surface, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={20} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Deposit Money</Text>
        </View>

        <View style={styles.cardContainer}>
          {!externalAccount && !internalAccount ? (
            <>
              <View style={[styles.bankCard, { backgroundColor: palette.primaryDark }]}> 
                <Text style={styles.bankTitle}>Create Deposit Account</Text>
                <Text style={styles.bankSub}>Enter your NIN once. Your account will be reused every time you open Deposit.</Text>
                <View style={styles.inputRow}>
                  <Text style={[styles.inputLabel, { color: '#fff' }]}>Full name</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={(value) => setFullName(value)}
                    placeholder="Jane Doe"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={[styles.textInput, { borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }]}
                    selectionColor="#fff"
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={[styles.inputLabel, { color: '#fff' }]}>NIN</Text>
                  <TextInput
                    value={nin}
                    onChangeText={(value) => {
                      setNin(value);
                      setErrorMessage('');
                    }}
                    keyboardType="numeric"
                    placeholder="12345678901"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    style={[styles.textInput, { borderColor: 'rgba(255,255,255,0.16)', color: '#fff' }]}
                    selectionColor="#fff"
                  />
                </View>
                {errorMessage ? <Text style={[styles.errorText, { color: '#f87171' }]}>{errorMessage}</Text> : null}
                <TouchableOpacity style={[styles.addNewButton, { backgroundColor: '#fff' }]} onPress={handleGenerateAccount}> 
                  <Text style={[styles.addNewText, { color: '#000' }]}>Create Deposit Account</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.bankCard, { backgroundColor: palette.primaryDark }]}> 
                <Text style={styles.bankTitle}>Deposit Account</Text>
                <Text style={styles.bankSub}>Use the account below to fund your wallet.</Text>
                <View style={styles.cardInner}>
                  <Text style={styles.bankName}>{(externalAccount || internalAccount).bankName}</Text>
                  { (externalAccount || internalAccount).accountName ? (
                    <Text style={styles.accountHolder}>{(externalAccount || internalAccount).accountName}</Text>
                  ) : null }
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.accountNumber}>{(externalAccount || internalAccount).accountNumber}</Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => copyToClipboard((externalAccount || internalAccount).accountNumber)}
                      style={[styles.copyButton]}
                    >
                      <Feather name="copy" size={16} color="#fff" />
                    </TouchableOpacity>
                    {copied && <Text style={[styles.copiedText, { color: '#fff', marginLeft: 8 }]}>Copied</Text>}
                  </View>
                </View>
              </View>

              {/* Account details removed to tighten spacing */}
            </>
          )}

          <Text style={[styles.orText, { color: palette.textMuted }]}>Other funding methods</Text>
          <View style={styles.optionRow}>
            <Feather name="credit-card" size={18} color={palette.text} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.optionTitle, { color: palette.text }]}>Alternate Payment Methods</Text>
              <Text style={[styles.optionSub, { color: palette.textMuted }]}>Opay, Palmpay, ATM cards...</Text>
            </View>
          </View>

          <View style={styles.optionRow}>
            <Feather name="gift" size={18} color={palette.text} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.optionTitle, { color: palette.text }]}>CosmozPay Voucher</Text>
              <Text style={[styles.optionSub, { color: palette.textMuted }]}>Load CosmozPay voucher to fund your account.</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.9,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  bankCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 6,
  },
  bankTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  bankSub: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  cardInner: {
    marginTop: 8,
  },
  bankName: {
    color: '#fff',
    fontSize: 14,
  },
  accountHolder: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  accountNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  copiedText: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  infoBlock: {
    marginTop: 6,
  },
  infoTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 0,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  addNewButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addNewText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 0,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  optionTitle: {
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
  },
});