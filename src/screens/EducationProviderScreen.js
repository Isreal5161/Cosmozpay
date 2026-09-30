import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, Modal, Animated, Image } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';
import KeyboardWrapper from '../components/KeyboardWrapper';

const EXAM_TYPES = [
  { key: 'jamb', label: 'JAMB Pin', price: 1500 },
  { key: 'waec', label: 'WAEC Pin', price: 2000 },
  { key: 'neco', label: 'NECO Pin', price: 1200 },
  { key: 'post_utme', label: 'Post-UTME Pin', price: 1000 },
];

export default function EducationProviderScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();

  const [selected, setSelected] = useState(EXAM_TYPES[0].key);
  const [quantity, setQuantity] = useState('1');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');

  const sel = EXAM_TYPES.find((e) => e.key === selected) || EXAM_TYPES[0];
  const qty = Math.max(1, parseInt(quantity || '1', 10) || 1);
  const total = sel.price * qty;
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
    const payload = { provider: 'education', examType: sel.key, quantity: qty, total, deliverTo: phoneOrEmail, timestamp: Date.now() };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  useEffect(() => {
    if (authVisible) setTimeout(() => safeFocus(pinInputRef), 220);
  }, [authVisible]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Buy Exam PINs</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={[styles.depositText, { color: palette.iconOnPrimary }]}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

  <KeyboardWrapper contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Select Exam Type</Text>
            <View style={styles.optionsRow}>
              {EXAM_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.option, selected === t.key && { borderColor: palette.primary, backgroundColor: palette.surface }]}
                  onPress={() => setSelected(t.key)}
                >
                  <Text style={[styles.optionLabel, { color: palette.text }]}>{t.label}</Text>
                  <Text style={[styles.optionPrice, { color: palette.textMuted }]}>NGN {t.price.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Quantity</Text>
            <TextInput
              style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]}
              keyboardType="number-pad"
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
            />

            <Text style={[styles.inputLabel, { color: palette.text }]}>Phone or Email (delivery)</Text>
            <TextInput
              style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]}
              placeholder="e.g. 0803XXXXXXX or you@example.com"
              placeholderTextColor={palette.textMuted}
              value={phoneOrEmail}
              onChangeText={setPhoneOrEmail}
              autoComplete="off"
            />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.text }]}>Total</Text>
              <Text style={[styles.summaryAmount, { color: palette.text }]}>NGN {total.toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={[styles.proceedButton, { backgroundColor: palette.primary }]} onPress={startPurchase}>
              <Text style={[styles.proceedText, { color: palette.iconOnPrimary }]}>Buy PINs</Text>
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

                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{sel.label || 'Exam PIN'}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Delivery</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{phoneOrEmail || '-'}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{'₦' + total.toLocaleString()}</Text></View>

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
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 6, marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginRight: 8, marginBottom: 8, minWidth: 140 },
  optionLabel: { fontWeight: '700' },
  optionPrice: { marginTop: 6, fontSize: 12 },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  input: { borderRadius: 10, padding: 14, fontSize: 16, marginTop: 8 },
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
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  processingCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  processingLogo: { width: 40, height: 40, resizeMode: 'contain' },
});
