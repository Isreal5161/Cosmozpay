import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Animated, Image, Platform, StatusBar as RNStatusBar, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';
import VerifiedNumberSuggest, { saveVerifiedNumber } from '../components/VerifiedNumberSuggest';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function AirtelAirtimeScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;
  const [phone, setPhone] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [amount, setAmount] = useState('');
  const [voucher, setVoucher] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
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

  // Common Airtel prefixes (Nigeria) — include 0904 which some Airtel numbers use
  const AIRTEL_PREFIXES = ['0802','0808','0708','0812','0902','0912','0904'];

  function verifyNumber() {
    setVerifyError('');
    const raw = phone.replace(/\D/g, '');
    if (!raw) {
      setVerifyError('Please enter a phone number');
      setVerified(false);
      return;
    }
    let normal = raw;
    if (normal.startsWith('234')) normal = '0' + normal.slice(3);
    if (normal.length < 10) {
      setVerifyError('Number too short');
      setVerified(false);
      return;
    }
    const isAirtel = AIRTEL_PREFIXES.some((pre) => normal.startsWith(pre));
    if (isAirtel) {
      setVerified(true);
      setVerifyError('');
      saveVerifiedNumber('airtel', normal);
    } else {
      setVerified(false);
      setVerifyError('Not an Airtel number');
    }
  }

  function applyVoucher() {
    if (!voucher) return;
    if (voucher.trim().toUpperCase() === 'SAVE50') {
      setVoucherDiscount(50);
      setVoucherApplied(true);
    } else {
      setVoucherApplied(false);
      setVoucherDiscount(0);
    }
  }

  function startPurchase() {
    if (!verified || !(parseFloat(String(amount).replace(/[^0-9.]/g, '')) > 0)) return;
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
    const amt = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    const payable = Math.max(0, amt - (voucherApplied ? voucherDiscount : 0));
    const payload = { success: true, provider: 'airtel', phone, amount: payable, voucherApplied, timestamp: Date.now() };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  React.useEffect(() => {
    if (authVisible) setTimeout(() => pinInputRef.current?.focus?.(), 220);
  }, [authVisible]);

  React.useEffect(() => {
    const raw = String(phone || '').replace(/\D/g, '');
    let normal = raw;
    if (normal.startsWith('234')) normal = '0' + normal.slice(3);
    if (normal.length >= 10) {
      const isAirtel = AIRTEL_PREFIXES.some((pre) => normal.startsWith(pre));
      setVerified(isAirtel);
      if (!isAirtel) setVerifyError('Not an Airtel number');
      else setVerifyError('');
    } else {
      setVerified(false);
      setVerifyError('');
    }
  }, [phone]);

  const numericAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
  const isFormValid = verified && numericAmount > 0 && !!phone;

  const presets = ['100','200','300','500','1000'];
  const proceedLabel = !phone ? 'Insert number' : (numericAmount <= 0 ? 'Enter amount' : 'Proceed');
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Buy Airtime Topup</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={styles.depositText}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
        <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
        <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
        <Image source={require('../../public/airtel-logo.png')} style={styles.mtnLogo} />
        <View style={styles.delRateRow}>
          <View style={[styles.delBarBackground, { backgroundColor: palette.background }]}> 
            <View style={[styles.delBarFill, { width: '100%', backgroundColor: '#2ECC71' }]} />
          </View>
          <Text style={[styles.delLabel, { color: palette.textMuted }]}>Airtel Delivery Rate Nationwide</Text>
          <Text style={[styles.delPct, { color: palette.text }]}>100.00%</Text>
        </View>
        <Text style={[styles.dialText, { color: palette.textMuted }]}>Dial *311# to check airtime balance</Text>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
        keyboardOpeningTime={0}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
          <View style={{ flex: 1 }}>
            <View style={styles.content}>
              <View style={[styles.card, { backgroundColor: palette.surface }]}> 
                <VerifiedNumberSuggest provider="airtel" query={phone} onSelect={(n) => setPhone(n)} />
                <Text style={[styles.label, { color: palette.textMuted }]}>Phone Number</Text>
                <View style={styles.row}>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setVerified(false); }}
                    placeholder="Enter phone number"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="phone-pad"
                    autoComplete="off"
                    autoCorrect={false}
                    textContentType="none"
                    importantForAutofill="no"
                    style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]}
                  />
                  <TouchableOpacity style={[styles.verifyButton, { backgroundColor: palette.primary }]} onPress={verifyNumber}>
                    <Feather name="check" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => { /* TODO: open contacts */ }}>
                  <Text style={[styles.chooseContact, { color: '#FF6B6B' }]}>Choose from your contacts</Text>
                </TouchableOpacity>
                {verifyError ? <Text style={[styles.errorText]}>{verifyError}</Text> : null}
                {verified && (
                  <View style={styles.verifiedRow}>
                    <Feather name="check-circle" size={16} color="#2ECC71" />
                    <Text style={[styles.verifiedText, { color: '#2ECC71' }]}> Verified Airtel Number</Text>
                  </View>
                )}

                <Text style={[styles.label, { color: palette.textMuted, marginTop: 16 }]}>Amount</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter Amount"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="numeric"
                  editable={true}
                  style={[styles.amountInput, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.textMuted }]}
                />

                <View style={styles.pillsRow}>
                  {presets.map((p) => (
                    <TouchableOpacity key={p} style={[styles.pill, { backgroundColor: palette.surface }]} onPress={() => setAmount(p)}>
                      <Text style={{ color: palette.text }}>{`₦${p}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.amountBox, { backgroundColor: palette.surface }]}> 
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TextInput
                      value={voucher}
                      onChangeText={setVoucher}
                      placeholder="Apply promo code"
                      placeholderTextColor={palette.textMuted}
                      style={[styles.voucherInput, { color: palette.text, backgroundColor: palette.surface }]}
                    />
                    <TouchableOpacity style={[styles.applyVoucherButton, { backgroundColor: voucherApplied ? '#2ECC71' : palette.primary }]} onPress={applyVoucher}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>{voucherApplied ? 'Applied' : 'Apply'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ marginTop: 8, color: palette.text, fontWeight: '800' }}>Payable: {`₦${Math.max(0, (parseFloat(String(amount).replace(/[^0-9.]/g, ''))||0) - (voucherApplied ? voucherDiscount : 0)).toFixed(2)}`}</Text>
                  {voucherApplied && <Text style={{ color: '#2ECC71', marginTop: 4 }}>Voucher applied: -₦{voucherDiscount}</Text>}
                </View>

                <TouchableOpacity
                  style={[
                    styles.proceedButton,
                    { backgroundColor: (verified && numericAmount > 0) ? palette.primary : '#777', width: '100%' },
                  ]}
                  disabled={!verified || numericAmount <= 0 || processing}
                  onPress={startPurchase}
                >
                  <Text style={styles.proceedText}>{proceedLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

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

            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{'Airtel Airtime'}</Text></View>
            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Recipient</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{phone}</Text></View>
            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{'₦' + (parseFloat(String(amount).replace(/[^0-9.]/g, ''))||0).toFixed(2)}</Text></View>
            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Total Payable</Text><Text style={[styles.authValue, { color: '#E94B4B' }]}>{'₦' + Math.max(0, (parseFloat(String(amount).replace(/[^0-9.]/g, ''))||0) - (voucherApplied ? voucherDiscount : 0)).toFixed(2)}</Text></View>

            <Text style={[styles.pinPrompt, { color: palette.text }]}>Enter Account Pin To Authorize</Text>
            <View style={styles.pinCircles}>
              {[0,1,2,3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinCircle,
                    { borderColor: palette.textMuted, backgroundColor: pin.length > i ? palette.primary : 'transparent' },
                  ]}
                />
              ))}
            </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 64, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 12, gap: 12 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  headerRight: { marginLeft: 'auto' },
  depositButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  depositText: { color: '#fff', fontWeight: '700' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 13, marginBottom: 6 },
  balanceAmount: { fontSize: 20, fontWeight: '800' },
  delRateRow: { marginTop: 12, alignItems: 'center' },
  delBarBackground: { height: 12, backgroundColor: '#ccc', borderRadius: 8, overflow: 'hidden', width: '100%' },
  delBarFill: { height: 12, borderRadius: 8 },
  delPct: { marginTop: 6, fontSize: 12 },
  delLabel: { marginTop: 6, fontSize: 12 },
  content: { padding: 16 },
  card: { borderRadius: 12, padding: 16 },
  label: { fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, padding: 12, borderRadius: 8, marginRight: 8 },
  verifyButton: { padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  verifiedText: { marginLeft: 8, fontSize: 13 },
  chooseContact: { marginTop: 8, marginBottom: 6 },
  pillsRow: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  amountInput: { width: '100%', padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  proceedButton: { marginTop: 18, padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  proceedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  amountBox: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'flex-start' },
  voucherInput: { flex: 1, padding: 10, borderRadius: 8, marginRight: 8 },
  applyVoucherButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  mtnLogo: { width: 36, height: 24, resizeMode: 'contain', position: 'absolute', right: 20, top: 12 },
  dialText: { textAlign: 'center', marginTop: 8 },
  errorText: { color: '#E94B4B', marginTop: 6 },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  processingCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  processingLogo: { width: 40, height: 40, resizeMode: 'contain' },
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
  pinFilled: { backgroundColor: 'rgba(255,255,255,0.2)' },
  payButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '700' },
});
