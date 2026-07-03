import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, ScrollView, Image, Modal, Animated } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';
import KeyboardWrapper from '../components/KeyboardWrapper';

const PROVIDER_LABELS = {
  ibedc: 'IBEDC',
  ikedc: 'IKEDC',
  eedc_ekop: 'EEDC (EKO-PHCN)',
  kedco: 'KEDCO',
  phed: 'PHED',
  jed: 'JED',
  aedc: 'AEDC',
  eedc_enugu: 'EEDC (ENUGU)',
  bedc: 'BEDC (Benin)',
  kaedco: 'KAEDCO',
  ikeja: 'IKEJA ELECTRIC',
  ebe: 'EEDC (Ben)'
};

export default function ElectricityProviderScreen({ user, onBack, themeMode = 'dark', providerKey, onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const label = PROVIDER_LABELS[providerKey] || providerKey;
  const [meter, setMeter] = useState('');
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
    const payload = { provider: providerKey, meter, amount: Number((amount || '0').replace(/,/g, '')), timestamp: Date.now() };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  useEffect(() => {
    if (authVisible) setTimeout(() => safeFocus(pinInputRef), 220);
  }, [authVisible]);

  // Dummy delivery rate for now, could be fetched
  const deliveryRate = 78; // percentage
  const safeTop = getSafeTop();

  // Local logos in public/ — prefer these so the provider page shows a clear badge
  const LOCAL_LOGOS = {
    ibedc: require('../../public/IBEDC.png'),
    ikedc: require('../../public/IKEDC.png'),
    eedc_ekop: require('../../public/EKEDC.png'),
    kedco: require('../../public/KEDCO.png'),
    phed: require('../../public/PHED.png'),
    jed: require('../../public/JED.png'),
    aedc: require('../../public/AEDC.png'),
    eedc_enugu: require('../../public/EEDC.png'),
    bedc: require('../../public/BEDC.png'),
    kaedco: require('../../public/KAEDCO.png'),
    ikeja: require('../../public/IKEDC.png'),
  };
  const providerLogo = LOCAL_LOGOS[providerKey];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{`Buy Meter Token`}</Text>
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
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Buy Meter Token</Text>
              {providerLogo ? (
                <View style={[styles.providerLogoSectionWrap, { backgroundColor: palette.surface }]}> 
                  <Image source={providerLogo} style={styles.providerLogoSectionImg} resizeMode={"contain"} />
                </View>
              ) : null}
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${deliveryRate}%`, backgroundColor: '#4caf50' }]} />
                <View style={styles.progressCenterText}><Text style={[styles.progressText, { color: palette.text }]}>{`${deliveryRate}%`}</Text></View>
              </View>
              <Text style={[styles.providerText, { color: palette.textMuted }]}>{`${label} Delivery Rate Nationwide`}</Text>
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Meter Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { color: palette.text, backgroundColor: palette.surface } ]}
                placeholder="Meter Number"
                placeholderTextColor={palette.textMuted}
                value={meter}
                onChangeText={setMeter}
                keyboardType="number-pad"
                autoComplete="off"
                importantForAutofill="no"
              />
                <TouchableOpacity style={[styles.checkButton, { backgroundColor: palette.primary }]} onPress={() => {/* verify meter */}}>
                  <Feather name="check" size={20} color={palette.iconOnPrimary} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: palette.text, marginTop: 12 }]}>Amount</Text>
            <TextInput
              style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]}
              placeholder="Enter amount"
              placeholderTextColor={palette.textMuted}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9\.]/g, ''))}
              keyboardType="numeric"
            />

            <Text style={[styles.chooseText, { color: '#E53935' }]}>Choose from your contacts</Text>

            <TouchableOpacity
              style={[styles.proceedButton, { backgroundColor: (meter && Number((amount || '0').replace(/,/g, '')) > 0) ? palette.primary : '#777' }]}
              disabled={!meter || Number((amount || '0').replace(/,/g, '')) <= 0}
              onPress={startPurchase}
            >
              <Text style={[styles.proceedText, { color: palette.iconOnPrimary }]}>Proceed</Text>
            </TouchableOpacity>
          </View>
  </KeyboardWrapper>
  {/* Processing overlay (app logo) shown while starting purchase */}
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

        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{'Meter Token'}</Text></View>
        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Recipient</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{meter}</Text></View>
        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{'₦' + Number((amount || '0').replace(/,/g, '')).toLocaleString()}</Text></View>
        <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Total Payable</Text><Text style={[styles.authValue, { color: '#E94B4B' }]}>{'₦' + Number((amount || '0').replace(/,/g, '')).toLocaleString()}</Text></View>

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
  providerLogoWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 8, overflow: 'hidden' },
  providerLogoImg: { width: '100%', height: '100%' },
  depositButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  providerLogoSectionWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 12, overflow: 'hidden' },
  providerLogoSectionImg: { width: '90%', height: '90%' },
  depositText: { color: '#fff', fontWeight: '700' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  content: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 6, marginBottom: 8 },
  progressWrap: { marginVertical: 8, alignItems: 'center' },
  progressBarBg: { width: '100%', height: 18, backgroundColor: '#dfe6e9', borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressText: { fontWeight: '700' },
  progressCenterText: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  providerText: { marginTop: 6, fontSize: 12, fontWeight: '700' },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderRadius: 10, padding: 14, fontSize: 16, marginRight: 8 },
  checkButton: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chooseText: { marginTop: 8 },
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
