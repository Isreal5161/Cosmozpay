import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, Modal, FlatList, Animated, Image } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';
import KeyboardWrapper from '../components/KeyboardWrapper';

const BANKS = [
  { key: 'access', label: 'Access Bank' },
  { key: 'gtb', label: 'GTBank' },
  { key: 'zenith', label: 'Zenith Bank' },
  { key: 'first', label: 'First Bank' },
  { key: 'uba', label: 'UBA' },
  { key: 'polaris', label: 'Polaris Bank' },
  { key: 'fcmb', label: 'FCMB' },
  { key: 'union', label: 'Union Bank' },
  { key: 'fidelity', label: 'Fidelity Bank' },
  { key: 'stanbic', label: 'Stanbic IBTC' },
  { key: 'keystone', label: 'Keystone Bank' },
  { key: 'sterling', label: 'Sterling Bank' },
  { key: 'wema', label: 'Wema Bank' },
  { key: 'providus', label: 'Providus Bank' },
  { key: 'jaiz', label: 'Jaiz Bank' },
];

export default function SendMoneyScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSuccess, prefillAmount, prefillToAccount, prefillBank, prefillAccountNumber, prefillNote }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();

  const [toAccount, setToAccount] = useState(prefillToAccount || '');
  const [accountNumber, setAccountNumber] = useState(prefillAccountNumber || '');
  const [toBank, setToBank] = useState(prefillBank || BANKS[0].key);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [customBankName, setCustomBankName] = useState('');
  const [amount, setAmount] = useState(prefillAmount ? String(prefillAmount) : '');
  const [note, setNote] = useState(prefillNote || '');
  const [processing, setProcessing] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [pin, setPin] = useState('');
  const pinInputRef = useRef(null);
  const loadingAnim = useRef(new Animated.Value(1)).current;
  const loadingLoopRef = useRef(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const v = await AsyncStorage.getItem('biometricEnabled');
        setBiometricEnabled(v === '1');
      } catch (e) {
        setBiometricEnabled(false);
      }
    })();
  }, []);

  function startPurchase() {
    setProcessing(true);
    loadingAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnim, { toValue: 1.18, duration: 360, useNativeDriver: true }),
        Animated.timing(loadingAnim, { toValue: 0.88, duration: 360, useNativeDriver: true }),
      ])
    );
    loadingLoopRef.current = loop;
    loop.start();
    setTimeout(() => {
      loadingLoopRef.current?.stop();
      Animated.timing(loadingAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setProcessing(false);
      setAuthVisible(true);
    }, 900);
  }

  function handlePay() {
    setAuthVisible(false);
    const numericAmount = Math.max(0, Number((amount || '').replace(/[^0-9.]/g, '')) || 0);
    const payload = { provider: 'sendmoney', to: toAccount, bank: toBank === 'other' ? customBankName : toBank, accountNumber: accountNumber || null, amount: numericAmount, note };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  useEffect(() => {
    if (authVisible) setTimeout(() => pinInputRef.current?.focus?.(), 220);
  }, [authVisible]);

  useEffect(() => {
    if (prefillToAccount) setToAccount(prefillToAccount);
    if (prefillAccountNumber) setAccountNumber(prefillAccountNumber);
    if (prefillBank) setToBank(prefillBank);
    if (prefillAmount !== undefined && prefillAmount !== null) setAmount(String(prefillAmount));
    if (prefillNote) setNote(prefillNote);
  }, [prefillToAccount, prefillAccountNumber, prefillBank, prefillAmount, prefillNote]);

  const numericAmount = Math.max(0, Number((amount || '').replace(/[^0-9.]/g, '')) || 0);

  const filteredBanks = BANKS.filter((b) => b.label.toLowerCase().includes(bankSearch.trim().toLowerCase()));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Send Money</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={styles.depositText}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

  <KeyboardWrapper contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Available Balance</Text>
            <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.inputLabel, { color: palette.text }]}>Recipient account/phone/email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface }]}
              placeholder="Account number, phone or email"
              placeholderTextColor={palette.textMuted}
              value={toAccount}
              onChangeText={setToAccount}
              autoComplete="off"
            />

            <Text style={[styles.inputLabel, { color: palette.text }]}>Bank</Text>
            <TouchableOpacity style={[styles.input, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface }]} onPress={() => { setBankSearch(''); setShowBankPicker(true); }}>
              <Text style={{ color: palette.text }}>{toBank === 'other' ? (customBankName || 'Other bank') : (BANKS.find(b => b.key === toBank)?.label || '')}</Text>
              <Feather name="chevron-down" size={16} color={palette.textMuted} />
            </TouchableOpacity>

            <Modal visible={showBankPicker} animationType="slide" onRequestClose={() => setShowBankPicker(false)}>
              <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
                <View style={[styles.header, { backgroundColor: palette.surfaceRaised }]}> 
                  <TouchableOpacity onPress={() => setShowBankPicker(false)} style={styles.backButton}>
                    <Feather name="chevron-left" size={20} color={palette.text} />
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: palette.text }]}>Select Bank</Text>
                  <View style={styles.headerRight} />
                </View>
                <View style={{ padding: 16 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: palette.surface }]}
                    placeholder="Search banks"
                    placeholderTextColor={palette.textMuted}
                    value={bankSearch}
                    onChangeText={setBankSearch}
                  />
                </View>
                <FlatList
                  data={[...filteredBanks, { key: 'other', label: 'Other bank' }]}
                  keyExtractor={(item) => item.key}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.option, { marginHorizontal: 16 }]} onPress={() => {
                      setToBank(item.key);
                      if (item.key !== 'other') setCustomBankName('');
                      setShowBankPicker(false);
                    }}>
                      <Text style={[styles.optionLabel, { color: palette.text }]}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </Modal>

            {toBank === 'other' ? (
              <>
                <Text style={[styles.inputLabel, { color: palette.text }]}>Bank name</Text>
                <TextInput style={[styles.input, { backgroundColor: palette.surface }]} value={customBankName} onChangeText={setCustomBankName} placeholder="Enter bank name" placeholderTextColor={palette.textMuted} />
                <Text style={[styles.inputLabel, { color: palette.text }]}>Account number</Text>
                <TextInput style={[styles.input, { backgroundColor: palette.surface }]} value={accountNumber} onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
              </>
            ) : (
              <>
                <Text style={[styles.inputLabel, { color: palette.text }]}>Account number (for selected bank)</Text>
                <TextInput style={[styles.input, { backgroundColor: palette.surface }]} value={accountNumber} onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
              </>
            )}

            <Text style={[styles.inputLabel, { color: palette.text }]}>Amount (NGN)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface }]}
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            />

            <Text style={[styles.inputLabel, { color: palette.text }]}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface }]}
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.text }]}>You will send</Text>
              <Text style={[styles.summaryAmount, { color: palette.text }]}>NGN {numericAmount.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.proceedButton, { backgroundColor: numericAmount > 0 ? palette.primary : '#777' }]}
              disabled={numericAmount <= 0 || !toAccount}
              onPress={startPurchase}
            >
              <Text style={styles.proceedText}>Send</Text>
            </TouchableOpacity>

            {processing && (
              <View style={styles.processingOverlay} pointerEvents="none">
                <Animated.View style={[styles.processingCircle, { transform: [{ scale: loadingAnim }], backgroundColor: palette.surface }]}> 
                  <Image source={require('../../public/Cosmozpaylogo.jpeg')} style={styles.processingLogo} />
                </Animated.View>
              </View>
            )}

            <Modal visible={authVisible} animationType="slide" transparent>
              <View style={styles.authOverlay}>
                <View style={[styles.authSheet, { backgroundColor: palette.surface }]}> 
                  <View style={styles.authHeader}>
                    <Text style={[styles.authTitle, { color: palette.text }]}>Authorization Screen</Text>
                    <TouchableOpacity onPress={() => setAuthVisible(false)}>
                      <Feather name="x" size={20} color={palette.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Recipient</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{toAccount}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Bank</Text><Text style={[styles.authValue, { color: palette.text }]}>{toBank === 'other' ? customBankName : toBank}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{numericAmount.toLocaleString()}</Text></View>

                  <Text style={[styles.pinPrompt, { color: palette.text }]}>Enter Account Pin To Authorize</Text>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => pinInputRef.current?.focus?.()} style={styles.pinCircles}>
                    {[0,1,2,3].map((i) => (
                      <View key={i} style={[styles.pinCircle, { borderColor: palette.textMuted, backgroundColor: pin.length > i ? palette.primary : 'transparent' }]} />
                    ))}
                  </TouchableOpacity>
                  {biometricEnabled ? (
                    <TouchableOpacity onPress={async () => {
                      try {
                        const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to pay' });
                        if (res.success) handlePay();
                      } catch (e) {}
                    }} style={{ alignSelf: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialIcons name="fingerprint" size={28} color={palette.primary} />
                        <Text style={{ color: palette.primary, fontWeight: '700' }}>Use fingerprint</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                  <TextInput ref={pinInputRef} value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0,4))} keyboardType="numeric" maxLength={4} style={{ position: 'absolute', left: -1000, width: 1, height: 1, opacity: 0 }} />

                  <TouchableOpacity style={[styles.payButton, { backgroundColor: pin.length === 4 ? palette.primary : '#777' }]} disabled={pin.length !== 4} onPress={handlePay}>
                    <Text style={[styles.payText]}>Pay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
  </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  depositButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  depositText: { color: '#fff', fontWeight: '700' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  content: { paddingHorizontal: 16 },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  input: { borderRadius: 10, padding: 14, fontSize: 16, marginTop: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginRight: 8, marginBottom: 8, minWidth: 120 },
  optionLabel: { fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' },
  summaryLabel: { fontWeight: '700' },
  summaryAmount: { fontWeight: '800', fontSize: 18 },
  proceedButton: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: '#fff', fontWeight: '800' },
  authOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  authSheet: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
  authHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  authTitle: { fontSize: 16, fontWeight: '800' },
  authRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  authLabel: { fontSize: 12 },
  authValue: { fontWeight: '700' },
  pinPrompt: { textAlign: 'center', marginTop: 12, marginBottom: 12 },
  pinCircles: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  pinCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)', marginHorizontal: 6 },
  payButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '700' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  processingCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  processingLogo: { width: 40, height: 40, resizeMode: 'contain' },
});
