import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, Image, Modal, Animated } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';
import KeyboardWrapper from '../components/KeyboardWrapper';

const PROVIDERS = [
  { key: 'mtn', label: 'MTN' },
  { key: 'glo', label: 'GLO' },
  { key: 'airtel', label: 'Airtel' },
  { key: 'ninemobile', label: '9mobile' },
];

const PROVIDER_LOGOS = {
  mtn: require('../../public/mtn-logo.png'),
  glo: require('../../public/Glo-logo.png'),
  airtel: require('../../public/airtel-logo.png'),
  ninemobile: require('../../public/9mobile-logo.png'),
};

const FEE_RATES = {
  mtn: 5, // percent
  glo: 6,
  airtel: 5,
  ninemobile: 7,
};

export default function AirtimeToCashScreen({ user, onBack, themeMode = 'dark', onSuccess }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();
  const [selected, setSelected] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [pin, setPin] = useState('');
  const pinInputRef = useRef(null);
  const safeFocus = (r) => { try { r?.current?.focus?.(); } catch (e) {} };
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
    const payload = { provider: selected, phone, amount, timestamp: Date.now() };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  useEffect(() => {
    if (authVisible) setTimeout(() => safeFocus(pinInputRef), 220);
  }, [authVisible]);

  const numericAmount = Number(amount.replace(/,/g, '')) || 0;
  const feeRate = FEE_RATES[selected] || 0;
  const fee = useMemo(() => Math.max(0, (numericAmount * feeRate) / 100), [numericAmount, feeRate]);
  const net = useMemo(() => Math.max(0, numericAmount - fee), [numericAmount, fee]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{`Airtime to Cash`}</Text>
        <View style={styles.headerRight} />
      </View>

  <KeyboardWrapper contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose Network</Text>
            <View style={styles.providerGrid}>
              {PROVIDERS.map((p) => (
                <TouchableOpacity key={p.key} style={[styles.providerCard, selected === p.key ? { borderColor: palette.primary, borderWidth: 2 } : null, { backgroundColor: palette.surface }]} onPress={() => setSelected(p.key)}>
                  <View style={[styles.providerBadge, { backgroundColor: palette.surfaceRaised }]}>
                    {PROVIDER_LOGOS[p.key] ? (
                      <Image source={PROVIDER_LOGOS[p.key]} style={styles.providerLogo} resizeMode="contain" />
                    ) : (
                      <Text style={[styles.providerInitial, { color: palette.text }]}>{p.label.replace(/[^A-Z0-9]/g, '').slice(0,2)}</Text>
                    )}
                  </View>
                  <Text style={[styles.providerLabel, { color: palette.text }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Sender Phone Number</Text>
            <TextInput style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]} placeholder="Enter sender phone" placeholderTextColor={palette.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={[styles.inputLabel, { color: palette.text }]}>Amount to convert (NGN)</Text>
            <TextInput style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]} placeholder="Enter amount" placeholderTextColor={palette.textMuted} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9,\.]/g, ''))} keyboardType="numeric" />

            <View style={[styles.previewCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.previewRow, { color: palette.text }]}>Provider fee ({feeRate}%): <Text style={[styles.previewValue, { color: palette.text }]}>{fee.toFixed(2)}</Text></Text>
              <Text style={[styles.previewRow, { color: palette.text }]}>You receive: <Text style={[styles.previewValue, { color: palette.text }]}>{net.toFixed(2)}</Text></Text>
            </View>

            <TouchableOpacity style={[styles.proceedButton, { backgroundColor: palette.primary }]} onPress={startPurchase}>
              <Text style={[styles.proceedText, { color: palette.iconOnPrimary }]}>Convert Airtime</Text>
            </TouchableOpacity>
          </View>
  </KeyboardWrapper>
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

        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{'Airtime to Cash'}</Text></View>
        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Sender</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{phone || '-'}</Text></View>
        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{amount || '-'}</Text></View>

        <Text style={[styles.pinPrompt, { color: palette.text }]}>Enter Account Pin To Authorize</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => safeFocus(pinInputRef)} style={styles.pinCircles}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  content: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  providerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  providerCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8, marginRight: 8 },
  providerBadge: { width: 56, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  providerLogo: { width: 48, height: 48 },
  providerInitial: { fontSize: 16, fontWeight: '800' },
  providerLabel: { fontWeight: '700' },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  input: { borderRadius: 8, padding: 12, marginTop: 8 },
  proceedButton: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: '#fff', fontWeight: '800' },
  previewCard: { borderRadius: 10, padding: 12, marginTop: 12 },
  previewRow: { fontSize: 14, marginBottom: 6 },
  previewValue: { fontWeight: '800' },
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
