import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, FlatList, Image, Platform, StatusBar as RNStatusBar, ActivityIndicator, Animated } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';

const DUMMY_PACKAGES = [
  { id: 'p1', title: '120MB Whatsapp - 1 Month', subtitle: 'Dial *223*4# to check data balance' },
  { id: 'p2', title: '120MB - Facebook - 1 Month', subtitle: 'Dial *223*4# to check data balance' },
  { id: 'p3', title: 'Airtel 1.5GB - Social Plan - 30 Days', subtitle: 'Works for all social media apps' },
  { id: 'p4', title: 'Airtel 2GB - 2 Days', subtitle: 'Dial *223*4# to check data balance.' },
  { id: 'p5', title: 'Airtel 3GB - 7 Days', subtitle: 'Dial *223*4# to check data balance.' },
];

export default function AirtelDataScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const barBgColor = themeMode === 'light' ? '#fff' : '#000';
  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;
  const [phone, setPhone] = useState(user?.phone || '');
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [packagesVisible, setPackagesVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [pin, setPin] = useState('');
  const pinInputRef = useRef(null);
  const loadingAnim = useRef(new Animated.Value(1)).current;
  const loadingLoopRef = useRef(null);
  const [voucher, setVoucher] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
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

  async function tryBiometricAuth() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) return false;
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to pay' });
      if (res.success) {
        setAuthVisible(false);
        const payload = { success: true, provider: 'airtel', phone, selectedPackage, amount: getPayableAmount(), voucherApplied, timestamp: Date.now() };
        if (typeof onSuccess === 'function') onSuccess(payload);
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  const AIRTEL_PREFIXES = ['0802','0808','0708','0701','0902','0907','0812','0818','0901','0904','07025','07026'];

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
      setPackagesVisible(true);
      setVerifyError('');
    } else {
      setVerified(false);
      setVerifyError('Not an Airtel number');
    }
  }

  function renderPackage({ item }) {
    return (
      <TouchableOpacity style={[styles.pkgRow, { backgroundColor: palette.surface }]} onPress={() => { setSelectedPackage(item); setPackagesVisible(false); }}>
        <View style={styles.pkgIconWrap}>
          <Image source={require('../../public/airtel-logo.png')} style={styles.pkgIcon} />
        </View>
        <View style={styles.pkgText}>
          <Text style={[styles.pkgTitle, { color: palette.text }]}>{item.title}</Text>
          <Text style={[styles.pkgSub, { color: palette.textMuted }]}>{item.subtitle}</Text>
        </View>
        <View style={styles.pkgSelect}>
          <Feather name={selectedPackage?.id === item.id ? 'check-circle' : 'circle'} size={20} color={palette.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  function getAmountForPackage(pkg) {
    if (!pkg) return 0;
    const id = pkg.id || pkg.title || pkg;
    if (id === '1GB' || id === '1GB ') return 250;
    if (id === '2GB') return 400;
    if (id === '3GB') return 650;
    if (id === '4GB') return 900;
    const title = (pkg.title || '').toLowerCase();
    if (title.includes('1gb') || title.includes('1.2gb') || title.includes('1.5gb')) return 250;
    if (title.includes('2gb')) return 400;
    if (title.includes('3gb')) return 650;
    return 250;
  }

  function getPayableAmount() {
    const base = getAmountForPackage(selectedPackage);
    return Math.max(0, base - (voucherApplied ? voucherDiscount : 0));
  }

  function applyVoucher() {
    if (!voucher) return;
    if (voucher.trim().toUpperCase() === 'SAVE50') {
      setVoucherDiscount(50);
      setVoucherApplied(true);
    } else if (voucher.trim().toUpperCase() === 'SAVE100') {
      setVoucherDiscount(100);
      setVoucherApplied(true);
    } else {
      setVoucherApplied(false);
      setVoucherDiscount(0);
    }
  }

  function startPurchase() {
    if (!verified || !selectedPackage) return;
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
    const payload = { success: true, provider: 'airtel', phone, selectedPackage, amount: getPayableAmount(), voucherApplied, timestamp: Date.now() };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  React.useEffect(() => {
    if (authVisible) {
      setTimeout(() => pinInputRef.current?.focus?.(), 220);
    }
  }, [authVisible]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Buy Data Bundle</Text>
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
          <View style={[styles.delBarBackground, { backgroundColor: barBgColor }]}> 
            <View style={[styles.delBarFill, { width: '94%', backgroundColor: '#2ECC71' }]} />
          </View>
          <Text style={[styles.delLabel, { color: palette.textMuted }]}>Airtel Delivery Rate Nationwide</Text>
          <Text style={[styles.delPct, { color: palette.text }]}>93.20%</Text>
        </View>
        <Text style={[styles.dialText, { color: palette.textMuted }]}>Dial *223*4# to check data balance</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.surface }]}> 
          <Text style={[styles.label, { color: palette.textMuted }]}>Phone Number</Text>
          <View style={styles.row}>
            <TextInput
              value={phone}
              onChangeText={(t) => { setPhone(t); setVerified(false); }}
              placeholder="Phone number"
              placeholderTextColor={palette.textMuted}
              keyboardType="phone-pad"
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

          {/* quick suggestion pills */}
          <View style={styles.pillsRow}>
            {['1GB','2GB','3GB','4GB','More'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.pill, { backgroundColor: palette.surface }]}
                onPress={() => { if (p === 'More') { setPackagesVisible(true); } else { setSelectedPackage({ id: p, title: p }); } }}
              >
                <Text style={{ color: palette.text }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.selectPackageButton, { backgroundColor: palette.surface }]} onPress={() => setPackagesVisible(true)}>
            <Text style={{ color: palette.textMuted }}>{selectedPackage ? selectedPackage.title : 'Select Package'}</Text>
            <Feather name="chevron-down" size={18} color={palette.textMuted} />
          </TouchableOpacity>

          {/* Amount box showing dynamic price for selected package */}
          <View style={[styles.amountBox, { backgroundColor: palette.surface }]}> 
            <Text style={{ color: palette.textMuted, fontSize: 12 }}>Amount</Text>
            <Text style={{ color: palette.text, fontWeight: '800', marginTop: 6 }}>
              {selectedPackage ? `₦${getAmountForPackage(selectedPackage).toFixed(2)}` : '—'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <TextInput
                value={voucher}
                onChangeText={setVoucher}
                placeholder="Apply voucher"
                placeholderTextColor={palette.textMuted}
                style={[styles.voucherInput, { color: palette.text, backgroundColor: palette.surface }]}
              />
              <TouchableOpacity style={[styles.applyVoucherButton, { backgroundColor: voucherApplied ? '#2ECC71' : palette.primary }]} onPress={applyVoucher}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{voucherApplied ? 'Applied' : 'Apply'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ marginTop: 8, color: palette.text, fontWeight: '800' }}>Payable: {selectedPackage ? `₦${getPayableAmount().toFixed(2)}` : '—'}</Text>
            {voucherApplied && <Text style={{ color: '#2ECC71', marginTop: 4 }}>Voucher applied: -₦{voucherDiscount}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: (verified && selectedPackage) ? palette.primary : '#777' }]}
            disabled={!verified || !selectedPackage || processing}
            onPress={startPurchase}
          >
            <Text style={styles.proceedText}>
              {!phone ? 'Insert number' : !selectedPackage ? 'Choose package' : 'Proceed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={packagesVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: palette.background }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Select Packages</Text>
              <TouchableOpacity onPress={() => setPackagesVisible(false)}>
                <Feather name="x" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Feather name="search" size={16} color={palette.textMuted} />
              <TextInput placeholder="Search..." placeholderTextColor={palette.textMuted} style={[styles.searchInput, { color: palette.text }]} />
            </View>

            <FlatList data={DUMMY_PACKAGES} keyExtractor={(i) => i.id} renderItem={renderPackage} contentContainerStyle={{ paddingBottom: 32 }} />
          </View>
        </View>
      </Modal>

      {/* processing overlay */}
      {processing && (
        <View style={styles.processingOverlay} pointerEvents="none">
          <Animated.View style={[styles.processingCircle, { transform: [{ scale: loadingAnim }], backgroundColor: palette.surface }]}> 
            <Image source={require('../../public/Cosmozpaylogo.jpeg')} style={styles.processingLogo} />
          </Animated.View>
        </View>
      )}

      {/* Authorization modal shown after processing */}
      <Modal visible={authVisible} animationType="slide" transparent>
        <View style={styles.authOverlay}>
          <View style={[styles.authSheet, { backgroundColor: palette.surface }]}> 
            <View style={styles.authHeader}>
              <Text style={[styles.authTitle, { color: palette.text }]}>Authorization Screen</Text>
              <TouchableOpacity onPress={() => setAuthVisible(false)}>
                <Feather name="x" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{selectedPackage?.title || 'Airtel Data Bundle'}</Text></View>
            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Recipient</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{phone}</Text></View>
            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{'₦' + getAmountForPackage(selectedPackage).toFixed(2)}</Text></View>
            <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Total Payable</Text><Text style={[styles.authValue, { color: '#E94B4B' }]}>{'₦' + getPayableAmount().toFixed(2)}</Text></View>

            <Text style={[styles.pinPrompt, { color: palette.text }]}>Enter Account Pin To Authorize</Text>
            <View style={styles.pinCircles}>
              {[0,1,2,3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.pinCircle,
                    {
                      borderColor: palette.textMuted,
                      backgroundColor: pin.length > i ? palette.primary : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>
            <TextInput
              ref={pinInputRef}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0,4))}
              keyboardType="numeric"
              maxLength={4}
              style={{ position: 'absolute', left: -1000, width: 1, height: 1, opacity: 0 }}
            />

            {biometricEnabled ? (
              <TouchableOpacity onPress={tryBiometricAuth} style={{ alignSelf: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="fingerprint" size={28} color={palette.primary} />
                  <Text style={{ color: palette.primary, fontWeight: '700' }}>Use fingerprint</Text>
                </View>
              </TouchableOpacity>
            ) : null}

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
  commissionText: { marginTop: 6, fontSize: 12 },
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
  selectPackageButton: { marginTop: 12, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proceedButton: { marginTop: 18, padding: 12, borderRadius: 10, alignItems: 'center' },
  proceedText: { color: '#fff', fontWeight: '700' },
  pillsRow: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { height: '60%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 12 },
  searchInput: { marginLeft: 8, flex: 1 },
  pkgRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 10 },
  pkgIconWrap: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pkgIcon: { width: 36, height: 36, resizeMode: 'contain' },
  pkgText: { flex: 1 },
  pkgTitle: { fontWeight: '700' },
  pkgSub: { fontSize: 12, marginTop: 2 },
  pkgSelect: { paddingLeft: 8 },
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
  amountBox: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'flex-start' },
  voucherInput: { flex: 1, padding: 10, borderRadius: 8, marginRight: 8 },
  applyVoucherButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
});
